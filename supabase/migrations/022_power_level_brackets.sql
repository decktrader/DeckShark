-- Migrate power_level values from old labels to official Commander Bracket system

-- Drop the old check constraint that only allows old values
ALTER TABLE decks DROP CONSTRAINT IF EXISTS decks_power_level_check;

-- Update existing data
UPDATE decks SET power_level = 'bracket1' WHERE power_level = 'casual';
UPDATE decks SET power_level = 'bracket2' WHERE power_level = 'precon';
UPDATE decks SET power_level = 'bracket3' WHERE power_level = 'mid';
UPDATE decks SET power_level = 'bracket4' WHERE power_level = 'high';
UPDATE decks SET power_level = 'bracket5' WHERE power_level = 'cedh';

-- Add new check constraint with bracket values
ALTER TABLE decks ADD CONSTRAINT decks_power_level_check
  CHECK (power_level = ANY (ARRAY['bracket1', 'bracket2', 'bracket3', 'bracket4', 'bracket5']));
