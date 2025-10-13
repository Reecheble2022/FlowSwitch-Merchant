import { supabase } from './supabase';

export interface PromptNowParams {
  agentIds: string[];
  message: string;
}

export const promptApi = {
  async sendNow(params: PromptNowParams): Promise<{ success: boolean; count: number }> {
    const { agentIds, message } = params;

    if (!agentIds || agentIds.length === 0) {
      throw new Error('At least one agent must be selected');
    }

    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    const userId = (await supabase.auth.getUser()).data.user?.id || 'system';
    const timestamp = new Date().toISOString();

    const prompts = agentIds.map(agentId => ({
      agent_id: agentId,
      message: message.trim(),
      status: 'sent',
      sent_at: timestamp,
      created_by: userId,
    }));

    const { data, error } = await supabase
      .from('prompts')
      .insert(prompts)
      .select();

    if (error) throw error;

    return { success: true, count: data.length };
  },

  async getHistory(agentId?: string, limit = 50): Promise<any[]> {
    let query = supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  },
};
