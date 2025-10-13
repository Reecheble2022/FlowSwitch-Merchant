/*
  # Create Merchants and Agent-Merchant Many-to-Many Relationship

  ## Overview
  This migration creates a many-to-many relationship between agents and merchants,
  allowing agents to be assigned to multiple merchants and vice-versa.

  ## New Tables
  
  ### merchants
  - `id` (uuid, primary key)
  - `name` (text, required) - Company/merchant name
  - `registration` (text, optional) - Company registration number
  - `industry` (text, optional) - Industry type (salon, restaurant, retail, clinic, services, other)
  - `logo_url` (text, optional) - URL to merchant logo
  - `key_contact_name` (text, optional) - Primary contact name
  - `key_contact_phone` (text, optional) - Primary contact phone
  - `key_contact_email` (text, optional) - Primary contact email
  - `notes` (text, optional) - Additional notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### agent_merchants (Junction Table)
  - `agent_id` (uuid, foreign key to agents)
  - `merchant_id` (uuid, foreign key to merchants)
  - `assigned_at` (timestamptz)
  - Composite primary key on (agent_id, merchant_id)

  ## Updates to Existing Tables
  
  ### agents
  - Add new fields for enhanced profile management:
    - `reported_addr` (text) - Reported address
    - `national_id` (text) - National ID number
    - `nationality` (text) - ISO 3166-1 alpha-2 country code
    - `date_of_birth` (date) - Date of birth
    - `gender` (text) - Gender (male, female, nonbinary, prefer_not_to_say)
    - `photo_url` (text) - Profile photo URL

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage merchants and assignments
  - Maintain existing agent policies
*/

-- Add new fields to agents table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'reported_addr') THEN
    ALTER TABLE agents ADD COLUMN reported_addr text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'national_id') THEN
    ALTER TABLE agents ADD COLUMN national_id text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'nationality') THEN
    ALTER TABLE agents ADD COLUMN nationality text DEFAULT 'ZA';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'date_of_birth') THEN
    ALTER TABLE agents ADD COLUMN date_of_birth date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'gender') THEN
    ALTER TABLE agents ADD COLUMN gender text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'photo_url') THEN
    ALTER TABLE agents ADD COLUMN photo_url text;
  END IF;
END $$;

-- Create merchants table
CREATE TABLE IF NOT EXISTS merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  registration text,
  industry text,
  logo_url text,
  key_contact_name text,
  key_contact_phone text,
  key_contact_email text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agent_merchants junction table
CREATE TABLE IF NOT EXISTS agent_merchants (
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  PRIMARY KEY (agent_id, merchant_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_merchants_agent_id ON agent_merchants(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_merchants_merchant_id ON agent_merchants(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchants_name ON merchants(name);
CREATE INDEX IF NOT EXISTS idx_agents_nationality ON agents(nationality);

-- Enable RLS
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_merchants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts on re-run)
DROP POLICY IF EXISTS "Authenticated users can read all merchants" ON merchants;
DROP POLICY IF EXISTS "Authenticated users can create merchants" ON merchants;
DROP POLICY IF EXISTS "Authenticated users can update merchants" ON merchants;
DROP POLICY IF EXISTS "Authenticated users can read agent_merchants" ON agent_merchants;
DROP POLICY IF EXISTS "Authenticated users can manage agent_merchants" ON agent_merchants;

-- Merchants policies
CREATE POLICY "Authenticated users can read all merchants"
  ON merchants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create merchants"
  ON merchants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update merchants"
  ON merchants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Agent-Merchant junction policies
CREATE POLICY "Authenticated users can read agent_merchants"
  ON agent_merchants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage agent_merchants"
  ON agent_merchants FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger for merchants
CREATE OR REPLACE FUNCTION update_merchants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS merchants_updated_at ON merchants;
CREATE TRIGGER merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION update_merchants_updated_at();
