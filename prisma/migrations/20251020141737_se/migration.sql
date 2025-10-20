-- AlterTable
ALTER TABLE "tutorias" ADD COLUMN     "aceptada" BOOLEAN;

-- CreateTable
CREATE TABLE "revision" (
    "id" SERIAL NOT NULL,
    "motivo" VARCHAR(200) NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_ini" TIME(6) NOT NULL,
    "hora_fin" TIME(6) NOT NULL,
    "id_prueba" INTEGER NOT NULL,

    CONSTRAINT "revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revision_alumno" (
    "id_revision" INTEGER NOT NULL,
    "id_alumno" INTEGER NOT NULL,

    CONSTRAINT "revision_alumno_pkey" PRIMARY KEY ("id_revision","id_alumno")
);

-- AddForeignKey
ALTER TABLE "revision" ADD CONSTRAINT "fk_revision_prueba" FOREIGN KEY ("id_prueba") REFERENCES "pruebas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "revision_alumno" ADD CONSTRAINT "fk_revision" FOREIGN KEY ("id_revision") REFERENCES "revision"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "revision_alumno" ADD CONSTRAINT "fk_alumno" FOREIGN KEY ("id_alumno") REFERENCES "alumnos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
