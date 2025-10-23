export type UserRole = 'ADMIN' | 'MERCHANT' | 'AGENT_READONLY';

export type MerchantStatus = 'active' | 'inactive';

export type AgentCategory = 'individual' | 'shop' | 'salon' | 'clinic';

export type AgentStatus = 'active' | 'pending' | 'suspended';

export type PromptStatus = 'verified' | 'pending' | 'rejected';

export type FloatType = 'credit' | 'debit';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Merchant {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  status: MerchantStatus;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  merchant_id: string;
  first_name: string;
  last_name: string;
  category: AgentCategory;
  national_id: string;
  phone: string;
  photo_url: string | null;
  status: AgentStatus;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
  merchant?: Merchant;
}

export interface AgentVerification {
  id: string;
  agent_id: string;
  verifier_user_id: string;
  latitude: number;
  longitude: number;
  notes: string | null;
  verified_at: string;
  created_at: string;
  verifier?: User;
}

export interface CashNote {
  id: string;
  agent_id: string;
  amount: number;
  currency: string;
  receipt_id: string;
  verified: boolean;
  verified_at: string | null;
  verifier_user_id: string | null;
  created_at: string;
  verifier?: User;
}

export interface PromptVerification {
  id: string;
  agent_id: string;
  prompt_text: string;
  status: PromptStatus;
  actioned_at: string | null;
  created_at: string;
}

export interface FloatLedger {
  id: string;
  agent_id: string;
  type: FloatType;
  amount: number;
  currency: string;
  reference: string;
  created_at: string;
}

export interface AgentWithStats extends Agent {
  verified_prompts_count: number;
  pending_prompts_count: number;
  verification_count: number;
  last_verification_date: string | null;
}

export interface DashboardKPIs {
  verifiable_agents: number;
  verified_cash_notes: number;
  pending_prompts: number;
  active_merchants: number;
}

export interface ActivityItem {
  id: string;
  type: 'verification' | 'cash_note' | 'float' | 'prompt';
  agent_name: string;
  description: string;
  timestamp: string;
}

export type PromptChannel = 'sms' | 'whatsapp' | 'app';
export type PromptScheduleStatus = 'active' | 'paused' | 'cancelled' | 'completed';
export type PromptDispatchStatus = 'pending' | 'delivered' | 'failed';

export interface PromptScheduleRule {
  type: 'one_time' | 'times_total' | 'every_n_days';
  sendTime?: string;
  timesTotal?: number;
  everyNDays?: number;
  randomWindow?: { start: string; end: string };
  options?: {
    quietHours?: boolean;
    skipWeekends?: boolean;
    retry?: {
      enabled: boolean;
      intervalMins: number;
      maxRetries: number;
    };
  };
}

export interface PromptSchedule {
  id: string;
  agent_ids: string[];
  rule: PromptScheduleRule;
  start_date: string;
  end_date: string;
  channel: PromptChannel;
  status: PromptScheduleStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PromptDispatch {
  id: string;
  schedule_id: string;
  agent_id: string;
  scheduled_for: string;
  status: PromptDispatchStatus;
  delivered_at?: string;
  failed_reason?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface PromptPreview {
  dates: string[];
  count: number;
  warnings: string[];
}

export interface GeocodedPlace {
  country: string;
  region: string;
  cityOrNearest: string;
  distanceKm: number;
  source: 'offline' | 'online';
}

export interface ClusterInfo {
  id: string;
  centroid: { lat: number; lng: number };
  radius: number;
  pointCount: number;
  shareOfTotal: number;
  points: Array<{ id: string; lat: number; lng: number; timestamp: string }>;
}

export interface DetailedLocation {
  country: string;
  countryName: string;
  provinceOrState: string;
  city: string;
  townOrSuburb?: string;
  nearestPlace: string;
  distanceKmToNearest: number;
  source: 'offline' | 'online';
}

export interface LocationPhoto {
  url: string;
  caption: string;
  source: 'wikimedia' | 'unsplash' | 'offline';
  attribution: string;
  used: 'online' | 'offline';
}

export interface LocationBlurb {
  text: string;
  facts: string[];
  mode: 'deterministic' | 'ai-refined';
}

export interface AgentAIReport {
  agent: {
    id: string;
    name: string;
    merchant: string;
  };
  summary: {
    totalVerifications: number;
    dateRange: { start: string; end: string };
    primaryLocation?: DetailedLocation;
  };
  clusters: ClusterInfo[];
  primaryCluster: ClusterInfo | null;
  outliers: Array<{ id: string; lat: number; lng: number; distanceFromPrimary: number }>;
  movement: {
    totalDistanceKm: number;
    lastMovementKm: number;
  };
  placeSummary: Record<string, number>;
  narrative: string;
  generatedAt: string;
  mode: 'offline' | 'ai-refined';
  locationPhoto?: LocationPhoto;
  locationBlurb?: LocationBlurb;
}

export type ChatRole = 'user' | 'analyst' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  actionChips?: Array<{ label: string; action: string; icon?: string }>;
  streaming?: boolean;
}

export interface ChatSession {
  id: string;
  agentIds: string[];
  dateRange: { start: string; end: string };
  report: AgentAIReport | null;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
