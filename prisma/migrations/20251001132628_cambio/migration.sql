/*
  Warnings:

  - A unique constraint covering the columns `[id_alumno]` on the table `passwordresettoken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "passwordresettoken_id_alumno_key" ON "public"."passwordresettoken"("id_alumno");
