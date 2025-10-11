const prisma = require("../prismaClient.js");


const profesorAsignaturasService = {

    getAllAsignaturas: async () => {
        const asignaturas = await prisma.asignaturas.findMany({
            select: { id: true, nombre: true, curso: true }
        })
        return asignaturas
    },

    getClasesAsignatura: async (id) => {
        const clases = await prisma.clases.findMany({
            where: {
               id_asignatura:id
            },
            select:{id:true,nombre: true}
        });       

        return clases;
    }

}

module.exports = profesorAsignaturasService