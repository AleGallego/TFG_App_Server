-- CreateTable
CREATE TABLE "public"."profesorClaseGrupo" (
    "id_profesor" INTEGER NOT NULL,
    "id_grupo" INTEGER NOT NULL,
    "tipo_clase" TEXT NOT NULL,

    CONSTRAINT "profesorClaseGrupo_pkey" PRIMARY KEY ("id_profesor","id_grupo","tipo_clase")
);

-- AddForeignKey
ALTER TABLE "public"."profesorClaseGrupo" ADD CONSTRAINT "profesorClaseGrupo_id_profesor_fkey" FOREIGN KEY ("id_profesor") REFERENCES "public"."profesores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."profesorClaseGrupo" ADD CONSTRAINT "profesorClaseGrupo_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "public"."grupo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
