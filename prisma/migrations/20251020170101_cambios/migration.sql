/*
  Warnings:

  - Made the column `aceptada` on table `tutorias` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tutorias" ALTER COLUMN "aceptada" SET NOT NULL;
