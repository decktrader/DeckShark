-- Add partner commander support for Commander format partner pairs
ALTER TABLE decks ADD COLUMN partner_commander_name text;
ALTER TABLE decks ADD COLUMN partner_commander_scryfall_id text;
