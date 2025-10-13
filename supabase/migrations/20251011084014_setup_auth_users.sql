/*
  # Setup Authentication for FlowSwitch Users

  1. Changes
    - Create trigger to automatically create user record when auth.users entry is created
    - Create function to sync user data with auth.users table
    - Insert initial admin and merchant users into auth.users

  2. Security
    - RLS policies already configured for users table
    - Password hashes are stored securely in auth.users

  3. Notes
    - After this migration, users can log in via Supabase Auth
    - The users table will be synced with auth.users
*/

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, password_hash, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'AGENT_READONLY'),
    '',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user record
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert test users into auth.users for authentication
-- Note: In production, use proper password hashing and Supabase's signUp function

-- Admin user: admin@flowswitch.dev / Admin123!
DO $$
DECLARE
  admin_id uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = admin_id) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@flowswitch.dev',
      crypt('Admin123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object('name', 'Admin User', 'role', 'ADMIN'),
      'authenticated',
      'authenticated'
    );
  END IF;
END $$;

-- Merchant user: merchant@flowswitch.dev / Merchant123!
DO $$
DECLARE
  merchant_id uuid := '22222222-2222-2222-2222-222222222222';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = merchant_id) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      merchant_id,
      '00000000-0000-0000-0000-000000000000',
      'merchant@flowswitch.dev',
      crypt('Merchant123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object('name', 'Merchant User', 'role', 'MERCHANT'),
      'authenticated',
      'authenticated'
    );
  END IF;
END $$;

-- Viewer user: viewer@flowswitch.dev / Viewer123!
DO $$
DECLARE
  viewer_id uuid := '33333333-3333-3333-3333-333333333333';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = viewer_id) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      viewer_id,
      '00000000-0000-0000-0000-000000000000',
      'viewer@flowswitch.dev',
      crypt('Viewer123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object('name', 'Agent Viewer', 'role', 'AGENT_READONLY'),
      'authenticated',
      'authenticated'
    );
  END IF;
END $$;
