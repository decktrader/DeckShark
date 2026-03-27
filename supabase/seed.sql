-- Local dev seed data
-- Runs automatically after `supabase db reset`
-- Safe to re-run: all inserts use ON CONFLICT DO NOTHING

-- Create dev user in auth (fixed UUID for predictability)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'jordgrah@gmail.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Complete the onboarding profile for the dev user
-- (the trigger auto-creates the row on auth insert; we just fill in the details)
UPDATE public.users
SET
  username   = 'jordgrah',
  city       = 'Vancouver',
  province   = 'BC',
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000001';
