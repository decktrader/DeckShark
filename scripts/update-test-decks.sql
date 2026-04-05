-- Update 5 test decks to proper Commander decklists with real scryfall_ids
-- Run against local Supabase: psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f scripts/update-test-decks.sql

BEGIN;

-- ============================================================
-- 1. Atraxa Superfriends
-- ============================================================
UPDATE decks SET
  name = 'Atraxa Superfriends',
  commander_name = 'Atraxa, Praetors'' Voice',
  commander_scryfall_id = (SELECT scryfall_id FROM card_cache WHERE name = 'Atraxa, Praetors'' Voice' LIMIT 1),
  format = 'commander',
  color_identity = '{W,U,B,G}',
  archetype = 'Superfriends',
  description = 'Planeswalker-heavy build leveraging Atraxa''s proliferate to ultimate walkers quickly. Packed with loyalty doublers and proliferate synergies.',
  available_for_trade = true
WHERE id = '00000000-0000-0000-0000-100000000001';

DELETE FROM deck_cards WHERE deck_id = '00000000-0000-0000-0000-100000000001';

INSERT INTO deck_cards (deck_id, card_name, scryfall_id, quantity, is_commander) VALUES
  ('00000000-0000-0000-0000-100000000001', 'Atraxa, Praetors'' Voice',     (SELECT scryfall_id FROM card_cache WHERE name = 'Atraxa, Praetors'' Voice' LIMIT 1), 1, true),
  ('00000000-0000-0000-0000-100000000001', 'Doubling Season',              (SELECT scryfall_id FROM card_cache WHERE name = 'Doubling Season' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Deepglow Skate',               (SELECT scryfall_id FROM card_cache WHERE name = 'Deepglow Skate' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'The Chain Veil',               (SELECT scryfall_id FROM card_cache WHERE name = 'The Chain Veil' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Teferi, Time Raveler',         (SELECT scryfall_id FROM card_cache WHERE name = 'Teferi, Time Raveler' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Narset, Parter of Veils',      (SELECT scryfall_id FROM card_cache WHERE name = 'Narset, Parter of Veils' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Tamiyo, Field Researcher',     (SELECT scryfall_id FROM card_cache WHERE name = 'Tamiyo, Field Researcher' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Vraska, Golgari Queen',        (SELECT scryfall_id FROM card_cache WHERE name = 'Vraska, Golgari Queen' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Nissa, Who Shakes the World',  (SELECT scryfall_id FROM card_cache WHERE name = 'Nissa, Who Shakes the World' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Jace, the Mind Sculptor',      (SELECT scryfall_id FROM card_cache WHERE name = 'Jace, the Mind Sculptor' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Elspeth, Sun''s Champion',     (SELECT scryfall_id FROM card_cache WHERE name = 'Elspeth, Sun''s Champion' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Liliana, Dreadhorde General',  (SELECT scryfall_id FROM card_cache WHERE name = 'Liliana, Dreadhorde General' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Ugin, the Spirit Dragon',      (SELECT scryfall_id FROM card_cache WHERE name = 'Ugin, the Spirit Dragon' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Karn Liberated',               (SELECT scryfall_id FROM card_cache WHERE name = 'Karn Liberated' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Oath of Teferi',               (SELECT scryfall_id FROM card_cache WHERE name = 'Oath of Teferi' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Oath of Nissa',                (SELECT scryfall_id FROM card_cache WHERE name = 'Oath of Nissa' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Evolution Sage',               (SELECT scryfall_id FROM card_cache WHERE name = 'Evolution Sage' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Flux Channeler',               (SELECT scryfall_id FROM card_cache WHERE name = 'Flux Channeler' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Inexorable Tide',              (SELECT scryfall_id FROM card_cache WHERE name = 'Inexorable Tide' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Thrummingbird',                (SELECT scryfall_id FROM card_cache WHERE name = 'Thrummingbird' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Contagion Engine',             (SELECT scryfall_id FROM card_cache WHERE name = 'Contagion Engine' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Pir, Imaginative Rascal',      (SELECT scryfall_id FROM card_cache WHERE name = 'Pir, Imaginative Rascal' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Toothy, Imaginary Friend',     (SELECT scryfall_id FROM card_cache WHERE name = 'Toothy, Imaginary Friend' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Aura Shards',                  (SELECT scryfall_id FROM card_cache WHERE name = 'Aura Shards' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Swords to Plowshares',         (SELECT scryfall_id FROM card_cache WHERE name = 'Swords to Plowshares' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Cyclonic Rift',                (SELECT scryfall_id FROM card_cache WHERE name = 'Cyclonic Rift' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Sol Ring',                     (SELECT scryfall_id FROM card_cache WHERE name = 'Sol Ring' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000001', 'Astral Cornucopia',            (SELECT scryfall_id FROM card_cache WHERE name = 'Astral Cornucopia' LIMIT 1), 1, false);

-- ============================================================
-- 2. Krenko Goblins
-- ============================================================
UPDATE decks SET
  name = 'Krenko Goblins',
  commander_name = 'Krenko, Mob Boss',
  commander_scryfall_id = (SELECT scryfall_id FROM card_cache WHERE name = 'Krenko, Mob Boss' LIMIT 1),
  format = 'commander',
  color_identity = '{R}',
  archetype = 'Tribal',
  description = 'Explosive goblin tribal that doubles tokens with Krenko and converts them into damage via Impact Tremors and Purphoros.',
  available_for_trade = true
WHERE id = '00000000-0000-0000-0000-100000000002';

DELETE FROM deck_cards WHERE deck_id = '00000000-0000-0000-0000-100000000002';

INSERT INTO deck_cards (deck_id, card_name, scryfall_id, quantity, is_commander) VALUES
  ('00000000-0000-0000-0000-100000000002', 'Krenko, Mob Boss',             (SELECT scryfall_id FROM card_cache WHERE name = 'Krenko, Mob Boss' LIMIT 1), 1, true),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Chieftain',             (SELECT scryfall_id FROM card_cache WHERE name = 'Goblin Chieftain' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Warchief',              (SELECT scryfall_id FROM card_cache WHERE name = 'Goblin Warchief' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Matron',                (SELECT scryfall_id FROM card_cache WHERE name = 'Goblin Matron' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Recruiter',             (SELECT scryfall_id FROM card_cache WHERE name = 'Goblin Recruiter' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Lackey',                (SELECT scryfall_id FROM card_cache WHERE name = 'Goblin Lackey' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Ringleader',            (SELECT scryfall_id FROM card_cache WHERE name = 'Goblin Ringleader' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Skirk Prospector',             (SELECT scryfall_id FROM card_cache WHERE name = 'Skirk Prospector' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Bushwhacker',           (SELECT scryfall_id FROM card_cache WHERE name = 'Goblin Bushwhacker' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Piledriver',            (SELECT scryfall_id FROM card_cache WHERE name = 'Goblin Piledriver' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Trashmaster',           (SELECT scryfall_id FROM card_cache WHERE name = 'Goblin Trashmaster' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Siege-Gang Commander',         (SELECT scryfall_id FROM card_cache WHERE name = 'Siege-Gang Commander' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Muxus, Goblin Grandee',        (SELECT scryfall_id FROM card_cache WHERE name = 'Muxus, Goblin Grandee' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin King',                  (SELECT scryfall_id FROM card_cache WHERE name = 'Goblin King' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Pashalik Mons',                (SELECT scryfall_id FROM card_cache WHERE name = 'Pashalik Mons' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Mogg War Marshal',             (SELECT scryfall_id FROM card_cache WHERE name = 'Mogg War Marshal' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Purphoros, God of the Forge',  (SELECT scryfall_id FROM card_cache WHERE name = 'Purphoros, God of the Forge' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Impact Tremors',               (SELECT scryfall_id FROM card_cache WHERE name = 'Impact Tremors' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Goblin Bombardment',           (SELECT scryfall_id FROM card_cache WHERE name = 'Goblin Bombardment' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Shared Animosity',             (SELECT scryfall_id FROM card_cache WHERE name = 'Shared Animosity' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Empty the Warrens',            (SELECT scryfall_id FROM card_cache WHERE name = 'Empty the Warrens' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Coat of Arms',                 (SELECT scryfall_id FROM card_cache WHERE name = 'Coat of Arms' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Skullclamp',                   (SELECT scryfall_id FROM card_cache WHERE name = 'Skullclamp' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Sol Ring',                     (SELECT scryfall_id FROM card_cache WHERE name = 'Sol Ring' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Ruby Medallion',               (SELECT scryfall_id FROM card_cache WHERE name = 'Ruby Medallion' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Lightning Bolt',               (SELECT scryfall_id FROM card_cache WHERE name = 'Lightning Bolt' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-100000000002', 'Chaos Warp',                   (SELECT scryfall_id FROM card_cache WHERE name = 'Chaos Warp' LIMIT 1), 1, false);

-- ============================================================
-- 3. Korvold Sacrifice
-- ============================================================
UPDATE decks SET
  name = 'Korvold Sacrifice',
  commander_name = 'Korvold, Fae-Cursed King',
  commander_scryfall_id = (SELECT scryfall_id FROM card_cache WHERE name = 'Korvold, Fae-Cursed King' LIMIT 1),
  format = 'commander',
  color_identity = '{B,R,G}',
  archetype = 'Aristocrats',
  description = 'Jund aristocrats shell that sacrifices tokens and permanents to fuel Korvold''s draw engine while draining opponents with Blood Artist effects.',
  available_for_trade = true
WHERE id = '00000000-0000-0000-0000-200000000001';

DELETE FROM deck_cards WHERE deck_id = '00000000-0000-0000-0000-200000000001';

INSERT INTO deck_cards (deck_id, card_name, scryfall_id, quantity, is_commander) VALUES
  ('00000000-0000-0000-0000-200000000001', 'Korvold, Fae-Cursed King',     (SELECT scryfall_id FROM card_cache WHERE name = 'Korvold, Fae-Cursed King' LIMIT 1), 1, true),
  ('00000000-0000-0000-0000-200000000001', 'Viscera Seer',                 (SELECT scryfall_id FROM card_cache WHERE name = 'Viscera Seer' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Blood Artist',                 (SELECT scryfall_id FROM card_cache WHERE name = 'Blood Artist' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Zulaport Cutthroat',           (SELECT scryfall_id FROM card_cache WHERE name = 'Zulaport Cutthroat' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Mayhem Devil',                 (SELECT scryfall_id FROM card_cache WHERE name = 'Mayhem Devil' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Grave Pact',                   (SELECT scryfall_id FROM card_cache WHERE name = 'Grave Pact' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Dictate of Erebos',            (SELECT scryfall_id FROM card_cache WHERE name = 'Dictate of Erebos' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Pitiless Plunderer',           (SELECT scryfall_id FROM card_cache WHERE name = 'Pitiless Plunderer' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Reassembling Skeleton',        (SELECT scryfall_id FROM card_cache WHERE name = 'Reassembling Skeleton' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Bloodghast',                   (SELECT scryfall_id FROM card_cache WHERE name = 'Bloodghast' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Sakura-Tribe Elder',           (SELECT scryfall_id FROM card_cache WHERE name = 'Sakura-Tribe Elder' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Tireless Tracker',             (SELECT scryfall_id FROM card_cache WHERE name = 'Tireless Tracker' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Ophiomancer',                  (SELECT scryfall_id FROM card_cache WHERE name = 'Ophiomancer' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Dockside Extortionist',        (SELECT scryfall_id FROM card_cache WHERE name = 'Dockside Extortionist' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Bolas''s Citadel',             (SELECT scryfall_id FROM card_cache WHERE name = 'Bolas''s Citadel' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Butcher of Malakir',           (SELECT scryfall_id FROM card_cache WHERE name = 'Butcher of Malakir' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Prossh, Skyraider of Kher',    (SELECT scryfall_id FROM card_cache WHERE name = 'Prossh, Skyraider of Kher' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Mortician Beetle',             (SELECT scryfall_id FROM card_cache WHERE name = 'Mortician Beetle' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Goblin Bombardment',           (SELECT scryfall_id FROM card_cache WHERE name = 'Goblin Bombardment' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Awakening Zone',               (SELECT scryfall_id FROM card_cache WHERE name = 'Awakening Zone' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'From Beyond',                  (SELECT scryfall_id FROM card_cache WHERE name = 'From Beyond' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Poison-Tip Archer',            (SELECT scryfall_id FROM card_cache WHERE name = 'Poison-Tip Archer' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Mazirek, Kraul Death Priest',  (SELECT scryfall_id FROM card_cache WHERE name = 'Mazirek, Kraul Death Priest' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Chatterfang, Squirrel General',(SELECT scryfall_id FROM card_cache WHERE name = 'Chatterfang, Squirrel General' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Savvy Hunter',                 (SELECT scryfall_id FROM card_cache WHERE name = 'Savvy Hunter' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Deadly Dispute',               (SELECT scryfall_id FROM card_cache WHERE name = 'Deadly Dispute' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Village Rites',                (SELECT scryfall_id FROM card_cache WHERE name = 'Village Rites' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000001', 'Sol Ring',                     (SELECT scryfall_id FROM card_cache WHERE name = 'Sol Ring' LIMIT 1), 1, false);

-- ============================================================
-- 4. Niv-Mizzet Spellslinger
-- ============================================================
UPDATE decks SET
  name = 'Niv-Mizzet Spellslinger',
  commander_name = 'Niv-Mizzet, Parun',
  commander_scryfall_id = (SELECT scryfall_id FROM card_cache WHERE name = 'Niv-Mizzet, Parun' LIMIT 1),
  format = 'commander',
  color_identity = '{U,R}',
  archetype = 'Spellslinger',
  description = 'Izzet spellslinger that chains cantrips and burn spells, turning every instant and sorcery into card draw and damage through Niv-Mizzet''s triggers.',
  available_for_trade = true
WHERE id = '00000000-0000-0000-0000-200000000002';

DELETE FROM deck_cards WHERE deck_id = '00000000-0000-0000-0000-200000000002';

INSERT INTO deck_cards (deck_id, card_name, scryfall_id, quantity, is_commander) VALUES
  ('00000000-0000-0000-0000-200000000002', 'Niv-Mizzet, Parun',            (SELECT scryfall_id FROM card_cache WHERE name = 'Niv-Mizzet, Parun' LIMIT 1), 1, true),
  ('00000000-0000-0000-0000-200000000002', 'Curiosity',                    (SELECT scryfall_id FROM card_cache WHERE name = 'Curiosity' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Guttersnipe',                  (SELECT scryfall_id FROM card_cache WHERE name = 'Guttersnipe' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Young Pyromancer',             (SELECT scryfall_id FROM card_cache WHERE name = 'Young Pyromancer' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Archmage Emeritus',            (SELECT scryfall_id FROM card_cache WHERE name = 'Archmage Emeritus' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Storm-Kiln Artist',            (SELECT scryfall_id FROM card_cache WHERE name = 'Storm-Kiln Artist' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Baral, Chief of Compliance',   (SELECT scryfall_id FROM card_cache WHERE name = 'Baral, Chief of Compliance' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Goblin Electromancer',         (SELECT scryfall_id FROM card_cache WHERE name = 'Goblin Electromancer' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Thousand-Year Storm',          (SELECT scryfall_id FROM card_cache WHERE name = 'Thousand-Year Storm' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Expressive Iteration',         (SELECT scryfall_id FROM card_cache WHERE name = 'Expressive Iteration' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Brainstorm',                   (SELECT scryfall_id FROM card_cache WHERE name = 'Brainstorm' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Ponder',                       (SELECT scryfall_id FROM card_cache WHERE name = 'Ponder' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Preordain',                    (SELECT scryfall_id FROM card_cache WHERE name = 'Preordain' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Lightning Bolt',               (SELECT scryfall_id FROM card_cache WHERE name = 'Lightning Bolt' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Counterspell',                 (SELECT scryfall_id FROM card_cache WHERE name = 'Counterspell' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Opt',                          (SELECT scryfall_id FROM card_cache WHERE name = 'Opt' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Frantic Search',               (SELECT scryfall_id FROM card_cache WHERE name = 'Frantic Search' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Dig Through Time',             (SELECT scryfall_id FROM card_cache WHERE name = 'Dig Through Time' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Treasure Cruise',              (SELECT scryfall_id FROM card_cache WHERE name = 'Treasure Cruise' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Narset''s Reversal',           (SELECT scryfall_id FROM card_cache WHERE name = 'Narset''s Reversal' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Expansion // Explosion',       (SELECT scryfall_id FROM card_cache WHERE name = 'Expansion // Explosion' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Solve the Equation',           (SELECT scryfall_id FROM card_cache WHERE name = 'Solve the Equation' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Mystical Tutor',               (SELECT scryfall_id FROM card_cache WHERE name = 'Mystical Tutor' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Faithless Looting',            (SELECT scryfall_id FROM card_cache WHERE name = 'Faithless Looting' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Izzet Signet',                 (SELECT scryfall_id FROM card_cache WHERE name = 'Izzet Signet' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Arcane Signet',                (SELECT scryfall_id FROM card_cache WHERE name = 'Arcane Signet' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000002', 'Sol Ring',                     (SELECT scryfall_id FROM card_cache WHERE name = 'Sol Ring' LIMIT 1), 1, false);

-- ============================================================
-- 5. Talrand Drakes
-- ============================================================
UPDATE decks SET
  name = 'Talrand Drakes',
  commander_name = 'Talrand, Sky Summoner',
  commander_scryfall_id = (SELECT scryfall_id FROM card_cache WHERE name = 'Talrand, Sky Summoner' LIMIT 1),
  format = 'commander',
  color_identity = '{U}',
  archetype = 'Spellslinger',
  description = 'Mono-blue control that turns every counterspell and cantrip into a 2/2 Drake. Protect Talrand, counter everything, and fly over for the win.',
  available_for_trade = true
WHERE id = '00000000-0000-0000-0000-200000000003';

DELETE FROM deck_cards WHERE deck_id = '00000000-0000-0000-0000-200000000003';

INSERT INTO deck_cards (deck_id, card_name, scryfall_id, quantity, is_commander) VALUES
  ('00000000-0000-0000-0000-200000000003', 'Talrand, Sky Summoner',        (SELECT scryfall_id FROM card_cache WHERE name = 'Talrand, Sky Summoner' LIMIT 1), 1, true),
  ('00000000-0000-0000-0000-200000000003', 'Counterspell',                 (SELECT scryfall_id FROM card_cache WHERE name = 'Counterspell' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Mana Drain',                   (SELECT scryfall_id FROM card_cache WHERE name = 'Mana Drain' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Force of Will',                (SELECT scryfall_id FROM card_cache WHERE name = 'Force of Will' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Pongify',                      (SELECT scryfall_id FROM card_cache WHERE name = 'Pongify' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Rapid Hybridization',          (SELECT scryfall_id FROM card_cache WHERE name = 'Rapid Hybridization' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Swan Song',                    (SELECT scryfall_id FROM card_cache WHERE name = 'Swan Song' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Snap',                         (SELECT scryfall_id FROM card_cache WHERE name = 'Snap' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Cryptic Command',              (SELECT scryfall_id FROM card_cache WHERE name = 'Cryptic Command' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Dissipate',                    (SELECT scryfall_id FROM card_cache WHERE name = 'Dissipate' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Spell Pierce',                 (SELECT scryfall_id FROM card_cache WHERE name = 'Spell Pierce' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Arcane Denial',                (SELECT scryfall_id FROM card_cache WHERE name = 'Arcane Denial' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Negate',                       (SELECT scryfall_id FROM card_cache WHERE name = 'Negate' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'High Tide',                    (SELECT scryfall_id FROM card_cache WHERE name = 'High Tide' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Gitaxian Probe',               (SELECT scryfall_id FROM card_cache WHERE name = 'Gitaxian Probe' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Mystical Tutor',               (SELECT scryfall_id FROM card_cache WHERE name = 'Mystical Tutor' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Snapcaster Mage',              (SELECT scryfall_id FROM card_cache WHERE name = 'Snapcaster Mage' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Baral, Chief of Compliance',   (SELECT scryfall_id FROM card_cache WHERE name = 'Baral, Chief of Compliance' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Murmuring Mystic',             (SELECT scryfall_id FROM card_cache WHERE name = 'Murmuring Mystic' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Docent of Perfection // Final Iteration', (SELECT scryfall_id FROM card_cache WHERE name = 'Docent of Perfection // Final Iteration' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Reality Shift',                (SELECT scryfall_id FROM card_cache WHERE name = 'Reality Shift' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Wash Away',                    (SELECT scryfall_id FROM card_cache WHERE name = 'Wash Away' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Windfall',                     (SELECT scryfall_id FROM card_cache WHERE name = 'Windfall' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Rhystic Study',                (SELECT scryfall_id FROM card_cache WHERE name = 'Rhystic Study' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Mystic Remora',                (SELECT scryfall_id FROM card_cache WHERE name = 'Mystic Remora' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Sol Ring',                     (SELECT scryfall_id FROM card_cache WHERE name = 'Sol Ring' LIMIT 1), 1, false),
  ('00000000-0000-0000-0000-200000000003', 'Ponder',                       (SELECT scryfall_id FROM card_cache WHERE name = 'Ponder' LIMIT 1), 1, false);

COMMIT;
