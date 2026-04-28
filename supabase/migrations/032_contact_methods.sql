-- Add optional contact methods for trade meetup coordination
ALTER TABLE users ADD COLUMN discord_username text;
ALTER TABLE users ADD COLUMN phone_number text;
