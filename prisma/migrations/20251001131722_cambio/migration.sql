/*
  Warnings:

  - You are about to drop the `PasswordResetToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."PasswordResetToken" DROP CONSTRAINT "PasswordResetToken_id_alumno_fkey";

-- DropTable
DROP TABLE "public"."PasswordResetToken";

-- CreateTable
CREATE TABLE "public"."passwordresettoken" (
    "id" SERIAL NOT NULL,
    "id_alumno" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passwordresettoken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "passwordresettoken_id_alumno_idx" ON "public"."passwordresettoken"("id_alumno");

-- AddForeignKey
ALTER TABLE "public"."passwordresettoken" ADD CONSTRAINT "passwordresettoken_id_alumno_fkey" FOREIGN KEY ("id_alumno") REFERENCES "public"."alumnos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
