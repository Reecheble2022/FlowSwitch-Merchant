import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const agentSchema = z.object({
  merchant_id: z.string().uuid('Invalid merchant ID'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  category: z.enum(['individual', 'shop', 'salon', 'clinic']),
  national_id: z.string().min(1, 'National ID is required'),
  phone: z.string().min(1, 'Phone number is required'),
  photo_url: z.string().url().optional().nullable(),
  status: z.enum(['active', 'pending', 'suspended']).default('pending'),
});

export const agentUpdateSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  category: z.enum(['individual', 'shop', 'salon', 'clinic']).optional(),
  national_id: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  photo_url: z.string().url().optional().nullable(),
  status: z.enum(['active', 'pending', 'suspended']).optional(),
});

export const verificationSchema = z.object({
  agent_id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  notes: z.string().optional().nullable(),
});

export const cashNoteSchema = z.object({
  agent_id: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  receipt_id: z.string().min(1, 'Receipt ID is required'),
});

export const verifyCashNoteSchema = z.object({
  verified: z.boolean(),
});

export const merchantSchema = z.object({
  name: z.string().min(1, 'Merchant name is required'),
  contact_name: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const promptVerificationSchema = z.object({
  agent_id: z.string().uuid(),
  prompt_text: z.string().min(1, 'Prompt text is required'),
});

export const updatePromptStatusSchema = z.object({
  status: z.enum(['verified', 'pending', 'rejected']),
});

export const floatLedgerSchema = z.object({
  agent_id: z.string().uuid(),
  type: z.enum(['credit', 'debit']),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  reference: z.string().min(1, 'Reference is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type AgentInput = z.infer<typeof agentSchema>;
export type AgentUpdateInput = z.infer<typeof agentUpdateSchema>;
export type VerificationInput = z.infer<typeof verificationSchema>;
export type CashNoteInput = z.infer<typeof cashNoteSchema>;
export type MerchantInput = z.infer<typeof merchantSchema>;
export type PromptVerificationInput = z.infer<typeof promptVerificationSchema>;
export type FloatLedgerInput = z.infer<typeof floatLedgerSchema>;
