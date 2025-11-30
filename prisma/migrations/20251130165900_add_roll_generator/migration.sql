-- DropIndex
DROP INDEX "events_discordeventid_idx";

-- AlterTable
ALTER TABLE "guilds" ALTER COLUMN "voicechannelcreatebefore" SET DEFAULT 60;

-- AlterTable
ALTER TABLE "system_settings" ALTER COLUMN "id" SET DEFAULT 'system';

-- CreateTable
CREATE TABLE "roll_generators" (
    "id" TEXT NOT NULL,
    "guildid" TEXT NOT NULL,
    "channelid" TEXT NOT NULL,
    "messageid" TEXT,
    "createdby" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "maxroll" INTEGER NOT NULL DEFAULT 100,
    "rollsperuser" INTEGER NOT NULL DEFAULT 1,
    "maxusers" INTEGER,
    "maxshown" INTEGER NOT NULL DEFAULT 10,
    "showusernames" BOOLEAN NOT NULL DEFAULT true,
    "duration" INTEGER,
    "startdelay" INTEGER,
    "bulkroll" TEXT,
    "showduplicates" BOOLEAN NOT NULL DEFAULT false,
    "allowedroles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "limittovoice" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "starttime" TIMESTAMP(3),
    "endtime" TIMESTAMP(3),
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roll_generators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roll_results" (
    "id" TEXT NOT NULL,
    "rollgeneratorid" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "rollvalue" INTEGER NOT NULL,
    "rolledat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roll_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roll_generators_guildid_idx" ON "roll_generators"("guildid");

-- CreateIndex
CREATE INDEX "roll_generators_messageid_idx" ON "roll_generators"("messageid");

-- CreateIndex
CREATE INDEX "roll_results_rollgeneratorid_idx" ON "roll_results"("rollgeneratorid");

-- CreateIndex
CREATE INDEX "roll_results_userid_idx" ON "roll_results"("userid");

-- CreateIndex
CREATE INDEX "dashboard_role_permissions_roleid_idx" ON "dashboard_role_permissions"("roleid");

-- AddForeignKey
ALTER TABLE "roll_generators" ADD CONSTRAINT "roll_generators_guildid_fkey" FOREIGN KEY ("guildid") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roll_results" ADD CONSTRAINT "roll_results_rollgeneratorid_fkey" FOREIGN KEY ("rollgeneratorid") REFERENCES "roll_generators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
