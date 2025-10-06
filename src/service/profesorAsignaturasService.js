const prisma = require("../prismaClient.js");


const profesorAsignaturasService = {

    getAllAsignaturas: async () => {
        const asignaturas = await prisma.asignaturas.findMany({
            select: { id: true, nombre: true, curso: true }
        })
        return asignaturas
    },

    getGruposAsignatura: async (id) => {
        const clases = await prisma.clases.findMany({
            where: {
               id_asignatura:id
            },
            select:{id:true,nombre: true}
        });

        // Convertimos en sets para eliminar duplicados y luego otra vez en array (es mas cómodo)
        

        return clases;
    }

}

module.exports = profesorAsignaturasService