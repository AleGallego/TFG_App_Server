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
                select: { id: true, nombre: true }
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
                return { success: false, message: "La clase no existe",data:[]};
            }

            // Comprobar si la clase ya tiene profesor asignado
            if (clase.id_profesor) {
                return { success: false, message: "Esta clase ya tiene un profesor asignado" ,data:[]};
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

}

module.exports = profesorAsignaturasService