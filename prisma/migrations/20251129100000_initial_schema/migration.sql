-- Initial consolidated schema with all features
-- Combines all previous migrations into one clean initial migration

-- CreateTable
CREATE TABLE "guilds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "logChannelId" TEXT,
    "archiveChannelId" TEXT,
    "managerRoleId" TEXT,
    "dashboardroles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commandPrefix" TEXT NOT NULL DEFAULT '!',
    "approvalChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reminderIntervals" TEXT[] DEFAULT ARRAY['1h', '15m']::TEXT[],
    "autoDeleteHours" INTEGER,
    "logretentiondays" INTEGER,
    "threadChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notechannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "statsenabled" BOOLEAN NOT NULL DEFAULT false,
    "statschannelid" TEXT,
    "statsmessageid" TEXT,
    "statsupdateinterval" TEXT NOT NULL DEFAULT 'daily',
    "statsautoroleenabled" BOOLEAN NOT NULL DEFAULT false,
    "statstop10roleid" TEXT,
    "statsminevents" INTEGER NOT NULL DEFAULT 3,
    "allowparticipantnotes" BOOLEAN NOT NULL DEFAULT true,
    "participantnotemaxlength" INTEGER NOT NULL DEFAULT 30,
    "showviewonlinebutton" BOOLEAN NOT NULL DEFAULT true,
    "dmremindersenabled" BOOLEAN NOT NULL DEFAULT false,
    "voicechannelcategoryid" TEXT,
    "voicechannelduration" INTEGER NOT NULL DEFAULT 120,
    "voicechannelcreatebefore" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guilds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "templateId" TEXT,
    "channelId" TEXT NOT NULL,
    "messageId" TEXT,
    "threadId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "maxParticipants" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "roleConfig" JSONB,
    "createdBy" TEXT NOT NULL,
    "editorRoleId" TEXT,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "createThread" BOOLEAN NOT NULL DEFAULT false,
    "deleteThread" BOOLEAN NOT NULL DEFAULT true,
    "allowedRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "benchOverflow" BOOLEAN NOT NULL DEFAULT true,
    "deadline" INTEGER,
    "allownotes" BOOLEAN,
    "createvoicechannel" BOOLEAN NOT NULL DEFAULT false,
    "voicechannelid" TEXT,
    "voicechannelname" TEXT,
    "voicechannelrestricted" BOOLEAN NOT NULL DEFAULT false,
    "voicechannelcreatebefore" INTEGER,
    "voicechannelcreatedat" TIMESTAMP(3),
    "voicechanneldeleteat" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "role" TEXT,
    "spec" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "position" INTEGER,
    "noshow" BOOLEAN NOT NULL DEFAULT false,
    "note" VARCHAR(100),
    "notes" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_entries" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "eventId" TEXT,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "templates_guildId_name_key" ON "templates"("guildId", "name");

-- CreateIndex
CREATE INDEX "events_guildId_status_idx" ON "events"("guildId", "status");

-- CreateIndex
CREATE INDEX "events_startTime_idx" ON "events"("startTime");

-- CreateIndex
CREATE INDEX "participants_eventId_status_idx" ON "participants"("eventId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "participants_eventId_userId_key" ON "participants"("eventId", "userId");

-- CreateIndex
CREATE INDEX "log_entries_guildId_createdAt_idx" ON "log_entries"("guildId", "createdAt");

-- CreateIndex
CREATE INDEX "log_entries_eventId_idx" ON "log_entries"("eventId");

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "eventid" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "messageid" TEXT NOT NULL,
    "channelid" TEXT NOT NULL,
    "sentat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participant_statistics" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "guildid" TEXT NOT NULL,
    "totaleventsjoin" INTEGER NOT NULL DEFAULT 0,
    "totaleventscomp" INTEGER NOT NULL DEFAULT 0,
    "totalnoshows" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "lastactivityat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participant_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raid_plans" (
    "id" TEXT NOT NULL,
    "eventid" TEXT NOT NULL,
    "guildid" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Raid Composition',
    "strategy" TEXT,
    "groups" JSONB NOT NULL,
    "createdby" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raid_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "composition_presets" (
    "id" TEXT NOT NULL,
    "guildid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "strategy" TEXT,
    "groups" JSONB NOT NULL,
    "createdby" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "composition_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_role_permissions" (
    "id" TEXT NOT NULL,
    "guildid" TEXT NOT NULL,
    "roleid" TEXT NOT NULL,
    "canaccessevents" BOOLEAN NOT NULL DEFAULT true,
    "canaccesscompositions" BOOLEAN NOT NULL DEFAULT true,
    "canaccesstemplates" BOOLEAN NOT NULL DEFAULT true,
    "canaccesssettings" BOOLEAN NOT NULL DEFAULT false,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reminders_eventid_interval_key" ON "reminders"("eventid", "interval");

-- CreateIndex
CREATE INDEX "reminders_eventid_idx" ON "reminders"("eventid");

-- CreateIndex
CREATE UNIQUE INDEX "participant_statistics_userid_guildid_key" ON "participant_statistics"("userid", "guildid");

-- CreateIndex
CREATE INDEX "participant_statistics_guildid_score_idx" ON "participant_statistics"("guildid", "score");

-- CreateIndex
CREATE INDEX "participant_statistics_guildid_rank_idx" ON "participant_statistics"("guildid", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "raid_plans_eventid_key" ON "raid_plans"("eventid");

-- CreateIndex
CREATE INDEX "raid_plans_guildid_idx" ON "raid_plans"("guildid");

-- CreateIndex
CREATE INDEX "raid_plans_eventid_idx" ON "raid_plans"("eventid");

-- CreateIndex
CREATE INDEX "composition_presets_guildid_idx" ON "composition_presets"("guildid");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_role_permissions_guildid_roleid_key" ON "dashboard_role_permissions"("guildid", "roleid");

-- CreateIndex
CREATE INDEX "dashboard_role_permissions_guildid_idx" ON "dashboard_role_permissions"("guildid");

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_entries" ADD CONSTRAINT "log_entries_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_entries" ADD CONSTRAINT "log_entries_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participant_statistics" ADD CONSTRAINT "participant_statistics_guildid_fkey" FOREIGN KEY ("guildid") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raid_plans" ADD CONSTRAINT "raid_plans_eventid_fkey" FOREIGN KEY ("eventid") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raid_plans" ADD CONSTRAINT "raid_plans_guildid_fkey" FOREIGN KEY ("guildid") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "composition_presets" ADD CONSTRAINT "composition_presets_guildid_fkey" FOREIGN KEY ("guildid") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_role_permissions" ADD CONSTRAINT "dashboard_role_permissions_guildid_fkey" FOREIGN KEY ("guildid") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
