-- CreateTable
CREATE TABLE "guilds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "logChannelId" TEXT,
    "archiveChannelId" TEXT,
    "managerRoleId" TEXT,
    "commandPrefix" TEXT NOT NULL DEFAULT '!',
    "approvalChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reminderIntervals" TEXT[] DEFAULT ARRAY['1h', '15m']::TEXT[],
    "autoDeleteHours" INTEGER,
    "threadChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
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
