/*
  Warnings:

  - You are about to drop the column `superada` on the `asignaturas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "asignaturas" DROP COLUMN "superada";

-- AlterTable
ALTER TABLE "matricula" ADD COLUMN     "superada" BOOLEAN NOT NULL DEFAULT false;
