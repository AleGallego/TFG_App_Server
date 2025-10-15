const prisma = require('../prismaClient.js');
const tableMaps = require('../utils/tableMaps.js')
const { excelToJsonNotas } = require('../utils/jsonConverter.js');

const notasService = {

    publicarNotas: async (excelNotas, idPrueba) => {
        try {


            // Comprobar que la prueba existe
            const prueba = await prisma.pruebas.findUnique({
                where: { id: idPrueba },
                select: { id: true, nombre: true }
            });

            if (!prueba) {
                return {success: false, message: `La prueba con id ${idPrueba} no existe.`,data: []};
            }

            const tabla = excelToJsonNotas(excelNotas)
            if (!tabla || tabla.length === 0) {
                return { success: false, message: "El archivo Excel está vacío o no tiene el formato esperado.", data: [] };
            }

            // Obtener los UOs únicos
            const uos = tabla.map(row => row.uo);
            if (uos.length === 0) {
                return { success: false, message: "No se encontraron UOs válidos en el archivo Excel.", data: [] }
            }

            // Buscar los alumnos con esos UOs
            const alumnos = await prisma.alumnos.findMany({
                where: {
                    uo: { in: uos }
                },
                select: {
                    id: true,
                    uo: true
                }
            });

            //Mapear las notas con los IDs y detectar los UOs no encontrados
            const { listaNotas, uosNoEncontrados } = tableMaps.mapNotas(alumnos, tabla, idPrueba);

            if (listaNotas.length === 0) {
                return {success: false,message: "No se pudo insertar ninguna nota. Ningún UO del Excel coincide con los alumnos registrados.",data: []};
            }

            // Insertar todas las notas
            await prisma.nota.createMany({
                data: listaNotas,
            });

            return {
                success: true,
                message: "Notas publicadas correctamente",
                data: {
                    insertados: `${listaNotas.length} de ${uos.length}`,
                    noInsertados: uosNoEncontrados.length,
                    uosNoEncontrados
                }
            };
        }
        catch (error) {
            console.error("Error en notasService.publicarNotas:", error);
            return {
                success: false,
                message: "Error interno en el server al publicar las notas.",
                data: []
            };
        }
    }

}
module.exports = notasService