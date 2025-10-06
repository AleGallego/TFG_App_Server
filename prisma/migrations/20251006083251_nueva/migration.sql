/*
  Warnings:

  - You are about to drop the column `clases_expositivas` on the `grupo` table. All the data in the column will be lost.
  - You are about to drop the column `practicas_aula` on the `grupo` table. All the data in the column will be lost.
  - You are about to drop the column `practicas_laboratorio` on the `grupo` table. All the data in the column will be lost.
  - You are about to drop the column `tutorias_grupales` on the `grupo` table. All the data in the column will be lost.
  - You are about to drop the `profesorClaseGrupo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."profesorClaseGrupo" DROP CONSTRAINT "profesorClaseGrupo_id_grupo_fkey";

-- DropForeignKey
ALTER TABLE "public"."profesorClaseGrupo" DROP CONSTRAINT "profesorClaseGrupo_id_profesor_fkey";

-- DropForeignKey
ALTER TABLE "public"."pruebas" DROP CONSTRAINT "fk_asignatura_prueba";

-- DropIndex
DROP INDEX "public"."grupo_clases_expositivas_practicas_aula_practicas_laborator_key";

-- AlterTable
ALTER TABLE "grupo" DROP COLUMN "clases_expositivas",
DROP COLUMN "practicas_aula",
DROP COLUMN "practicas_laboratorio",
DROP COLUMN "tutorias_grupales",
ALTER COLUMN "nombre" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "public"."profesorClaseGrupo";

-- CreateTable
CREATE TABLE "clases" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "id_asignatura" INTEGER NOT NULL,

    CONSTRAINT "clases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupo_clases" (
    "id_grupo" INTEGER NOT NULL,
    "id_clases" INTEGER NOT NULL,
    "id_asignatura" INTEGER NOT NULL,

    CONSTRAINT "grupo_clases_pkey" PRIMARY KEY ("id_grupo","id_clases")
);

-- AddForeignKey
ALTER TABLE "clases" ADD CONSTRAINT "clases_id_asignatura_fkey" FOREIGN KEY ("id_asignatura") REFERENCES "asignaturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_clases" ADD CONSTRAINT "grupo_clases_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "grupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_clases" ADD CONSTRAINT "grupo_clases_id_clases_fkey" FOREIGN KEY ("id_clases") REFERENCES "clases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pruebas" ADD CONSTRAINT "fk_asignatura_prueba" FOREIGN KEY ("id_asignatura") REFERENCES "asignaturas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
