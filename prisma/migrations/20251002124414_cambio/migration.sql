/*
  Warnings:

  - Added the required column `contraseña` to the `profesores` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."profesores" ADD COLUMN     "contraseña" VARCHAR(400) NOT NULL;
