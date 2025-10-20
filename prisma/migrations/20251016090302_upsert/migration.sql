/*
  Warnings:

  - A unique constraint covering the columns `[id_alumno,id_prueba]` on the table `nota` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "nota_id_alumno_id_prueba_key" ON "nota"("id_alumno", "id_prueba");
