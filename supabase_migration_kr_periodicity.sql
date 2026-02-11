-- Add new columns for Key Result Periodicity
ALTER TABLE "KeyResult" ADD COLUMN "startYear" INTEGER;
ALTER TABLE "KeyResult" ADD COLUMN "startQuarter" INTEGER;
ALTER TABLE "KeyResult" ADD COLUMN "endYear" INTEGER;
ALTER TABLE "KeyResult" ADD COLUMN "endQuarter" INTEGER;
