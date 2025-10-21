/*
  Warnings:

  - You are about to drop the column `hora_fin` on the `revision` table. All the data in the column will be lost.
  - You are about to drop the column `hora_ini` on the `revision` table. All the data in the column will be lost.
  - Added the required column `duracion` to the `revision` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hora_fin` to the `revision_alumno` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hora_ini` to the `revision_alumno` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "revision" DROP COLUMN "hora_fin",
DROP COLUMN "hora_ini",
ADD COLUMN     "duracion" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "revision_alumno" ADD COLUMN     "hora_fin" TIME(6) NOT NULL,
ADD COLUMN     "hora_ini" TIME(6) NOT NULL;
