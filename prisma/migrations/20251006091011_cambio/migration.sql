/*
  Warnings:

  - A unique constraint covering the columns `[tipo,nombre,id_asignatura]` on the table `clases` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "clases_tipo_nombre_id_asignatura_key" ON "clases"("tipo", "nombre", "id_asignatura");
