/*
  Warnings:

  - Added the required column `id_profesor` to the `clases` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "clases" ADD COLUMN     "id_profesor" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "clases" ADD CONSTRAINT "clases_id_profesor_fkey" FOREIGN KEY ("id_profesor") REFERENCES "profesores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
