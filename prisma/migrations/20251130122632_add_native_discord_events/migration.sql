-- Add native Discord event support
-- Add createNativeEvent setting to guilds (default true)
ALTER TABLE "guilds" ADD COLUMN "createnativeevent" BOOLEAN NOT NULL DEFAULT true;

-- Add discordEventId to events to store native Discord event ID
ALTER TABLE "events" ADD COLUMN "discordeventid" TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS "events_discordeventid_idx" ON "events"("discordeventid");
