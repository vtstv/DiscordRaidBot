-- Add participant notes settings to Guild
ALTER TABLE "guilds" ADD COLUMN "allowparticipantnotes" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "guilds" ADD COLUMN "participantnotemaxlength" INTEGER NOT NULL DEFAULT 30;

-- Add note field to Participant (VarChar 100 for storage efficiency)
ALTER TABLE "participants" ADD COLUMN "note" VARCHAR(100);

-- Add allowNotes override to Event
ALTER TABLE "events" ADD COLUMN "allownotes" BOOLEAN;
