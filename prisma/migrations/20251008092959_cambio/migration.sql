/*
  Warnings:

  - You are about to drop the column `id_grupo` on the `tablon_anuncios` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."tablon_anuncios" DROP CONSTRAINT "fk_grupo_anuncio";

-- AlterTable
ALTER TABLE "tablon_anuncios" DROP COLUMN "id_grupo",
ADD COLUMN     "id_clase" INTEGER;

-- AddForeignKey
ALTER TABLE "tablon_anuncios" ADD CONSTRAINT "fk_clases_anuncio" FOREIGN KEY ("id_clase") REFERENCES "clases"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
