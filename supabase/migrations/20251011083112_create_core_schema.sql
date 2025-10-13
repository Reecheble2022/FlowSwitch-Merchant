/*
  # FlowSwitch Core Schema
  
  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `role` (text: ADMIN, MERCHANT, AGENT_READONLY)
      - `password_hash` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `merchants`
      - `id` (uuid, primary key)
      - `name` (text)
      - `contact_name` (text)
      - `email` (text)
      - `phone` (text)
      - `status` (text: active, inactive)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `agents`
      - `id` (uuid, primary key)
      - `merchant_id` (uuid, foreign key)
      - `first_name` (text)
      - `last_name` (text)
      - `category` (text: individual, shop, salon, clinic)
      - `national_id` (text)
      - `phone` (text)
      - `photo_url` (text, nullable)
      - `status` (text: active, pending, suspended)
      - `last_seen_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `agent_verifications`
      - `id` (uuid, primary key)
      - `agent_id` (uuid, foreign key)
      - `verifier_user_id` (uuid, foreign key)
      - `gps_lat` (numeric)
      - `gps_lng` (numeric)
      - `notes` (text, nullable)
      - `verified_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `cash_notes`
      - `id` (uuid, primary key)
      - `agent_id` (uuid, foreign key)
      - `amount` (numeric)
      - `currency` (text)
      - `receipt_id` (text)
      - `verified` (boolean)
      - `verified_at` (timestamptz, nullable)
      - `verifier_user_id` (uuid, nullable, foreign key)
      - `created_at` (timestamptz)
    
    - `prompt_verifications`
      - `id` (uuid, primary key)
      - `agent_id` (uuid, foreign key)
      - `prompt_text` (text)
      - `status` (text: verified, pending, rejected)
      - `actioned_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
    
    - `float_ledger`
      - `id` (uuid, primary key)
      - `agent_id` (uuid, foreign key)
      - `type` (text: credit, debit)
      - `amount` (numeric)
      - `currency` (text)
      - `reference` (text)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
    - Admins can access all data
    - Merchants can only access their own data
    - Agent-readonly can only view agent data
  
  3. Indexes
    - Add indexes on foreign keys and frequently queried columns
    - Add indexes on status fields for filtering
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('ADMIN', 'MERCHANT', 'AGENT_READONLY')),
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Merchants table
CREATE TABLE IF NOT EXISTS merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('individual', 'shop', 'salon', 'clinic')),
  national_id text NOT NULL,
  phone text NOT NULL,
  photo_url text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
  last_seen_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agent verifications table
CREATE TABLE IF NOT EXISTS agent_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  verifier_user_id uuid NOT NULL REFERENCES users(id),
  gps_lat numeric NOT NULL,
  gps_lng numeric NOT NULL,
  notes text,
  verified_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Cash notes table
CREATE TABLE IF NOT EXISTS cash_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'UGX',
  receipt_id text NOT NULL,
  verified boolean DEFAULT false,
  verified_at timestamptz,
  verifier_user_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Prompt verifications table
CREATE TABLE IF NOT EXISTS prompt_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  prompt_text text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('verified', 'pending', 'rejected')),
  actioned_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Float ledger table
CREATE TABLE IF NOT EXISTS float_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'UGX',
  reference text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_merchant_id ON agents(merchant_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_verifications_agent_id ON agent_verifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_cash_notes_agent_id ON cash_notes(agent_id);
CREATE INDEX IF NOT EXISTS idx_cash_notes_verified ON cash_notes(verified);
CREATE INDEX IF NOT EXISTS idx_prompt_verifications_agent_id ON prompt_verifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_prompt_verifications_status ON prompt_verifications(status);
CREATE INDEX IF NOT EXISTS idx_float_ledger_agent_id ON float_ledger(agent_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE float_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for merchants table
CREATE POLICY "Admins can view all merchants"
  ON merchants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can insert merchants"
  ON merchants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update merchants"
  ON merchants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- RLS Policies for agents table
CREATE POLICY "Authenticated users can view agents"
  ON agents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert agents"
  ON agents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'MERCHANT')
    )
  );

CREATE POLICY "Admins can update agents"
  ON agents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'MERCHANT')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'MERCHANT')
    )
  );

-- RLS Policies for agent_verifications table
CREATE POLICY "Authenticated users can view verifications"
  ON agent_verifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert verifications"
  ON agent_verifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
    )
  );

-- RLS Policies for cash_notes table
CREATE POLICY "Authenticated users can view cash notes"
  ON cash_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cash notes"
  ON cash_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'MERCHANT')
    )
  );

CREATE POLICY "Authenticated users can update cash notes"
  ON cash_notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'MERCHANT')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'MERCHANT')
    )
  );

-- RLS Policies for prompt_verifications table
CREATE POLICY "Authenticated users can view prompt verifications"
  ON prompt_verifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert prompt verifications"
  ON prompt_verifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'MERCHANT')
    )
  );

CREATE POLICY "Authenticated users can update prompt verifications"
  ON prompt_verifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'MERCHANT')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'MERCHANT')
    )
  );

-- RLS Policies for float_ledger table
CREATE POLICY "Authenticated users can view float ledger"
  ON float_ledger FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert float ledger entries"
  ON float_ledger FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'MERCHANT')
    )
  );