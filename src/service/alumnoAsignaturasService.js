const prisma = require("../prismaClient.js");

const alumnoAsignaturasService = {

    getMyAsignaturas: async (myId) => {
        const asignaturas = await prisma.asignaturas.findMany({
            select: { id: true, nombre: true, curso: true },
            where: {
                matricula: {
                    some: { id_alumno: myId }
                }
            }
        })
        if (asignaturas.length === 0) {
            return {
                success: false,
                message: "No se encontraron asignaturas para este alumno.",
                data: [],
            };
        }
        else {
            return {
                success: true,
                message: "Asignaturas obtenidas correctamente.",
                data: asignaturas,
            };
        }
    }

}

module.exports = alumnoAsignaturasService