/*
  Warnings:

  - You are about to drop the column `id_asignatura` on the `pruebas` table. All the data in the column will be lost.
  - You are about to drop the column `tipo_clase` on the `pruebas` table. All the data in the column will be lost.
  - Added the required column `id_clase` to the `pruebas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."pruebas" DROP CONSTRAINT "fk_asignatura_prueba";

-- AlterTable
ALTER TABLE "pruebas" DROP COLUMN "id_asignatura",
DROP COLUMN "tipo_clase",
ADD COLUMN     "id_clase" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "pruebas" ADD CONSTRAINT "fk_clase_prueba" FOREIGN KEY ("id_clase") REFERENCES "clases"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
