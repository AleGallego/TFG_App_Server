-- DropForeignKey
ALTER TABLE "public"."matricula" DROP CONSTRAINT "fk_grupo_matricula";

-- AddForeignKey
ALTER TABLE "matricula" ADD CONSTRAINT "fk_grupo_matricula" FOREIGN KEY ("id_grupo") REFERENCES "grupo"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
