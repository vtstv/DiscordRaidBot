-- Add Reminder table and logRetentionDays field

ALTER TABLE "guilds" ADD COLUMN "logretentiondays" INTEGER;

CREATE TABLE "reminders" (
  "id" TEXT NOT NULL,
  "eventid" TEXT NOT NULL,
  "interval" TEXT NOT NULL,
  "messageid" TEXT NOT NULL,
  "channelid" TEXT NOT NULL,
  "sentat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "reminders_eventid_interval_key" ON "reminders"("eventid", "interval");
CREATE INDEX "reminders_eventid_idx" ON "reminders"("eventid");

