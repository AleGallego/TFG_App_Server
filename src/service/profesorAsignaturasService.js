const prisma = require("../prismaClient.js");


const profesorAsignaturasService = {

    getAllAsignaturas: async () => {
        try {
            const asignaturas = await prisma.asignaturas.findMany({
                select: { id: true, nombre: true, curso: true }
            });

            if (!asignaturas || asignaturas.length === 0) {
                return { success: false, message: "No se encontraron asignaturas", data: [] };
            }

            return { success: true, message: "Asignaturas obtenidas correctamente", data: asignaturas };

        } catch (error) {
            console.error("Error en getAllAsignaturas:", error);
            return { success: false, message: "Error al obtener las asignaturas", data: [] };
        }
    },

    getClasesAsignatura: async (id_asignatura) => {
        try {

            const asignatura = await prisma.asignaturas.findUnique({
                where: { id: id_asignatura },
                select: { id: true, nombre: true }
            });

            if (!asignatura) {
                return { success: false, message: "La asignatura especificada no existe", data: [] };
            }

            const clases = await prisma.clases.findMany({
                where: { id_asignatura },
                select: { id: true, nombre: true ,tipo:true}
            });

            return { success: true, message: "Clases obtenidas correctamente", data: clases };

        } catch (error) {
            console.error("Error en getClasesAsignatura:", error);
            return {
                success: false, message: "Error al obtener las clases de la asignatura", data: []
            };
        }

    },

    asignarClaseProfesor: async (id_clase, id_profesor) => {
        try {
            // Se comprueba si existe la clase
            const clase = await prisma.clases.findUnique({
                where: { id: id_clase },
                include: { asignaturas: true }
            });

            if (!clase) {
                return { success: false, message: "La clase no existe", data: [] };
            }

            // Comprobar si la clase ya tiene profesor asignado
            if (clase.id_profesor) {
                return { success: false, message: "Esta clase ya tiene un profesor asignado", data: [] };
            }

            // Se asigna el profesor a la clase
            const claseActualizada = await prisma.clases.update({
                where: { id: id_clase },
                data: { id_profesor },
                select: {
                    id: true,
                    nombre: true,
                    id_profesor: true,
                    asignaturas: { select: { id: true, nombre: true } },
                },
            });

            return {
                success: true,
                message: `Clase '${claseActualizada.nombre}' asignada correctamente al profesor`,
                data: claseActualizada,
            };
        } catch (error) {
            console.error("Error en asignarClaseProfesor:", error);
            return { success: false, message: "Error al asignar la clase al profesor" };
        }
    },

    getMyClasesAsignaturasProfesor: async (profesorId) => {
        try {
            // Comprobamos si el profesor existe
            const profesor = await prisma.profesores.findUnique({
                where: { id: profesorId },
            });
            if (!profesor) {
                return { success: false, message: "Profesor no encontrado.", data: [], };
            }

            // Obtenemos todas las clases que imparte el profesor, junto con su asignatura
            const clases = await prisma.clases.findMany({
                where: { id_profesor: profesorId },
                select: {
                    id: true,
                    tipo: true,
                    nombre: true,
                    id_asignatura: true,
                    asignaturas: {
                        select: {
                            id: true,
                            nombre: true,
                            curso: true
                        }
                    }
                }
            });

            if (!clases || clases.length === 0) {
                return { success: false, message: "No se encontraron clases para este profesor.", data: [], };
            }

            // Agrupar las clases por asignatura
            const asignaturasOrdenadas = Object.values(
                clases.reduce((acc, c) => {
                    const asignaturaId = c.id_asignatura;
                    if (!acc[asignaturaId]) {
                        acc[asignaturaId] = {
                            id: c.asignaturas.id,
                            nombre: c.asignaturas.nombre,
                            curso: c.asignaturas.curso,
                            clases: []
                        };
                    }
                    acc[asignaturaId].clases.push({
                        id: c.id,
                        tipo: c.tipo,
                        nombre: c.nombre,
                    });
                    return acc;
                }, {})
            );

            return { success: true, message: "Asignaturas y clases obtenidas correctamente.", data: asignaturasOrdenadas };

        } catch (error) {
            console.error("Error en getMyClasesAsignaturasProfesor:", error);
            return { success: false, message: "Error interno al obtener las asignaturas del profesor.", data: [] };
        }
    }




}

module.exports = profesorAsignaturasService