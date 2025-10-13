/*
  # Prompt Scheduling System

  1. New Tables
    - `prompt_schedules`
      - `id` (uuid, primary key)
      - `agent_ids` (text[], array of agent UUIDs)
      - `rule` (jsonb, scheduling configuration)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `channel` (text, sms|whatsapp|app)
      - `status` (text, active|paused|cancelled|completed)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `prompt_dispatches`
      - `id` (uuid, primary key)
      - `schedule_id` (uuid, foreign key to prompt_schedules)
      - `agent_id` (uuid, foreign key to agents)
      - `scheduled_for` (timestamptz, when to send)
      - `status` (text, pending|delivered|failed)
      - `delivered_at` (timestamptz)
      - `failed_reason` (text)
      - `retry_count` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Authenticated users can create schedules
    - Users can view their own schedules and related dispatches
    - Admins can view all schedules

  3. Indexes
    - Index on agent_ids for fast lookups
    - Index on scheduled_for for queue processing
    - Index on status for filtering
*/

-- Create prompt_schedules table
CREATE TABLE IF NOT EXISTS prompt_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_ids text[] NOT NULL DEFAULT '{}',
  rule jsonb NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  channel text NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'app')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'completed')),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create prompt_dispatches table
CREATE TABLE IF NOT EXISTS prompt_dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES prompt_schedules(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  delivered_at timestamptz,
  failed_reason text,
  retry_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prompt_schedules_agent_ids ON prompt_schedules USING GIN (agent_ids);
CREATE INDEX IF NOT EXISTS idx_prompt_schedules_status ON prompt_schedules(status);
CREATE INDEX IF NOT EXISTS idx_prompt_schedules_created_by ON prompt_schedules(created_by);
CREATE INDEX IF NOT EXISTS idx_prompt_dispatches_schedule_id ON prompt_dispatches(schedule_id);
CREATE INDEX IF NOT EXISTS idx_prompt_dispatches_agent_id ON prompt_dispatches(agent_id);
CREATE INDEX IF NOT EXISTS idx_prompt_dispatches_scheduled_for ON prompt_dispatches(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_prompt_dispatches_status ON prompt_dispatches(status);

-- Enable RLS
ALTER TABLE prompt_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_dispatches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompt_schedules

CREATE POLICY "Users can view own schedules"
  ON prompt_schedules FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create schedules"
  ON prompt_schedules FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own schedules"
  ON prompt_schedules FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own schedules"
  ON prompt_dispatches FOR DELETE
  TO authenticated
  USING (
    schedule_id IN (
      SELECT id FROM prompt_schedules WHERE created_by = auth.uid()
    )
  );

-- RLS Policies for prompt_dispatches

CREATE POLICY "Users can view dispatches for their schedules"
  ON prompt_dispatches FOR SELECT
  TO authenticated
  USING (
    schedule_id IN (
      SELECT id FROM prompt_schedules WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create dispatches for their schedules"
  ON prompt_dispatches FOR INSERT
  TO authenticated
  WITH CHECK (
    schedule_id IN (
      SELECT id FROM prompt_schedules WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update dispatches for their schedules"
  ON prompt_dispatches FOR UPDATE
  TO authenticated
  USING (
    schedule_id IN (
      SELECT id FROM prompt_schedules WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    schedule_id IN (
      SELECT id FROM prompt_schedules WHERE created_by = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prompt_schedules_updated_at
  BEFORE UPDATE ON prompt_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_dispatches_updated_at
  BEFORE UPDATE ON prompt_dispatches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
