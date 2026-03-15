-- DropForeignKey
ALTER TABLE "OTBot" DROP CONSTRAINT "OTBot_telegramUserId_fkey";

-- AlterTable
ALTER TABLE "OTBot" ALTER COLUMN "telegramUserId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "OTBot" ADD CONSTRAINT "OTBot_telegramUserId_fkey" FOREIGN KEY ("telegramUserId") REFERENCES "TelegramUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
