-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "maxeventsperguild" INTEGER NOT NULL DEFAULT 100,
    "maxtemplatesperguild" INTEGER NOT NULL DEFAULT 50,
    "maintenancemode" BOOLEAN NOT NULL DEFAULT false,
    "allownewguilds" BOOLEAN NOT NULL DEFAULT true,
    "defaultlanguage" TEXT NOT NULL DEFAULT 'en',
    "loglevel" TEXT NOT NULL DEFAULT 'info',
    "enableanalytics" BOOLEAN NOT NULL DEFAULT true,
    "webhookurl" TEXT,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- Insert default settings row
INSERT INTO "system_settings" ("id", "updatedat") VALUES ('system', CURRENT_TIMESTAMP);
