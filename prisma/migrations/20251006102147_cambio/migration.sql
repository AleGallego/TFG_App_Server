/*
  Warnings:

  - You are about to drop the column `id_asignatura` on the `grupo_clases` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nombre,id_asignatura]` on the table `grupo` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id_asignatura` to the `grupo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "grupo" ADD COLUMN     "id_asignatura" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "grupo_clases" DROP COLUMN "id_asignatura";

-- CreateIndex
CREATE UNIQUE INDEX "grupo_nombre_id_asignatura_key" ON "grupo"("nombre", "id_asignatura");

-- AddForeignKey
ALTER TABLE "grupo" ADD CONSTRAINT "grupo_id_asignatura_fkey" FOREIGN KEY ("id_asignatura") REFERENCES "asignaturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
