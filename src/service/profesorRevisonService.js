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
async function comprobarSolapamientos(id_profesor, franjas, idsExcluir = []) {
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
                // Excluir las franjas con IDs especificados
                NOT: idsExcluir.length > 0 ? { id: { in: idsExcluir } } : undefined,
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

async function procesarHorariosRevision(horario, id_profesor, revisionExistente) {

    const horariosProcesados = [];

    for (const h of horario) {
        // Validar campos obligatorios
        if (!h.dia || !h.hora_ini || !h.hora_fin) {
            return { success: false, message: "Cada horario debe tener dia, hora_ini y hora_fin.", data: [] };
        }

        // Convertir a objetos Date
        const diaObj = new Date(h.dia);
        const horaIniObj = new Date(h.hora_ini);
        const horaFinObj = new Date(h.hora_fin);

        // Validar fechas/hours
        if (isNaN(diaObj.getTime()) || isNaN(horaIniObj.getTime()) || isNaN(horaFinObj.getTime())) {
            return { success: false, message: `Formato inválido para día u hora (${h.dia}, ${h.hora_ini}, ${h.hora_fin}).`, data: [] };
        }

        // Validar que hora_ini < hora_fin
        if (horaIniObj >= horaFinObj) {
            return { success: false, message: `Hora de inicio debe ser anterior a hora de fin (${h.hora_ini} - ${h.hora_fin}).`, data: [] };
        }

        // Guardar los objetos Date en la franja
        h.diaObj = diaObj;
        h.horaIniObj = horaIniObj;
        h.horaFinObj = horaFinObj;

        horariosProcesados.push(h);
    }
    // Comprobar solapamientos internos
    const internos = comprobarSolapamientosInternos(horariosProcesados);
    if (!internos.success) return internos;

    // Comprobar solapamientos con otras revisiones en la BD
    const idsHorariosAExcluir = horario.filter(h => h.id).map(h => h.id); // solo las que se están actualizando
    const solapamientos = await comprobarSolapamientos(id_profesor, horariosProcesados, idsHorariosAExcluir
    );
    if (!solapamientos.success) return solapamientos;

    return { success: true, data: horariosProcesados };
}

function comprobarSolapamientosInternos(franjas) {
    const conflictos = [];

    // Recorremos todas las combinaciones de franjas
    for (let i = 0; i < franjas.length; i++) {
        for (let j = i + 1; j < franjas.length; j++) {
            const a = franjas[i];
            const b = franjas[j];

            // Comprobar si están en el mismo día
            if (a.dia === b.dia) {
                // Comprobar solapamiento
                const solapan =
                    a.horaIniObj < b.horaFinObj && a.horaFinObj > b.horaIniObj;

                if (solapan) {
                    conflictos.push({
                        dia: a.dia,
                        franjaA: { hora_ini: a.hora_ini, hora_fin: a.hora_fin },
                        franjaB: { hora_ini: b.hora_ini, hora_fin: b.hora_fin },
                    });
                }
            }
        }
    }

    if (conflictos.length > 0) {
        return {
            success: false,
            message: "Las franjas horarias introducidas se solapan entre sí.",
            data: conflictos,
        };
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
        const ahora = new Date();

        try {
            const revisiones = await prisma.revision.findMany({
                where: {
                    prueba: {
                        clases: { id_profesor }
                    }
                },
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
                    horario_revision: true,
                    revision_alumno: {
                        include: {
                            alumnos: {
                                select: { id: true, alumno: true, correo: true }
                            }
                        }
                    }
                }
            });

            // Filtrar franjas futuras
            const revisionesPendientes = revisiones.map(r => {
                const franjasFuturas = r.horario_revision.filter(h => {
                    const inicio = new Date(h.dia);
                    inicio.setHours(h.hora_ini.getHours(), h.hora_ini.getMinutes(), 0, 0);
                    return inicio >= ahora;
                });
                return { ...r, horario_revision: franjasFuturas };
            }).filter(r => r.horario_revision.length > 0); // eliminar revisiones sin franjas futuras

            return { success: true, message: `Se han encontrado ${revisionesPendientes.length} revisiones pendientes.`, data: revisionesPendientes, };
        } catch (error) {
            console.error("Error en obtenerRevisionesPendientes:", error);
            return { success: false, message: "Error al obtener las revisiones pendientes.", data: [], };
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
    },

    actualizarRevision: async (id_revision, duracion, horario, id_profesor) => {
        if (!id_revision) {
            return { success: false, message: "El id_revision es obligatorio.", data: [] };
        }

        try {
            // Comprobar que la revisión existe
            const revisionExistente = await prisma.revision.findUnique({
                where: { id: parseInt(id_revision) },
                include: {
                    horario_revision: true,
                    prueba: {
                        include: {
                            clases: true
                        }
                    }
                }
            });
            if (!revisionExistente) {
                return { success: false, message: "La revisión especificada no existe.", data: [] };
            }

            // Validar duración si viene
            let duracionInt = revisionExistente.duracion;
            if (duracion !== undefined) {
                duracionInt = parseInt(duracion);
                if (isNaN(duracionInt) || duracionInt <= 0) {
                    return { success: false, message: "La duración debe ser un número entero positivo (en minutos).", data: [] };
                }
            }

            // Preparar operaciones de horario si vienen
            let horariosProcesados = [];
            if (horario && horario.length > 0) {
                // Validación de franjas
                const resultadoHorarios = await procesarHorariosRevision(horario, id_profesor, revisionExistente);
                if (!resultadoHorarios.success) return resultadoHorarios;

                horariosProcesados = resultadoHorarios.data;
            }

            // Transacción: actualizar duración + horarios
            const updatedRevision = await prisma.$transaction(async (tx) => {
                // Actualizar duración
                await tx.revision.update({
                    where: { id: parseInt(id_revision) },
                    data: { duracion: duracionInt }
                });

                if (horariosProcesados.length > 0) {
                    // Crear/actualizar franjas
                    for (const h of horariosProcesados) {
                        if (h.id) {
                            // Actualizar franja existente
                            await tx.horario_revision.update({
                                where: { id: h.id },
                                data: { dia: h.diaObj, hora_ini: h.horaIniObj, hora_fin: h.horaFinObj }
                            });
                        } else {
                            // Crear nueva franja
                            await tx.horario_revision.create({
                                data: { id_revision: parseInt(id_revision), dia: h.diaObj, hora_ini: h.horaIniObj, hora_fin: h.horaFinObj }
                            });
                        }
                    }

                }

                return tx.revision.findUnique({
                    where: { id: parseInt(id_revision) },
                    include: { horario_revision: true }
                });
            });

            return { success: true, message: "Revisión actualizada correctamente.", data: updatedRevision };

        } catch (error) {
            console.error("Error en actualizarRevisionConHorarios:", error);
            return { success: false, message: "Error interno al actualizar la revisión.", data: [] };
        }

    },

    eliminarFranjaHorario: async (id_horario, id_profesor) => {
        try {

            
            // Comprobar que la franja existe y pertenece al profesor
            const franja = await prisma.horario_revision.findUnique({
                where: { id: id_horario },
                include: { revision: { include: { prueba: { include: { clases: true } } } } }
            });

            if (!franja) {
                return { success: false, message: "La franja horaria no existe.", data: [] };
            }

            if (franja.revision.prueba.clases.id_profesor !== id_profesor) {
                return { success: false, message: "No tienes permisos para eliminar esta franja.", data: [] };
            }

            // Eliminar la franja
            await prisma.horario_revision.delete({
                where: { id: id_horario }
            });

            return { success: true, message: "Franja horaria eliminada correctamente.", data: { id_horario } };

        } catch (error) {
            console.error("Error en eliminarFranjaHorario:", error);
            return { success: false, message: "Error interno al eliminar la franja horaria.", data: [] };
        }
    },

};

module.exports = profesorRevisionService;
