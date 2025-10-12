const prisma = require("../prismaClient.js");

const tareasService = {
    nuevaPrueba: async (id_profesor, nombre, nota_minima, peso, fecha_entrega, id_clase) => {
        try {
            // Se comprueba si la clase existe
            const clase = await prisma.clases.findUnique({
                where: { id: id_clase },
                select: { id: true, id_profesor: true }
            });

            if (!clase) {

                return { success: false, message: "La clase especificada no existe.", data: [] }
            }
            if (clase.id_profesor !== id_profesor) {
                return { success: false, message: "No tienes permisos para publicar tareas en esta clase", data: [] }
            }
            const nuevaTarea = await prisma.pruebas.create({
                data: {
                    nombre,
                    nota_minima,
                    peso,
                    fecha_entrega: fecha_entrega ? new Date(fecha_entrega) : null,
                    id_clase
                },
            });

            return {success: true, message: "Prueba registrada con éxito",data:nuevaTarea};
        } catch (error) {
            console.error("Error en nuevaPrueba:", error);
            throw error;
        }
    },

    modificarPrueba: async (id_profesor, id_prueba, nombre, nota_minima, peso, fecha_entrega) => {
        try {
            // 1Verificar que la prueba existe
            const prueba = await prisma.pruebas.findUnique({
                where: { id: id_prueba },
                include: { clases: true }
            });

            if (!prueba) {
                throw new Error("La tarea especificada no existe.");
            }

            // 2Verificar que la clase pertenece al profesor logeado
            if (prueba.clases.id_profesor !== id_profesor) {
                throw new Error("No tienes permisos para modificar esta tarea.");
            }

            // Actualizar la tarea
            const tareaActualizada = await prisma.pruebas.update({
                where: { id: id_prueba },
                data: {
                    nombre: nombre ?? prueba.nombre,
                    nota_minima: nota_minima ?? prueba.nota_minima,
                    peso: peso ?? prueba.peso,
                    fecha_entrega: fecha_entrega ? new Date(fecha_entrega) : prueba.fecha_entrega,
                    fecha_modificacion: new Date(),
                },
            });

            return {
                success: true,
                message: "Tarea actualizada correctamente",
                data: tareaActualizada
            };

        } catch (error) {
            console.error("Error en modificarPrueba:", error);
            return { success: false, message: error.message, data: [] };
        }
    },

    obtenerPruebasProfesor: async (id_profesor, id_asignatura, id_clase) => {
        try {

            const filtroClase = id_clase
                ? { id: id_clase } // si se pasa id_clase, filtramos por ella
                : {}; // si no, trae todas las clases de esa asignatura

            const tareas = await prisma.pruebas.findMany({
                where: {
                    clases: {
                        id_profesor: id_profesor,
                        id_asignatura: id_asignatura,
                        ...filtroClase
                    }
                },
                include: {
                    clases: {
                        select: {
                            id: true,
                            nombre: true,
                            tipo: true,
                            asignaturas: {
                                select: { nombre: true }
                            }
                        }
                    }
                },
                orderBy: { fecha_entrega: "asc" }
            });

            return tareas;
        } catch (error) {
            console.error("Error en obtenerTareasPorAsignatura:", error);
            throw error;
        }

    },

    obtenerPruebasAlumno: async (id_alumno, id_asignatura) => {
        try {
            const pruebas = await prisma.pruebas.findMany({
                where: {
                    clases: {
                        id_asignatura: id_asignatura,
                        grupo_clases: {
                            some: {
                                grupo: {
                                    matricula: {
                                        some: { id_alumno: id_alumno }
                                    }
                                }
                            }
                        }
                    }
                },
                include: {
                    clases: {
                        select: {
                            nombre: true,
                            asignaturas: { select: { nombre: true } }
                        }
                    },
                    notas: {
                        where: { id_alumno: id_alumno },
                        select: {
                            id: true,
                            nota: true,
                            fecha_entrega: true
                        }
                    }
                },
                orderBy: { fecha_entrega: 'asc' }
            });

            return pruebas;

        } catch (error) {
            console.error('Error en obtenerPruebasAlumno:', error);
            throw error;
        }
    }


};

module.exports = tareasService;
