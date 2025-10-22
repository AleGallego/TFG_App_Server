/*
  Warnings:

  - Added the required column `hora_fin` to the `revision` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hora_ini` to the `revision` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "revision" ADD COLUMN     "hora_fin" TIME(6) NOT NULL,
ADD COLUMN     "hora_ini" TIME(6) NOT NULL;
