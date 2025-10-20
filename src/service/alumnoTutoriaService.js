const prisma = require('../prismaClient.js');
const { DIAS_SEMANA } = require('../config/config.js');

// ===================== Funciones auxiliares =====================

// Validar campos obligatorios y formatos ISO
function validarCampos({ id_alumno, id_profesor, motivo, fecha, hora_ini, hora_fin }) {
    if (!id_alumno || !id_profesor || !motivo || !fecha || !hora_ini || !hora_fin) {
        return { success: false, message: "Faltan datos obligatorios.", data: [] };
    }

    const fechaObj = new Date(fecha);
    const horaIniObj = new Date(hora_ini);
    const horaFinObj = new Date(hora_fin);

    if (isNaN(fechaObj.getTime()) || isNaN(horaIniObj.getTime()) || isNaN(horaFinObj.getTime())) {
        return { success: false, message: "Formato de fecha u hora inválido.", data: [] };
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaObj < hoy) {
        return { success: false, message: "No se puede solicitar una tutoría en una fecha pasada.", data: [] };
    }
    if (horaIniObj >= horaFinObj) {
        return { success: false, message: "La hora de inicio debe ser anterior a la de fin.", data: [] };
    }

    return { success: true, data: { fechaObj, horaIniObj, horaFinObj } };
}

// Obtener día de la semana en formato 1=lunes ... 5=viernes
function getDiaSemana(fechaObj) {
    const diaJS = fechaObj.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
    return diaJS === 0 ? 7 : diaJS;   // domingo → 7, lunes=1 ... viernes=5
}

// Comprobar si la franja solicitada está dentro de algún horario del profesor
function franjaDentroHorario(horaIniObj, horaFinObj, horariosProfesor) {
    const getMinutes = (date) => date.getUTCHours() * 60 + date.getUTCMinutes();

    return horariosProfesor.some(h => {
        const hIni = new Date(`1970-01-01T${h.hora_ini.toISOString().substr(11, 8)}Z`);
        const hFin = new Date(`1970-01-01T${h.hora_fin.toISOString().substr(11, 8)}Z`);
        return getMinutes(horaIniObj) >= getMinutes(hIni) &&
            getMinutes(horaFinObj) <= getMinutes(hFin);
    });
}

// Comprobar solapamiento con tutorías existentes
async function haySolapamiento(id_profesor, fechaObj, horaIniObj, horaFinObj) {
    const tutoriasExistentes = await prisma.tutorias.findMany({
        where: { id_profesor, fecha: fechaObj , aceptada:true}
    });

    const getMinutes = (date) => date.getUTCHours() * 60 + date.getUTCMinutes();

    return tutoriasExistentes.some(t => {
        const tIni = new Date(t.hora_ini);
        const tFin = new Date(t.hora_fin);
        return getMinutes(horaIniObj) < getMinutes(tFin) &&
            getMinutes(horaFinObj) > getMinutes(tIni);
    });
}

// ===================== Service principal =====================
const alumnoTutoriaService = {

    solicitarTutoria: async ({ id_alumno, id_profesor, motivo, fecha, hora_ini, hora_fin }) => {
        try {
            // 1️⃣ Validar campos obligatorios y formatos
            const validacion = validarCampos({ id_alumno, id_profesor, motivo, fecha, hora_ini, hora_fin });
            if (!validacion.success) return validacion;

            const { fechaObj, horaIniObj, horaFinObj } = validacion.data;

            // 2️⃣ Validar día permitido (lunes a viernes)
            const diaSemana = getDiaSemana(fechaObj);
            if (!DIAS_SEMANA.includes(diaSemana)) {
                return { success: false, message: "Solo se pueden solicitar tutorías de lunes a viernes.", data: [] };
            }

            // 3️⃣ Obtener horarios del profesor para el día
            const horariosProfesor = await prisma.horario_tutoria.findMany({
                where: { id_profesor, dia: diaSemana }
            });

            if (!horariosProfesor || horariosProfesor.length === 0) {
                return { success: false, message: "El profesor no tiene horario disponible ese día.", data: [] };
            }

            // 4️⃣ Comprobar que la franja solicitada esté dentro del horario del profesor
            if (!franjaDentroHorario(horaIniObj, horaFinObj, horariosProfesor)) {
                return { success: false, message: "La franja solicitada no está dentro del horario del profesor.", data: [] };
            }

            // 5️⃣ Comprobar solapamiento con otras tutorías del profesor en la misma fecha
            if (await haySolapamiento(id_profesor, fechaObj, horaIniObj, horaFinObj)) {
                return { success: false, message: "Ya existe otra tutoría en esa franja horaria.", data: [] };
            }

            // 6️⃣ Insertar la solicitud en la BDD con aceptada = false (pendiente)
            const nuevaTutoria = await prisma.tutorias.create({
                data: {
                    motivo,
                    fecha: fechaObj,
                    hora_ini: horaIniObj,
                    hora_fin: horaFinObj,
                    id_profesor,
                    id_alumno,
                    aceptada: false
                }
            });

            return { success: true, message: "Solicitud enviada correctamente.", data: nuevaTutoria };

        } catch (error) {
            console.error("Error en alumnoTutoriaService.solicitarTutoria:", error);
            return { success: false, message: "Error interno al solicitar tutoría.", data: [] };
        }
    },

    listarTutorias: async (id_alumno) => {
        try {
            const hoy = new Date();
            hoy.setHours(0,0,0,0); // solo fecha, ignorando hora

            const tutorias = await prisma.tutorias.findMany({
                where: {
                    id_alumno,
                    fecha: { gte: hoy },  // solo tutorías de hoy en adelante (gte=mayor igual que)
                },
                orderBy: [
                    { fecha: 'asc' },
                    { hora_ini: 'asc' }
                ],
                include: {
                    profesores: {
                        select: {
                            id: true,
                            nombre: true, // nombre del profesor
                            correo: true
                        }
                    }
                }
            });

            return { success: true, message: "Tutorías obtenidas correctamente.", data: tutorias };

        } catch (error) {
            console.error("Error en alumnoTutoriaService.listarTutorias:", error);
            return { success: false, message: "Error al obtener tutorías.", data: [] };
        }
    }


};

module.exports = alumnoTutoriaService;
