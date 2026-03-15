/*
  Warnings:

  - A unique constraint covering the columns `[otNumero]` on the table `OTBot` will be added. If there are existing duplicate values, this will fail.
  - Made the column `otNumero` on table `OTBot` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "OTBot" ALTER COLUMN "otNumero" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OTBot_otNumero_key" ON "OTBot"("otNumero");
