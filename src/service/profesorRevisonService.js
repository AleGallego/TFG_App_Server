const prisma = require("../prismaClient.js");

// Validación de datos y formatos
function validarDatosRevision(id_profesor, motivo, duracion, id_prueba, horarios) {
    if (!id_profesor || !motivo || !duracion || !id_prueba || !horarios || horarios.length === 0) {
        return { success: false, message: "Faltan campos obligatorios o no hay horarios definidos.", data: [] };
    }

    // Validar duración
    const duracionInt = parseInt(duracion);
    if (isNaN(duracionInt) || duracionInt <= 0) {
        return { success: false, message: "La duración debe ser un número entero positivo (en minutos).", data: [] };
    }

    // Validar formato de horarios
    for (const h of horarios) {
        if (!h.dia || !h.hora_ini || !h.hora_fin)
            return { success: false, message: "Cada horario debe tener día, hora_ini y hora_fin.", data: [] };

        // Validar día
        const diaObj = new Date(h.dia);
        if (isNaN(diaObj.getTime()))
            return { success: false, message: `Formato de día inválido (${h.dia}). Usa formato YYYY-MM-DD.`, data: [] };

        // No permitir fechas pasadas
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (diaObj < hoy)
            return { success: false, message: `No se puede crear una revisión en una fecha pasada (${h.dia}).`, data: [] };
        // Validar horas como ISO
        const horaIniObj = new Date(h.hora_ini);
        const horaFinObj = new Date(h.hora_fin);

        if (isNaN(horaIniObj.getTime()) || isNaN(horaFinObj.getTime())) {
            return { success: false, message: `Formato de hora inválido (${h.hora_ini} o ${h.hora_fin}). Usa ISO (por ejemplo, 1970-01-01T09:00:00.000Z).`, data: [] };
        }

        // Validar que hora_ini < hora_fin
        if (horaIniObj >= horaFinObj) {
            return { success: false, message: `Hora de inicio debe ser anterior a hora de fin (${h.hora_ini} - ${h.hora_fin}).`, data: [] };
        }

        // Guardamos los objetos Date para usarlos después
        h.diaObj = diaObj;
        h.horaIniObj = horaIniObj;
        h.horaFinObj = horaFinObj;
    }

    return { success: true, data: { duracionInt, horarios } };
}

// Comprobar que la prueba existe y que la clase pertenece al profesor
async function validarPruebaYProfesor(id_prueba, id_profesor) {
    const prueba = await prisma.pruebas.findUnique({
        where: { id: parseInt(id_prueba) },
        include: { clases: true }
    });

    if (!prueba)
        return { success: false, message: "La prueba especificada no existe.", data: [] };

    if (prueba.clases.id_profesor !== id_profesor)
        return { success: false, message: "No tienes permisos para crear revisiones sobre esta prueba.", data: [] };

    return { success: true };
}

// Comprobar que no existan otras revisiones en los mismo días
async function comprobarSolapamientos(id_profesor, franjas) {
    const conflictos = [];

    for (const franja of franjas) {
        // Buscar revisiones del profesor en la misma fecha
        const revisionesExistentes = await prisma.horario_revision.findMany({
            where: {
                revision: {
                    prueba: {
                        clases: { id_profesor }
                    }
                },
                dia: franja.diaObj,
                OR: [
                    {
                        hora_ini: { lt: franja.horaFinObj },
                        hora_fin: { gt: franja.horaIniObj }
                    }
                ]
            }
        });

        if (revisionesExistentes.length > 0) {
            revisionesExistentes.forEach(r => {
                conflictos.push({ fecha: franja.dia, hora_ini: franja.hora_ini, hora_fin: franja.hora_fin, conflictoCon: r.id });
            });
        }
    }

    if (conflictos.length > 0) {
        return { success: false, message: "Existen solapamientos de horarios en la revisión: ", data: conflictos };
    }

    return { success: true };
}

// =================== SERVICE ===================
const profesorRevisionService = {

    crearRevisionConHorarios: async (id_profesor, motivo, duracion, id_prueba, horario) => {
        try {
            // Validar datos
            const validacion = validarDatosRevision(id_profesor, motivo, duracion, id_prueba, horario);
            if (!validacion.success) return validacion;
            const { duracionInt, horarios } = validacion.data;

            // Validar prueba y profesor
            const validacionPrueba = await validarPruebaYProfesor(id_prueba, id_profesor);
            if (!validacionPrueba.success) return validacionPrueba;

            //Comprobar si ya tiene revisiones en alguno de los días indicados
            const solapamientos = await comprobarSolapamientos(id_profesor, horarios);
            if (!solapamientos.success) return solapamientos;

            // Crear revisión con horarios
            const nuevaRevision = await prisma.revision.create({
                data: {
                    motivo,
                    duracion: duracionInt,
                    id_prueba: parseInt(id_prueba),
                    horario_revision: {
                        create: horarios.map(h => ({
                            dia: h.diaObj,
                            hora_ini: h.horaIniObj,
                            hora_fin: h.horaFinObj
                        }))
                    }
                },
                include: { horario_revision: true }
            });

            return { success: true, message: "Revisión creada correctamente.", data: nuevaRevision };

        } catch (error) {
            console.error("Error en profesorRevisionService.crearRevisionConHorarios:", error);
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

    borrarRevision: async (id_profesor, id_revision) => {
        try {
            // Comprobar que la revisión existe y pertenece al profesor
            const revision = await prisma.revision.findUnique({
                where: { id: parseInt(id_revision) },
                include: {
                    prueba: {
                        include: {
                            clases: true
                        }
                    }
                }
            });

            if (!revision) {
                return { success: false, message: "La revisión no existe.", data: [] };
            }

            if (revision.prueba.clases.id_profesor !== id_profesor) {
                return { success: false, message: "No tienes permisos para borrar esta revisión.", data: [] };
            }

            // Borrar la revisión
            await prisma.revision.delete({
                where: { id: parseInt(id_revision) }
            });

            return { success: true, message: "Revisión borrada correctamente.", data: [] };

        } catch (error) {
            console.error("Error en profesorRevisionService.borrarRevision:", error);
            return { success: false, message: "Error interno al borrar la revisión.", data: [] };
        }
    }
};

module.exports = profesorRevisionService;
