const prisma = require('../prismaClient.js');


const validarHorarios = (horarios) => {
    const errores = [];
    const diasValidos = [1, 2, 3, 4, 5];

    // Validación individual de cada franja
    horarios.forEach((h, index) => {
        if (typeof h.dia !== 'number' || !diasValidos.includes(h.dia)) {
            errores.push(`Fila ${index + 1}: el día ${h.dia} no es válido (debe ser 1 a 5).`);
        }

        if (!h.hora_ini || !h.hora_fin) {
            errores.push(`Fila ${index + 1}: faltan las horas de inicio o fin.`);
        } else {
            const ini = new Date(h.hora_ini);
            const fin = new Date(h.hora_fin);

            if (isNaN(ini.getTime())) {
                errores.push(`Fila ${index + 1}: hora_ini no es un ISO-8601 válido.`);
            }
            if (isNaN(fin.getTime())) {
                errores.push(`Fila ${index + 1}: hora_fin no es un ISO-8601 válido.`);
            }

            if (!isNaN(ini.getTime()) && !isNaN(fin.getTime()) && ini >= fin) {
                errores.push(`Fila ${index + 1}: la hora de inicio debe ser anterior a la de fin.`);
            }
        }
    });

    // Comprobación de solapamientos por día
    const horariosPorDia = {};
    horarios.forEach(h => {
        if (!horariosPorDia[h.dia]) horariosPorDia[h.dia] = [];
        horariosPorDia[h.dia].push({
            ini: new Date(h.hora_ini),
            fin: new Date(h.hora_fin)
        });
    });

    const getMinutes = (isoString) => {
        const d = new Date(isoString);
        return d.getUTCHours() * 60 + d.getUTCMinutes();
    };

    Object.entries(horariosPorDia).forEach(([dia, franjas]) => {
        // Ordenar por hora_ini en minutos
        franjas.sort((a, b) => getMinutes(a.ini) - getMinutes(b.ini));

        for (let i = 1; i < franjas.length; i++) {
            const anterior = franjas[i - 1];
            const actual = franjas[i];
            if (getMinutes(actual.ini) < getMinutes(anterior.fin)) {
                errores.push(`Día ${dia}: la franja ${i + 1} se solapa con la franja anterior.`);
            }
        }
    });


    return errores;
};

const profesorTutoriaService = {

    definirHorario: async (idProfesor, horarios) => {
        try {
            if (!idProfesor) {
                return { success: false, message: "Falta el ID del profesor.", data: [] };
            }

            if (!horarios || !Array.isArray(horarios) || horarios.length === 0) {
                return { success: false, message: "No se ha proporcionado un horario válido.", data: [] };
            }

            // Validar horarios
            const errores = validarHorarios(horarios);
            if (errores.length > 0) {
                return { success: false, message: "Errores de validación.", data: errores };
            }

            // Borrar los horarios anteriores del profesor
            await prisma.horario_tutoria.deleteMany({
                where: { id_profesor: idProfesor }
            });

            // Insertar los nuevos horarios
            const nuevosHorarios = await prisma.horario_tutoria.createMany({
                data: horarios.map(h => ({
                    dia: h.dia,
                    hora_ini: h.hora_ini,
                    hora_fin: h.hora_fin,
                    id_profesor: idProfesor
                }))
            });

            return { success: true, message: "Horario de tutorías definido correctamente.", data: { insertados: nuevosHorarios.count } };

        } catch (error) {
            console.error("Error en horarioTutoriaService.definirHorario:", error);
            return { success: false, message: "Error interno al definir el horario de tutorías.", data: [] };
        }
    },

    obtenerHorario: async (idProfesor) => {
        try {
            const horario = await prisma.horario_tutoria.findMany({
                where: { id_profesor: idProfesor },
                orderBy: [{ dia: 'asc' }, { hora_ini: 'asc' }]
            });

            if (horario.length === 0) {
                return { success: true, message: "El profesor no tiene horario de tutorías definido.", data: [] };
            }

            return {
                success: true,
                message: "Horario obtenido correctamente.",
                data: horario
            };

        } catch (error) {
            console.error("Error en horarioTutoriaService.obtenerHorario:", error);
            return {
                success: false, message: "Error interno al obtener el horario de tutorías.", data: []
            };
        }
    },

    // Aceptar tutoría
    aceptarTutoria: async (id_profesor, id_tutoria) => {
        try {
            const tutoria = await prisma.tutorias.findUnique({ where: { id: id_tutoria } });

            if (!tutoria) {
                return { success: false, message: "La tutoría no existe.", data: [] };
            }

            if (tutoria.id_profesor !== id_profesor) {
                return { success: false, message: "No puedes aceptar tutorías de otro profesor.", data: [] };
            }

            if (tutoria.aceptada === true) {
                return { success: false, message: "La tutoría ya ha sido aceptada.", data: [] };
            }

            const actualizada = await prisma.tutorias.update({
                where: { id: id_tutoria },
                data: { aceptada: true }
            });

            return { success: true, message: "Tutoría aceptada correctamente.", data: actualizada };

        } catch (error) {
            console.error("Error en aceptarTutoria:", error);
            return { success: false, message: "Error interno al aceptar tutoría.", data: [] };
        }
    },

    // Rechazar tutoría
    rechazarTutoria: async (id_profesor, id_tutoria) => {
        try {
            const tutoria = await prisma.tutorias.findUnique({ where: { id: id_tutoria } });

            if (!tutoria) {
                return { success: false, message: "La tutoría no existe.", data: [] };
            }

            if (tutoria.id_profesor !== id_profesor) {
                return { success: false, message: "No puedes rechazar tutorías de otro profesor.", data: [] };
            }

            // Borrar la tutoría de la base de datos
            await prisma.tutorias.delete({ where: { id: id_tutoria } });

            return { success: true, message: "Tutoría rechazada y eliminada correctamente.", data: [] };

        } catch (error) {
            console.error("Error en rechazarTutoria:", error);
            return { success: false, message: "Error interno al rechazar tutoría.", data: [] };
        }
    },

    listarTutorias: async (id_profesor, aceptada) => {
        try {
            const tutorias = await prisma.tutorias.findMany({
                where: { id_profesor: id_profesor, aceptada: aceptada },
                orderBy: [
                    { fecha: 'asc' },
                    { hora_ini: 'asc' }
                ],
                include: {
                    alumnos: {
                        select: {
                            id: true,
                            alumno: true, 
                            correo: true
                        }
                    }
                }
            });

            return { success: true, message: "Tutorías obtenidas correctamente.", data: tutorias };
        } catch (error) {
            console.error("Error en listarTutorias:", error);
            return { success: false, message: "Error interno al listar tutorías.", data: [] };
        }
    }
};

module.exports = profesorTutoriaService;
