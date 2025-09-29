-- CreateTable
CREATE TABLE "public"."alumnos" (
    "id" SERIAL NOT NULL,
    "alumno" VARCHAR(100) NOT NULL,
    "dni" VARCHAR(20) NOT NULL,
    "correo" VARCHAR(100) NOT NULL,
    "telefono" VARCHAR(20),
    "fecha_ingreso" DATE NOT NULL,
    "matricula_activa" BOOLEAN DEFAULT true,
    "uo" VARCHAR(8) NOT NULL,
    "contraseña" VARCHAR(40) NOT NULL,

    CONSTRAINT "alumnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."asignaturas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripción" TEXT,
    "créditos" INTEGER NOT NULL,
    "curso" INTEGER NOT NULL,
    "semestre" INTEGER NOT NULL,
    "horas_teoría" DOUBLE PRECISION,
    "horas_prácticas" DOUBLE PRECISION,
    "superada" BOOLEAN NOT NULL,

    CONSTRAINT "Asignatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."grupo" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "clases_expositivas" VARCHAR(50),
    "practicas_aula" VARCHAR(50),
    "practicas_laboratorio" VARCHAR(50),
    "tutorias_grupales" VARCHAR(50),
    "id_profesor" INTEGER NOT NULL,

    CONSTRAINT "grupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."historial_grupo" (
    "id" SERIAL NOT NULL,
    "fecha_ini" DATE NOT NULL,
    "fecha_fin" DATE,
    "comentario" TEXT,
    "id_alumno" INTEGER NOT NULL,
    "id_grupo" INTEGER NOT NULL,

    CONSTRAINT "historial_grupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."horario_tutoria" (
    "id" SERIAL NOT NULL,
    "dia" INTEGER NOT NULL,
    "hora_ini" TIME(6) NOT NULL,
    "hora_fin" TIME(6) NOT NULL,
    "id_profesor" INTEGER NOT NULL,

    CONSTRAINT "horario_tutoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."matricula" (
    "id_alumno" INTEGER NOT NULL,
    "id_asignatura" INTEGER NOT NULL,
    "curso_academico" VARCHAR(9),
    "convocatorias" INTEGER DEFAULT 0,
    "nota_final" DOUBLE PRECISION,
    "nota_alfabetica" VARCHAR(50),
    "nota_actual" DOUBLE PRECISION,
    "evaluacion_diferenciada" BOOLEAN NOT NULL DEFAULT false,
    "movilidad_erasmus" BOOLEAN NOT NULL DEFAULT false,
    "id_grupo" INTEGER,
    "matriculas" INTEGER NOT NULL,

    CONSTRAINT "pk_matricula" PRIMARY KEY ("id_alumno","id_asignatura")
);

-- CreateTable
CREATE TABLE "public"."mensajes" (
    "id" SERIAL NOT NULL,
    "mensaje" TEXT NOT NULL,
    "fecha" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emisor" INTEGER NOT NULL,
    "id_alumno" INTEGER,
    "id_profesor" INTEGER,

    CONSTRAINT "mensajes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."nota" (
    "id" SERIAL NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "id_alumno" INTEGER NOT NULL,
    "id_prueba" INTEGER NOT NULL,

    CONSTRAINT "nota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profesores" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellidos" VARCHAR(150) NOT NULL,
    "correo" VARCHAR(120) NOT NULL,
    "telefono" VARCHAR(20),
    "departamento" VARCHAR(100),

    CONSTRAINT "profesor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pruebas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "nota_minima" DOUBLE PRECISION,
    "peso" DOUBLE PRECISION,
    "tipo_clase" INTEGER NOT NULL,
    "fecha_entrega" DATE,
    "fecha_modificacion" DATE,
    "id_asignatura" INTEGER NOT NULL,

    CONSTRAINT "prueba_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tablon_anuncios" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "contenido" TEXT NOT NULL,
    "id_asignatura" INTEGER,
    "id_grupo" INTEGER,
    "id_profesor" INTEGER,

    CONSTRAINT "tablon_anuncios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tutorias" (
    "id" SERIAL NOT NULL,
    "motivo" VARCHAR(200) NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_ini" TIME(6) NOT NULL,
    "hora_fin" TIME(6) NOT NULL,
    "id_profesor" INTEGER NOT NULL,
    "id_alumno" INTEGER NOT NULL,

    CONSTRAINT "tutorias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alumnos_dni_key" ON "public"."alumnos"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "alumnos_email_key" ON "public"."alumnos"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "profesor_correo_key" ON "public"."profesores"("correo");

-- AddForeignKey
ALTER TABLE "public"."grupo" ADD CONSTRAINT "fk_profesor_grupo" FOREIGN KEY ("id_profesor") REFERENCES "public"."profesores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."historial_grupo" ADD CONSTRAINT "fk_alumno_historial" FOREIGN KEY ("id_alumno") REFERENCES "public"."alumnos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."historial_grupo" ADD CONSTRAINT "fk_grupo_historial" FOREIGN KEY ("id_grupo") REFERENCES "public"."grupo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."horario_tutoria" ADD CONSTRAINT "fk_profesor_horario" FOREIGN KEY ("id_profesor") REFERENCES "public"."profesores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."matricula" ADD CONSTRAINT "fk_alumno_matricula" FOREIGN KEY ("id_alumno") REFERENCES "public"."alumnos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."matricula" ADD CONSTRAINT "fk_asignatura_matricula" FOREIGN KEY ("id_asignatura") REFERENCES "public"."asignaturas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."matricula" ADD CONSTRAINT "fk_grupo_matricula" FOREIGN KEY ("id_grupo") REFERENCES "public"."grupo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."mensajes" ADD CONSTRAINT "fk_alumno_mensaje" FOREIGN KEY ("id_alumno") REFERENCES "public"."alumnos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."mensajes" ADD CONSTRAINT "fk_profesor_mensaje" FOREIGN KEY ("id_profesor") REFERENCES "public"."profesores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."nota" ADD CONSTRAINT "fk_alumno_nota" FOREIGN KEY ("id_alumno") REFERENCES "public"."alumnos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."nota" ADD CONSTRAINT "fk_prueba_nota" FOREIGN KEY ("id_prueba") REFERENCES "public"."pruebas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."pruebas" ADD CONSTRAINT "fk_asignatura_prueba" FOREIGN KEY ("id_asignatura") REFERENCES "public"."grupo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."tablon_anuncios" ADD CONSTRAINT "fk_asignatura_anuncio" FOREIGN KEY ("id_asignatura") REFERENCES "public"."asignaturas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."tablon_anuncios" ADD CONSTRAINT "fk_grupo_anuncio" FOREIGN KEY ("id_grupo") REFERENCES "public"."grupo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."tablon_anuncios" ADD CONSTRAINT "fk_profesor_anuncio" FOREIGN KEY ("id_profesor") REFERENCES "public"."profesores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."tutorias" ADD CONSTRAINT "fk_alumno" FOREIGN KEY ("id_alumno") REFERENCES "public"."alumnos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."tutorias" ADD CONSTRAINT "fk_profesor" FOREIGN KEY ("id_profesor") REFERENCES "public"."profesores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
