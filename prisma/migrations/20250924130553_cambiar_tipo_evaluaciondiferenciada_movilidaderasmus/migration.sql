-- AlterTable
ALTER TABLE "public"."matricula" ALTER COLUMN "evaluacion_diferenciada" DROP DEFAULT,
ALTER COLUMN "evaluacion_diferenciada" SET DATA TYPE VARCHAR(2),
ALTER COLUMN "movilidad_erasmus" DROP DEFAULT,
ALTER COLUMN "movilidad_erasmus" SET DATA TYPE VARCHAR(2);
