/*
  Warnings:

  - A unique constraint covering the columns `[id_profesor]` on the table `passwordresettoken` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "passwordresettoken" ADD COLUMN     "id_profesor" INTEGER,
ALTER COLUMN "id_alumno" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "passwordresettoken_id_profesor_key" ON "passwordresettoken"("id_profesor");

-- AddForeignKey
ALTER TABLE "passwordresettoken" ADD CONSTRAINT "passwordresettoken_id_profesor_fkey" FOREIGN KEY ("id_profesor") REFERENCES "profesores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
