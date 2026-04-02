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
  role,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
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
  'authenticated',
  '',
  '',
  '',
  ''
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

-- Identities row for dev user (required for email/password login)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000001', 'email', 'jordgrah@gmail.com'),
  'email',
  '00000000-0000-0000-0000-000000000001',
  now(),
  now(),
  now()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- Test user for local dev
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
  role,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'testuser@test.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

UPDATE public.users
SET
  username   = 'testuser',
  city       = 'Toronto',
  province   = 'ON',
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000002';

-- Identities row (required for email/password login to work)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000002', 'email', 'testuser@test.com'),
  'email',
  '00000000-0000-0000-0000-000000000002',
  now(),
  now(),
  now()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- Test user deck 1: Commander deck
INSERT INTO public.decks (
  id, user_id, name, commander_name, format, description,
  estimated_value_cents, available_for_trade, power_level, color_identity, archetype
) VALUES (
  '00000000-0000-0000-0000-100000000001',
  '00000000-0000-0000-0000-000000000002',
  'Atraxa Superfriends',
  'Atraxa, Praetors'' Voice',
  'commander',
  'Planeswalker-heavy Atraxa build with proliferate synergies.',
  45000,
  true,
  'high',
  '{W,U,B,G}',
  'Midrange'
) ON CONFLICT (id) DO NOTHING;

-- Some cards for deck 1
INSERT INTO public.deck_cards (deck_id, card_name, quantity, is_commander) VALUES
  ('00000000-0000-0000-0000-100000000001', 'Atraxa, Praetors'' Voice', 1, true),
  ('00000000-0000-0000-0000-100000000001', 'Doubling Season', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Teferi, Hero of Dominaria', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Elspeth, Sun''s Champion', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Deepglow Skate', 1, false)
ON CONFLICT DO NOTHING;

-- Test user deck 2: Standard deck
INSERT INTO public.decks (
  id, user_id, name, format, description,
  estimated_value_cents, available_for_trade, power_level, color_identity, archetype
) VALUES (
  '00000000-0000-0000-0000-100000000002',
  '00000000-0000-0000-0000-000000000002',
  'Mono Red Aggro',
  'standard',
  'Fast red deck. Burn and small creatures.',
  8500,
  true,
  'mid',
  '{R}',
  'Aggro'
) ON CONFLICT (id) DO NOTHING;

-- Some cards for deck 2
INSERT INTO public.deck_cards (deck_id, card_name, quantity, is_commander) VALUES
  ('00000000-0000-0000-0000-100000000002', 'Lightning Bolt', 4, false),
  ('00000000-0000-0000-0000-100000000002', 'Monastery Swiftspear', 4, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Guide', 4, false),
  ('00000000-0000-0000-0000-100000000002', 'Eidolon of the Great Revel', 4, false)
ON CONFLICT DO NOTHING;
