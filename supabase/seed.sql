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

-- Third test user for trading/counter-offer testing
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
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'trader@test.com',
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
  username   = 'trader',
  city       = 'Montreal',
  province   = 'QC',
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000003';

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
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000003',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000003', 'email', 'trader@test.com'),
  'email',
  '00000000-0000-0000-0000-000000000003',
  now(),
  now(),
  now()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- ─── Decks for testuser ─────────────────────────────────────────────────────
-- Note: scryfall_ids are populated by running scripts/update-test-decks.sql
-- after a db reset + card sync. Seed only stores card names; the update script
-- resolves scryfall_ids from card_cache.

INSERT INTO public.decks (
  id, user_id, name, commander_name, format, description,
  estimated_value_cents, available_for_trade, power_level, color_identity, archetype
) VALUES (
  '00000000-0000-0000-0000-100000000001',
  '00000000-0000-0000-0000-000000000002',
  'Atraxa Superfriends',
  'Atraxa, Praetors'' Voice',
  'commander',
  'Planeswalker-heavy build leveraging Atraxa''s proliferate to ultimate walkers quickly. Packed with loyalty doublers and proliferate synergies.',
  45000, true, 'high', '{W,U,B,G}', 'Superfriends'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.deck_cards (deck_id, card_name, quantity, is_commander) VALUES
  ('00000000-0000-0000-0000-100000000001', 'Atraxa, Praetors'' Voice', 1, true),
  ('00000000-0000-0000-0000-100000000001', 'Doubling Season', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Deepglow Skate', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'The Chain Veil', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Teferi, Time Raveler', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Narset, Parter of Veils', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Tamiyo, Field Researcher', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Vraska, Golgari Queen', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Nissa, Who Shakes the World', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Jace, the Mind Sculptor', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Elspeth, Sun''s Champion', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Liliana, Dreadhorde General', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Ugin, the Spirit Dragon', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Karn Liberated', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Oath of Teferi', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Oath of Nissa', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Evolution Sage', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Flux Channeler', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Inexorable Tide', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Thrummingbird', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Contagion Engine', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Pir, Imaginative Rascal', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Toothy, Imaginary Friend', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Aura Shards', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Swords to Plowshares', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Cyclonic Rift', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Sol Ring', 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Astral Cornucopia', 1, false)
ON CONFLICT DO NOTHING;

INSERT INTO public.decks (
  id, user_id, name, commander_name, format, description,
  estimated_value_cents, available_for_trade, power_level, color_identity, archetype
) VALUES (
  '00000000-0000-0000-0000-100000000002',
  '00000000-0000-0000-0000-000000000002',
  'Krenko Goblins',
  'Krenko, Mob Boss',
  'commander',
  'Explosive goblin tribal that doubles tokens with Krenko and converts them into damage via Impact Tremors and Purphoros.',
  8500, true, 'mid', '{R}', 'Tribal'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.deck_cards (deck_id, card_name, quantity, is_commander) VALUES
  ('00000000-0000-0000-0000-100000000002', 'Krenko, Mob Boss', 1, true),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Chieftain', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Warchief', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Matron', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Recruiter', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Lackey', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Ringleader', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Skirk Prospector', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Bushwhacker', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Piledriver', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Trashmaster', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Siege-Gang Commander', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Muxus, Goblin Grandee', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin King', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Pashalik Mons', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Mogg War Marshal', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Purphoros, God of the Forge', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Impact Tremors', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Bombardment', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Shared Animosity', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Empty the Warrens', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Coat of Arms', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Skullclamp', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Sol Ring', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Ruby Medallion', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Lightning Bolt', 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Chaos Warp', 1, false)
ON CONFLICT DO NOTHING;

-- ─── Decks for trader ───────────────────────────────────────────────────────

INSERT INTO public.decks (
  id, user_id, name, commander_name, format, description,
  estimated_value_cents, available_for_trade, power_level, color_identity, archetype
) VALUES (
  '00000000-0000-0000-0000-200000000001',
  '00000000-0000-0000-0000-000000000003',
  'Korvold Sacrifice',
  'Korvold, Fae-Cursed King',
  'commander',
  'Jund aristocrats shell that sacrifices tokens and permanents to fuel Korvold''s draw engine while draining opponents with Blood Artist effects.',
  32000, true, 'high', '{B,R,G}', 'Aristocrats'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.deck_cards (deck_id, card_name, quantity, is_commander) VALUES
  ('00000000-0000-0000-0000-200000000001', 'Korvold, Fae-Cursed King', 1, true),
  ('00000000-0000-0000-0000-200000000001', 'Viscera Seer', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Blood Artist', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Zulaport Cutthroat', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Mayhem Devil', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Grave Pact', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Dictate of Erebos', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Pitiless Plunderer', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Reassembling Skeleton', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Bloodghast', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Sakura-Tribe Elder', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Tireless Tracker', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Ophiomancer', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Dockside Extortionist', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Bolas''s Citadel', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Butcher of Malakir', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Prossh, Skyraider of Kher', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Mortician Beetle', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Goblin Bombardment', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Awakening Zone', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'From Beyond', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Poison-Tip Archer', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Mazirek, Kraul Death Priest', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Chatterfang, Squirrel General', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Savvy Hunter', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Deadly Dispute', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Village Rites', 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Sol Ring', 1, false)
ON CONFLICT DO NOTHING;

INSERT INTO public.decks (
  id, user_id, name, commander_name, format, description,
  estimated_value_cents, available_for_trade, power_level, color_identity, archetype
) VALUES (
  '00000000-0000-0000-0000-200000000002',
  '00000000-0000-0000-0000-000000000003',
  'Niv-Mizzet Spellslinger',
  'Niv-Mizzet, Parun',
  'commander',
  'Izzet spellslinger that chains cantrips and burn spells, turning every instant and sorcery into card draw and damage through Niv-Mizzet''s triggers.',
  55000, true, 'high', '{U,R}', 'Spellslinger'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.deck_cards (deck_id, card_name, quantity, is_commander) VALUES
  ('00000000-0000-0000-0000-200000000002', 'Niv-Mizzet, Parun', 1, true),
  ('00000000-0000-0000-0000-200000000002', 'Curiosity', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Guttersnipe', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Young Pyromancer', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Archmage Emeritus', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Storm-Kiln Artist', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Baral, Chief of Compliance', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Goblin Electromancer', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Thousand-Year Storm', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Expressive Iteration', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Brainstorm', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Ponder', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Preordain', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Lightning Bolt', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Counterspell', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Opt', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Frantic Search', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Dig Through Time', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Treasure Cruise', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Narset''s Reversal', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Expansion // Explosion', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Solve the Equation', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Mystical Tutor', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Faithless Looting', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Izzet Signet', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Arcane Signet', 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Sol Ring', 1, false)
ON CONFLICT DO NOTHING;

INSERT INTO public.decks (
  id, user_id, name, commander_name, format, description,
  estimated_value_cents, available_for_trade, power_level, color_identity, archetype
) VALUES (
  '00000000-0000-0000-0000-200000000003',
  '00000000-0000-0000-0000-000000000003',
  'Talrand Drakes',
  'Talrand, Sky Summoner',
  'commander',
  'Mono-blue control that turns every counterspell and cantrip into a 2/2 Drake. Protect Talrand, counter everything, and fly over for the win.',
  1500, true, 'mid', '{U}', 'Spellslinger'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.deck_cards (deck_id, card_name, quantity, is_commander) VALUES
  ('00000000-0000-0000-0000-200000000003', 'Talrand, Sky Summoner', 1, true),
  ('00000000-0000-0000-0000-200000000003', 'Counterspell', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Mana Drain', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Force of Will', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Pongify', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Rapid Hybridization', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Swan Song', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Snap', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Cryptic Command', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Dissipate', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Spell Pierce', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Arcane Denial', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Negate', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'High Tide', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Gitaxian Probe', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Mystical Tutor', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Snapcaster Mage', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Baral, Chief of Compliance', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Murmuring Mystic', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Docent of Perfection // Final Iteration', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Reality Shift', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Wash Away', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Windfall', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Rhystic Study', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Mystic Remora', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Sol Ring', 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Ponder', 1, false)
ON CONFLICT DO NOTHING;
