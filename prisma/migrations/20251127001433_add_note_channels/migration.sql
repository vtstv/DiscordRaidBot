-- Add noteChannels to Guild settings
ALTER TABLE "guilds" ADD COLUMN IF NOT EXISTS "notechannels" TEXT[] DEFAULT '{}';
