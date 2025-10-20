const prisma = require('../prismaClient.js');
const tableMaps = require('../utils/tableMaps.js')
const { excelToJsonNotas } = require('../utils/jsonConverter.js');

const notasService = {

    publicarNotas: async (excelNotas, idPrueba) => {
        try {


            // Comprobar que la prueba existe
            const prueba = await prisma.pruebas.findUnique({
                where: { id: idPrueba },
                select: { id: true, nombre: true, id_clase: true }
            });

            if (!prueba) {
                return { success: false, message: `La prueba con id ${idPrueba} no existe.`, data: [] };
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

            // Buscar los alumnos con esos UOs y que pertenezcan a la clase de la prueba
            const alumnos = await prisma.alumnos.findMany({
                where: {
                    uo: { in: uos },
                    matricula: {
                        some: {
                            grupo: {
                                grupo_clases: {
                                    some: {
                                        id_clases: prueba.id_clase
                                    }
                                }
                            }
                        }
                    }
                },
                select: {
                    id: true,
                    uo: true
                }
            });
            //Mapear las notas con los IDs y detectar los UOs no encontrados
            const { listaNotas, uosNoInsertados } = tableMaps.mapNotas(alumnos, tabla, idPrueba);

            if (listaNotas.length === 0) {
                return { success: false, message: "No se pudo insertar ninguna nota. Ningún UO del Excel coincide con los alumnos registrados.", data: [] };
            }

            // 6️⃣ Insertar o actualizar las notas existentes (upsert)
            let insertados = 0;
            let actualizados = 0;

            await Promise.all(
                listaNotas.map(async (n) => {
                    // Intentamos encontrar una nota existente
                    const notaExistente = await prisma.nota.findUnique({
                        where: {
                            id_alumno_id_prueba: {
                                id_alumno: n.id_alumno,
                                id_prueba: n.id_prueba
                            }
                        }
                    });

                    if (notaExistente) {
                        await prisma.nota.update({
                            where: {
                                id_alumno_id_prueba: {
                                    id_alumno: n.id_alumno,
                                    id_prueba: n.id_prueba
                                }
                            },
                            data: { nota: n.nota }
                        });
                        actualizados++;
                    } else {
                        await prisma.nota.create({ data: n });
                        insertados++;
                    }
                })
            );

            // 7️⃣ Respuesta final
            return {
                success: true,
                message: "Notas publicadas/actualizadas correctamente.",
                data: {
                    totalExcel: uos.length,
                    insertados,
                    actualizados,
                    noInsertados: uosNoInsertados.length,
                    uosNoInsertados
                }
            };
        }
        catch (error) {
            console.error("Error en notasService.publicarNotas:", error);
            return {
                success: false,
                message: `Error interno al publicar las notas: ${error.message}`,
                data: []
            };
        }
    },

    // Obtener todas las notas de una prueba
    getNotasByPrueba: async (idPrueba) => {
        try {
            // Comprobar que la prueba existe
            const prueba = await prisma.pruebas.findUnique({
                where: { id: idPrueba },
                select: { id: true, nombre: true }
            });

            if (!prueba) {
                return { success: false, message: `La prueba con id ${idPrueba} no existe.`, data: [] };
            }

            // Obtener todas las notas de la prueba
            const notas = await prisma.nota.findMany({
                where: { id_prueba: idPrueba },
                select: {
                    id: true,
                    id_alumno: true,
                    nota: true,
                    alumnos: {
                        select: {
                            uo: true,
                            alumno: true
                        }
                    }
                }
            });

            if (notas.length === 0) {
                return { success: false, message: "Todavía no hay notas publicadas para esta prueba.", data: [] };
            }
            return { success: true, message: `Notas de la prueba "${prueba.nombre}" obtenidas correctamente.`, data: notas };

        } catch (error) {
            console.error("Error en notasService.getNotasByPrueba:", error);
            return { success: false, message: "Error interno en el servidor al obtener notas.", data: [] };
        }
    },
    
    actualizarNota: async (id_nota, valorNota) => {
        try {
            // Comprobar que la nota existe
            const notaExistente = await prisma.nota.findUnique({
                where: { id: id_nota }
            });

            if (!notaExistente) {
                return { success: false, message: `La nota con id ${id_nota} no existe.`, data: [] };
            }

            // Actualizar la nota
            const notaActualizada = await prisma.nota.update({
                where: { id: id_nota },
                data: { nota: valorNota }
            });

            return { success: true, message: "Nota actualizada correctamente.", data: notaActualizada };

        } catch (error) {
            console.error("Error en notasService.actualizarNota:", error);
            return { success: false, message: "Error interno al actualizar la nota.", data: [] };
        }
    }



}
module.exports = notasService