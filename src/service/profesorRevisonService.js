const prisma = require("../prismaClient.js");

// =================== VALIDACIÓN DE DATOS ===================
function validarDatos(id_profesor, motivo, fecha, duracion, id_prueba) {
    // Validar campos obligatorios
    if (!id_profesor || !motivo || !fecha || !duracion || !id_prueba) {
        return { success: false, message: "Faltan campos obligatorios.", data: [] };
    }

    // Validar formato y valor de fecha
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) {
        return { success: false, message: "Formato de fecha inválido. Usa formato ISO (YYYY-MM-DD).", data: [] };
    }

    //  No permitir fechas pasadas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaObj < hoy) {
        return { success: false, message: "La fecha no puede ser anterior a la actual.", data: [] };
    }

    // Validar duración (entero positivo)
    const duracionInt = parseInt(duracion);
    if (isNaN(duracionInt) || duracionInt <= 0) {
        return { success: false, message: "La duración debe ser un número entero positivo (en minutos).", data: [] };
    }

    //Todo correcto
    return { success: true, data: { fechaObj, duracionInt } };
}

// =================== SERVICE ===================
const profesorRevisionService = {

    crearRevision: async (id_profesor, motivo, fecha, duracion, id_prueba) => {
        try {
            // Validar los datos
            const validacion = validarDatos(id_profesor, motivo, fecha, duracion, id_prueba);
            if (!validacion.success) return validacion;

            const { fechaObj, duracionInt } = validacion.data;

            // Comprobar que la prueba existe y que la clase pertenece al profesor
            const prueba = await prisma.pruebas.findUnique({
                where: { id: parseInt(id_prueba) },
                include: {
                    clases: true 
                }
            });

            if (!prueba) {
                return { success: false, message: "La prueba especificada no existe.", data: [] };
            }

            // Comprobamos que el profesor de la clase coincide con el profesor logueado
            if (prueba.clases.id_profesor !== id_profesor) {
                return { success: false, message: "No tienes permisos para crear revisiones sobre esta prueba.", data: [] };
            }

            // Evitar duplicados en la misma fecha para este profesor
            const revisionesExistentes = await prisma.revision.findMany({
                where: {
                    prueba: {
                        clases: { id_profesor: id_profesor }
                    },
                    fecha: fechaObj
                }
            });

            if (revisionesExistentes.length > 0) {
                return { success: false, message: "Ya existe una revisión para ese día.", data: [] };
            }

            // Crear la revisión
            const nuevaRevision = await prisma.revision.create({
                data: {
                    motivo,
                    fecha: fechaObj,
                    duracion: duracionInt,
                    id_prueba: parseInt(id_prueba),
                },
            });

            return { success: true, message: "Revisión creada correctamente.", data: nuevaRevision };

        } catch (error) {
            console.error("Error en profesorRevisionService.crearRevision:", error);
            return { success: false, message: "Error interno al crear la revisión.", data: [] };
        }
    },

    obtenerRevisionesPendientes: async (id_profesor) => {
        const ahora = new Date(); // fecha/hora actual

        try {
            const revisiones = await prisma.revision.findMany({
                where: {
                    prueba: {
                        clases: { id_profesor: id_profesor } // solo revisiones de clases del profesor
                    },
                    fecha: { gte: ahora } // solo revisiones futuras
                },
                orderBy: { fecha: 'asc' }, // ordenadas por fecha
                include: {
                    prueba: {
                        select: {
                            nombre: true,
                            clases: {
                                select: {
                                    asignaturas: {
                                        select: { nombre: true }
                                    }
                                }
                            }
                        }
                    },
                    revision_alumno: {
                        include: {
                            alumnos: {
                                select: { id: true, alumno: true, correo: true }
                            }
                        }
                    }
                }
            });

            return { success: true, message: `Se han encontrado ${revisiones.length} revisiones pendientes.`, data: revisiones, };
        } catch (error) {
            console.error("Error en obtenerRevisionesPendientes:", error);
            return {
                success: false, message: "Error al obtener las revisiones pendientes.", data: [],
            };
        }
    },
};

module.exports = profesorRevisionService;
