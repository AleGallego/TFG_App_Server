/*
  Warnings:

  - You are about to drop the column `id_profesor` on the `grupo` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[clases_expositivas,practicas_aula,practicas_laboratorio,tutorias_grupales]` on the table `grupo` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."grupo" DROP CONSTRAINT "fk_profesor_grupo";

-- AlterTable
ALTER TABLE "public"."grupo" DROP COLUMN "id_profesor";

-- CreateIndex
CREATE UNIQUE INDEX "grupo_clases_expositivas_practicas_aula_practicas_laborator_key" ON "public"."grupo"("clases_expositivas", "practicas_aula", "practicas_laboratorio", "tutorias_grupales");
