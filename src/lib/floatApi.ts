import { supabase } from './supabase';

export interface FloatAccount {
  id: string;
  owner_type: 'system' | 'merchant' | 'agent';
  owner_id: string;
  balance: number;
  available: number;
  holds: number;
  limits_json: any;
  status: 'active' | 'suspended' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface FloatTransaction {
  id: string;
  account_id: string;
  type: 'credit' | 'debit' | 'reserve' | 'release' | 'redeem';
  amount: number;
  balance_after: number;
  reason: string;
  meta: any;
  created_at: string;
  created_by: string;
}

export interface FloatHold {
  id: string;
  account_id: string;
  amount: number;
  purpose: string;
  reference_type: 'voucher';
  reference_id: string;
  status: 'active' | 'consumed' | 'released' | 'expired';
  expires_at: string;
  created_at: string;
}

export interface Voucher {
  id: string;
  code: string;
  checksum: string;
  issuer_account_id: string;
  issuer_hold_id: string;
  amount: number;
  purpose: string;
  eligible_redeemer_type: 'any' | 'agent' | 'merchant';
  eligible_redeemer_id?: string;
  status: 'active' | 'redeemed' | 'voided' | 'expired';
  expires_at?: string;
  created_at: string;
  redeemed_at?: string;
  redeemed_by?: string;
}

export interface VoucherRedemption {
  id: string;
  voucher_id: string;
  redeemer_account_id: string;
  amount: number;
  location_lat?: number;
  location_lng?: number;
  redeemed_at: string;
  redeemed_by: string;
}

export interface AssignFloatParams {
  agentId: string;
  amount: number;
  sourceAccountId: string;
  reason?: string;
}

export interface TopUpParams {
  accountId: string;
  amount: number;
  reason?: string;
  meta?: any;
}

export interface DebitParams {
  accountId: string;
  amount: number;
  reason?: string;
  meta?: any;
}

export interface UpdateLimitsParams {
  accountId: string;
  limitsJson: any;
  status?: 'active' | 'suspended' | 'closed';
}

export interface CreateVouchersParams {
  issuerAccountId: string;
  count: number;
  amountEach: number;
  purpose: string;
  eligibleRedeemerType: 'any' | 'agent' | 'merchant';
  eligibleRedeemerId?: string;
  expiresInDays?: number;
  idempotencyKey: string;
}

export interface VoucherPreview {
  totalAmount: number;
  requiredHold: number;
  availableBalance: number;
  canCreate: boolean;
  warnings: string[];
}

export interface RedeemVoucherParams {
  code: string;
  checksum: string;
  redeemerAccountId: string;
  locationLat?: number;
  locationLng?: number;
  idempotencyKey: string;
}

export const floatApi = {
  async assignFloat(params: AssignFloatParams): Promise<{ success: boolean; transactions: any[] }> {
    const { agentId, amount, sourceAccountId, reason } = params;

    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const { data: agentAccount, error: agentError } = await supabase
      .from('float_accounts')
      .select('*')
      .eq('owner_type', 'agent')
      .eq('owner_id', agentId)
      .maybeSingle();

    if (agentError) throw agentError;

    let agentAccountId = agentAccount?.id;

    if (!agentAccount) {
      const { data: newAccount, error: createError } = await supabase
        .from('float_accounts')
        .insert({
          owner_type: 'agent',
          owner_id: agentId,
          status: 'active',
        })
        .select()
        .single();

      if (createError) throw createError;
      agentAccountId = newAccount.id;
    }

    const timestamp = new Date().toISOString();
    const userId = (await supabase.auth.getUser()).data.user?.id || 'system';

    const { data: sourceBalance } = await supabase.rpc('get_float_available', {
      p_account_id: sourceAccountId,
    });

    if (sourceBalance < amount) {
      throw new Error('Insufficient balance in source account');
    }

    const transactions = [
      {
        account_id: sourceAccountId,
        type: 'debit',
        amount: -amount,
        reason: reason || `Transfer to agent ${agentId}`,
        meta: { transfer_to: agentAccountId, transfer_type: 'assign' },
        created_by: userId,
        created_at: timestamp,
      },
      {
        account_id: agentAccountId,
        type: 'credit',
        amount: amount,
        reason: reason || `Float assigned from source`,
        meta: { transfer_from: sourceAccountId, transfer_type: 'assign' },
        created_by: userId,
        created_at: timestamp,
      },
    ];

    const { data, error } = await supabase
      .from('float_transactions')
      .insert(transactions)
      .select();

    if (error) throw error;

    return { success: true, transactions: data };
  },

  async creditAccount(params: TopUpParams): Promise<FloatTransaction> {
    const { accountId, amount, reason, meta } = params;

    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const userId = (await supabase.auth.getUser()).data.user?.id || 'system';

    const { data, error } = await supabase
      .from('float_transactions')
      .insert({
        account_id: accountId,
        type: 'credit',
        amount: amount,
        reason: reason || 'Top-up',
        meta: meta || {},
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async debitAccount(params: DebitParams): Promise<FloatTransaction> {
    const { accountId, amount, reason, meta } = params;

    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const { data: available } = await supabase.rpc('get_float_available', {
      p_account_id: accountId,
    });

    if (available < amount) {
      throw new Error('Insufficient available balance');
    }

    const userId = (await supabase.auth.getUser()).data.user?.id || 'system';

    const { data, error } = await supabase
      .from('float_transactions')
      .insert({
        account_id: accountId,
        type: 'debit',
        amount: -amount,
        reason: reason || 'Adjustment',
        meta: meta || {},
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async updateLimits(params: UpdateLimitsParams): Promise<FloatAccount> {
    const { accountId, limitsJson, status } = params;

    const updates: any = { limits_json: limitsJson };
    if (status) updates.status = status;

    const { data, error } = await supabase
      .from('float_accounts')
      .update(updates)
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async getLedger(accountId: string, limit = 100): Promise<FloatTransaction[]> {
    const { data, error } = await supabase
      .from('float_transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data;
  },

  async getAccounts(filters?: { ownerType?: string; status?: string }): Promise<FloatAccount[]> {
    let query = supabase.from('float_accounts').select('*');

    if (filters?.ownerType) query = query.eq('owner_type', filters.ownerType);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return data;
  },
};

export const voucherApi = {
  async preview(params: Omit<CreateVouchersParams, 'idempotencyKey'>): Promise<VoucherPreview> {
    const { issuerAccountId, count, amountEach } = params;

    const totalAmount = count * amountEach;

    const { data: available } = await supabase.rpc('get_float_available', {
      p_account_id: issuerAccountId,
    });

    const canCreate = available >= totalAmount;

    const warnings: string[] = [];
    if (!canCreate) {
      warnings.push(`Insufficient balance. Required: ${totalAmount}, Available: ${available}`);
    }
    if (count > 1000) {
      warnings.push('Creating more than 1000 vouchers may take some time');
    }

    return {
      totalAmount,
      requiredHold: totalAmount,
      availableBalance: available,
      canCreate,
      warnings,
    };
  },

  async create(params: CreateVouchersParams): Promise<{ vouchers: Voucher[]; hold: FloatHold }> {
    const {
      issuerAccountId,
      count,
      amountEach,
      purpose,
      eligibleRedeemerType,
      eligibleRedeemerId,
      expiresInDays,
      idempotencyKey,
    } = params;

    const existing = await supabase
      .from('vouchers')
      .select('id')
      .eq('meta->>idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existing.data) {
      const { data: vouchers } = await supabase
        .from('vouchers')
        .select('*')
        .eq('meta->>idempotency_key', idempotencyKey);

      const { data: hold } = await supabase
        .from('float_holds')
        .select('*')
        .eq('id', vouchers?.[0]?.issuer_hold_id)
        .single();

      return { vouchers: vouchers || [], hold: hold! };
    }

    const totalAmount = count * amountEach;

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const userId = (await supabase.auth.getUser()).data.user?.id || 'system';

    const { data: hold, error: holdError } = await supabase
      .from('float_holds')
      .insert({
        account_id: issuerAccountId,
        amount: totalAmount,
        purpose: `Voucher hold: ${purpose}`,
        reference_type: 'voucher',
        reference_id: idempotencyKey,
        status: 'active',
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (holdError) throw holdError;

    const vouchers: any[] = [];
    for (let i = 0; i < count; i++) {
      const code = generateVoucherCode();
      const checksum = generateChecksum(code);

      vouchers.push({
        code,
        checksum,
        issuer_account_id: issuerAccountId,
        issuer_hold_id: hold.id,
        amount: amountEach,
        purpose,
        eligible_redeemer_type: eligibleRedeemerType,
        eligible_redeemer_id: eligibleRedeemerId || null,
        status: 'active',
        expires_at: expiresAt,
        created_by: userId,
        meta: { idempotency_key: idempotencyKey },
      });
    }

    const { data: createdVouchers, error: voucherError } = await supabase
      .from('vouchers')
      .insert(vouchers)
      .select();

    if (voucherError) {
      await supabase.from('float_holds').update({ status: 'released' }).eq('id', hold.id);
      throw voucherError;
    }

    return { vouchers: createdVouchers, hold };
  },

  async redeem(params: RedeemVoucherParams): Promise<VoucherRedemption> {
    const { code, checksum, redeemerAccountId, locationLat, locationLng, idempotencyKey } = params;

    const existing = await supabase
      .from('voucher_redeems')
      .select('*')
      .eq('meta->>idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existing.data) return existing.data;

    const { data: voucher, error: voucherError } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', code)
      .single();

    if (voucherError || !voucher) {
      throw new Error('Invalid voucher code');
    }

    if (voucher.checksum !== checksum) {
      throw new Error('Invalid voucher checksum');
    }

    if (voucher.status !== 'active') {
      throw new Error(`Voucher is ${voucher.status}`);
    }

    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      throw new Error('Voucher has expired');
    }

    if (
      voucher.eligible_redeemer_type !== 'any' &&
      voucher.eligible_redeemer_id !== redeemerAccountId
    ) {
      throw new Error('You are not eligible to redeem this voucher');
    }

    const userId = (await supabase.auth.getUser()).data.user?.id || 'system';
    const timestamp = new Date().toISOString();

    await supabase
      .from('float_holds')
      .update({ status: 'consumed' })
      .eq('id', voucher.issuer_hold_id);

    const transactions = [
      {
        account_id: voucher.issuer_account_id,
        type: 'debit',
        amount: -voucher.amount,
        reason: `Voucher redeemed: ${voucher.code}`,
        meta: { voucher_id: voucher.id, redeemer_account_id: redeemerAccountId },
        created_by: userId,
        created_at: timestamp,
      },
      {
        account_id: redeemerAccountId,
        type: 'credit',
        amount: voucher.amount,
        reason: `Voucher redemption: ${voucher.code}`,
        meta: { voucher_id: voucher.id, issuer_account_id: voucher.issuer_account_id },
        created_by: userId,
        created_at: timestamp,
      },
    ];

    await supabase.from('float_transactions').insert(transactions);

    await supabase
      .from('vouchers')
      .update({
        status: 'redeemed',
        redeemed_at: timestamp,
        redeemed_by: userId,
      })
      .eq('id', voucher.guid);

    const { data: redemption, error: redeemError } = await supabase
      .from('voucher_redeems')
      .insert({
        voucher_id: voucher.guid,
        redeemer_account_id: redeemerAccountId,
        amount: voucher.amount,
        location_lat: locationLat || null,
        location_lng: locationLng || null,
        redeemed_by: userId,
        meta: { idempotency_key: idempotencyKey },
      })
      .select()
      .single();

    if (redeemError) throw redeemError;

    return redemption;
  },

  async void(voucherId, reason) {
    const { data: voucher } = await supabase
      .from('vouchers')
      .select('*')
      .eq('id', voucherId)
      .single();

    if (!voucher) throw new Error('Voucher not found');

    if (voucher.status !== 'active') {
      throw new Error(`Cannot void ${voucher.status} voucher`);
    }

    await supabase.from('vouchers').update({ status: 'voided' }).eq('id', voucherId);

    await supabase
      .from('float_holds')
      .update({ status: 'released' })
      .eq('id', voucher.issuer_hold_id);
  },

  async list(filters?: {
    status?: string;
    issuerAccountId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ vouchers: Voucher[]; total: number }> {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('vouchers').select('*', { count: 'exact' });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.issuerAccountId) query = query.eq('issuer_account_id', filters.issuerAccountId);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return { vouchers: data || [], total: count || 0 };
  },
};

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'FS-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateChecksum(code: string): string {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).toUpperCase().substring(0, 8);
}
