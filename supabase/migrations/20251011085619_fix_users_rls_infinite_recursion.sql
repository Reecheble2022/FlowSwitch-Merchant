/*
  # Fix Infinite Recursion in Users RLS Policies

  1. Problem
    - The "Admins can view all users" policy queries the users table itself
    - This creates infinite recursion: policy checks users table -> policy runs -> checks users table -> ...

  2. Solution
    - Use JWT claims (raw_user_meta_data) instead of querying the users table
    - Store role in auth.users.raw_user_meta_data
    - Access via auth.jwt() function

  3. Changes
    - Drop existing policies that cause recursion
    - Create new policies using JWT claims
    - Users can always view their own profile (by ID match)
    - Admins can view all users (by checking JWT role claim)
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Create new policies using JWT claims to avoid recursion
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can view all users (check role from JWT metadata)
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'role')::text = 'authenticated' 
    AND 
    (auth.jwt()->'user_metadata'->>'role')::text = 'ADMIN'
  );

-- Allow users to be created by the trigger (system operations)
CREATE POLICY "System can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
