import { supabase } from './supabase';
import type {
  Agent,
  Merchant,
  AgentVerification,
  CashNote,
  PromptVerification,
  FloatLedger,
  DashboardKPIs,
  AgentWithStats,
  PromptSchedule,
  PromptScheduleRule,
  PromptDispatch,
  PromptPreview,
  PromptChannel,
} from '../types';
import type {
  AgentInput,
  AgentUpdateInput,
  VerificationInput,
  CashNoteInput,
  MerchantInput,
  FloatLedgerInput,
} from './validations';
import { generateScheduleDates } from './scheduling';

export const auth = {
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },
};

export const agents = {
  async list(params?: {
    merchantId?: string;
    query?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: Agent[]; count: number }> {
    let baseQuery = supabase
      .from('agents')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params?.status) {
      baseQuery = baseQuery.eq('status', params.status);
    }

    if (params?.query) {
      baseQuery = baseQuery.or(`first_name.ilike.%${params.query}%,last_name.ilike.%${params.query}%,national_id.ilike.%${params.query}%,phone.ilike.%${params.query}%`);
    }

    const pageSize = params?.pageSize || 50;
    const page = params?.page || 1;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    baseQuery = baseQuery.range(from, to);

    const { data: agentsData, error, count } = await baseQuery;

    if (error) throw new Error(error.message);

    const agentIds = agentsData?.map(a => a.id) || [];

    if (agentIds.length === 0) {
      return { data: [], count: 0 };
    }

    const { data: merchantLinks } = await supabase
      .from('agent_merchants')
      .select('agent_id, merchant:merchants(*)')
      .in('agent_id', agentIds);

    const merchantsByAgent = (merchantLinks || []).reduce((acc: any, link: any) => {
      if (!acc[link.agent_id]) acc[link.agent_id] = [];
      if (link.merchant) acc[link.agent_id].push(link.merchant);
      return acc;
    }, {});

    const agents = (agentsData || []).map((agent: any) => ({
      ...agent,
      merchants: merchantsByAgent[agent.id] || [],
    }));

    if (params?.merchantId) {
      const filtered = agents.filter((agent: any) =>
        agent.merchants.some((m: any) => m.id === params.merchantId)
      );
      return { data: filtered as Agent[], count: filtered.length };
    }

    return { data: agents as Agent[], count: count || 0 };
  },

  async getById(id: string): Promise<AgentWithStats | null> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const { data: merchantLinks } = await supabase
      .from('agent_merchants')
      .select('merchant:merchants(*)')
      .eq('agent_id', id);

    const merchants = (merchantLinks || []).map((link: any) => link.merchant).filter(Boolean);

    const [verificationCount, verifiedPromptsCount, pendingPromptsCount, lastVerification] = await Promise.all([
      supabase.from('agent_verifications').select('id', { count: 'exact', head: true }).eq('agent_id', id),
      supabase.from('prompt_verifications').select('id', { count: 'exact', head: true }).eq('agent_id', id).eq('status', 'verified'),
      supabase.from('prompt_verifications').select('id', { count: 'exact', head: true }).eq('agent_id', id).eq('status', 'pending'),
      supabase.from('agent_verifications').select('verified_at').eq('agent_id', id).order('verified_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    return {
      ...data,
      merchants,
      verified_prompts_count: verifiedPromptsCount.count || 0,
      pending_prompts_count: pendingPromptsCount.count || 0,
      verification_count: verificationCount.count || 0,
      last_verification_date: lastVerification.data?.verified_at || null,
    } as AgentWithStats;
  },

  async create(agent: AgentInput): Promise<Agent> {
    const { data, error } = await supabase
      .from('agents')
      .insert(agent)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Agent;
  },

  async update(id: string, updates: AgentUpdateInput): Promise<Agent> {
    const { data, error } = await supabase
      .from('agents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Agent;
  },

  async getVerifications(agentId: string): Promise<AgentVerification[]> {
    const { data, error } = await supabase
      .from('agent_verifications')
      .select('*, verifier:users(*)')
      .eq('agent_id', agentId)
      .order('verified_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as AgentVerification[];
  },

  async addVerification(verification: VerificationInput): Promise<AgentVerification> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('agent_verifications')
      .insert({ ...verification, verifier_user_id: user.id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as AgentVerification;
  },

  async getCashNotes(agentId: string): Promise<CashNote[]> {
    const { data, error } = await supabase
      .from('cash_notes')
      .select('*, verifier:users(*)')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as CashNote[];
  },

  async addCashNote(cashNote: CashNoteInput): Promise<CashNote> {
    const { data, error } = await supabase
      .from('cash_notes')
      .insert(cashNote)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as CashNote;
  },

  async verifyCashNote(id: string, verified: boolean): Promise<CashNote> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('cash_notes')
      .update({
        verified,
        verified_at: verified ? new Date().toISOString() : null,
        verifier_user_id: verified ? user.id : null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as CashNote;
  },

  async getPrompts(agentId: string): Promise<PromptVerification[]> {
    const { data, error } = await supabase
      .from('prompt_verifications')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as PromptVerification[];
  },

  async updatePromptStatus(id: string, status: 'verified' | 'pending' | 'rejected'): Promise<PromptVerification> {
    const { data, error } = await supabase
      .from('prompt_verifications')
      .update({
        status,
        actioned_at: status !== 'pending' ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as PromptVerification;
  },

  async getFloatLedger(agentId: string, page = 1, pageSize = 20): Promise<{ data: FloatLedger[]; count: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('float_ledger')
      .select('*', { count: 'exact' })
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);
    return { data: data as FloatLedger[], count: count || 0 };
  },

  async addFloatEntry(entry: FloatLedgerInput): Promise<FloatLedger> {
    const { data, error } = await supabase
      .from('float_ledger')
      .insert(entry)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as FloatLedger;
  },
};

export const merchants = {
  async list(): Promise<Merchant[]> {
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Merchant[];
  },

  async getById(id: string): Promise<Merchant | null> {
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as Merchant | null;
  },

  async create(merchant: MerchantInput): Promise<Merchant> {
    const { data, error } = await supabase
      .from('merchants')
      .insert(merchant)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Merchant;
  },

  async update(id: string, updates: Partial<MerchantInput>): Promise<Merchant> {
    const { data, error } = await supabase
      .from('merchants')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Merchant;
  },
};

export const dashboard = {
  async getKPIs(): Promise<DashboardKPIs> {
    const [agentsCount, verifiedCashNotesCount, pendingPromptsCount, activeMerchantsCount] = await Promise.all([
      supabase.from('agents').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('cash_notes').select('id', { count: 'exact', head: true }).eq('verified', true),
      supabase.from('prompt_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('merchants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    return {
      verifiable_agents: agentsCount.count || 0,
      verified_cash_notes: verifiedCashNotesCount.count || 0,
      pending_prompts: pendingPromptsCount.count || 0,
      active_merchants: activeMerchantsCount.count || 0,
    };
  },

  async getRecentActivity(limit = 10) {
    const [verifications, cashNotes, floatEntries] = await Promise.all([
      supabase
        .from('agent_verifications')
        .select('*, agent:agents(first_name, last_name)')
        .order('verified_at', { ascending: false })
        .limit(limit),
      supabase
        .from('cash_notes')
        .select('*, agent:agents(first_name, last_name)')
        .eq('verified', true)
        .order('verified_at', { ascending: false })
        .limit(limit),
      supabase
        .from('float_ledger')
        .select('*, agent:agents(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(limit),
    ]);

    const activities = [
      ...(verifications.data || []).map(v => ({
        id: v.id,
        type: 'verification' as const,
        agent_name: `${v.agent?.first_name} ${v.agent?.last_name}`,
        description: 'Agent verified',
        timestamp: v.verified_at,
      })),
      ...(cashNotes.data || []).map(c => ({
        id: c.id,
        type: 'cash_note' as const,
        agent_name: `${c.agent?.first_name} ${c.agent?.last_name}`,
        description: `Cash note verified: ${c.amount} ${c.currency}`,
        timestamp: c.verified_at || c.created_at,
      })),
      ...(floatEntries.data || []).map(f => ({
        id: f.id,
        type: 'float' as const,
        agent_name: `${f.agent?.first_name} ${f.agent?.last_name}`,
        description: `Float ${f.type}: ${f.amount} ${f.currency}`,
        timestamp: f.created_at,
      })),
    ];

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },
};

export const prompts = {
  async sendNow(agentIds: string[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const dispatches = agentIds.map(agentId => ({
      schedule_id: null,
      agent_id: agentId,
      scheduled_for: new Date().toISOString(),
      status: 'pending',
      retry_count: 0,
    }));

    const { error } = await supabase
      .from('prompt_dispatches')
      .insert(dispatches);

    if (error) throw new Error(error.message);

    setTimeout(async () => {
      await supabase
        .from('prompt_dispatches')
        .update({ status: 'delivered', delivered_at: new Date().toISOString() })
        .eq('status', 'pending')
        .in('agent_id', agentIds);
    }, 2000);
  },

  async previewSchedule(
    rule: PromptScheduleRule,
    startDate: string,
    endDate: string
  ): Promise<PromptPreview> {
    return generateScheduleDates(rule, startDate, endDate);
  },

  async createSchedule(
    agentIds: string[],
    rule: PromptScheduleRule,
    startDate: string,
    endDate: string,
    channel: PromptChannel = 'sms'
  ): Promise<PromptSchedule> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('prompt_schedules')
      .insert({
        agent_ids: agentIds,
        rule: rule as any,
        start_date: startDate,
        end_date: endDate,
        channel,
        status: 'active',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const preview = generateScheduleDates(rule, startDate, endDate);
    const dispatches = [];

    for (const agentId of agentIds) {
      for (const scheduledFor of preview.dates) {
        dispatches.push({
          schedule_id: data.id,
          agent_id: agentId,
          scheduled_for: scheduledFor,
          status: 'pending',
          retry_count: 0,
        });
      }
    }

    if (dispatches.length > 0) {
      await supabase.from('prompt_dispatches').insert(dispatches);
    }

    return data as PromptSchedule;
  },

  async getSchedules(agentId?: string, status?: string): Promise<PromptSchedule[]> {
    let query = supabase
      .from('prompt_schedules')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (agentId) {
      query = query.contains('agent_ids', [agentId]);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data as PromptSchedule[];
  },

  async updateScheduleStatus(scheduleId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('prompt_schedules')
      .update({ status })
      .eq('id', scheduleId);

    if (error) throw new Error(error.message);
  },

  async getDispatches(scheduleId: string): Promise<PromptDispatch[]> {
    const { data, error } = await supabase
      .from('prompt_dispatches')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('scheduled_for', { ascending: true });

    if (error) throw new Error(error.message);
    return data as PromptDispatch[];
  },
};
