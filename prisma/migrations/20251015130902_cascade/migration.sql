-- DropForeignKey
ALTER TABLE "public"."pruebas" DROP CONSTRAINT "fk_clase_prueba";

-- AddForeignKey
ALTER TABLE "pruebas" ADD CONSTRAINT "fk_clase_prueba" FOREIGN KEY ("id_clase") REFERENCES "clases"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
