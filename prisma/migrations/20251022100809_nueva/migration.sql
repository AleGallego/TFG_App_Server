/*
  Warnings:

  - You are about to drop the column `fecha` on the `revision` table. All the data in the column will be lost.
  - You are about to drop the column `hora_fin` on the `revision` table. All the data in the column will be lost.
  - You are about to drop the column `hora_ini` on the `revision` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "revision" DROP COLUMN "fecha",
DROP COLUMN "hora_fin",
DROP COLUMN "hora_ini";

-- CreateTable
CREATE TABLE "horario_revision" (
    "id" SERIAL NOT NULL,
    "dia" DATE NOT NULL,
    "hora_ini" TIME(6) NOT NULL,
    "hora_fin" TIME(6) NOT NULL,
    "id_revision" INTEGER NOT NULL,

    CONSTRAINT "horario_revision_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "horario_revision" ADD CONSTRAINT "fk_horario_revision_revision" FOREIGN KEY ("id_revision") REFERENCES "revision"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
