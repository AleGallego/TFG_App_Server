const prisma = require('../prismaClient.js');
const { HORAS_MARGEN_REVISION } = require('../config/config.js');

const alumnoRevisionService = {

    // Función principal
    unirseRevision: async (id_revision, id_alumno) => {
        try {
            // 1. Comprobar que la revisión existe
            const revision = await prisma.revision.findUnique({
                where: { id: id_revision },
                include: {
                    horario_revision: true,
                    revision_alumno: true
                }
            });

            if (!revision) {
                return { success: false, message: "La revisión no existe.", data: [] };
            }

            // 2. Comprobar que el alumno ha realizado la prueba asociada
            const haRealizadoPrueba = await prisma.nota.findUnique({
                where: {
                    id_alumno_id_prueba: {
                        id_alumno,
                        id_prueba: revision.id_prueba
                    }
                }
            });

            if (!haRealizadoPrueba) {
                return { success: false, message: "No puedes inscribirte porque no has realizado la prueba correspondiente.", data: [] };
            }

            // 3. Comprobar que no esté ya inscrito
            const yaInscrito = await prisma.revision_alumno.findUnique({
                where: { id_revision_id_alumno: { id_revision, id_alumno } },
            });

            if (yaInscrito) {
                return { success: false, message: "Ya estás inscrito en esta revisión.", data: [] };
            }

            // 4. Obtener franjas futuras con margen
            const franjasFuturas = obtenerFranjasFuturas(revision, HORAS_MARGEN_REVISION);

            if (franjasFuturas.length === 0) {
                return { success: false, message: "Ya no puedes inscribirte, las franjas restantes están a menos de una hora de comenzar.", data: [] };
            }

            // 5. Buscar el primer slot disponible
            const { horaAsignadaIni, horaAsignadaFin } = buscarPrimerSlotDisponible(franjasFuturas, revision, revision.duracion);

            if (!horaAsignadaIni) {
                return { success: false, message: "No hay huecos disponibles en las franjas horarias futuras.", data: [] };
            }

            // 6. Registrar la inscripción
            const nuevaRevisionAlumno = await prisma.revision_alumno.create({
                data: {
                    id_revision,
                    id_alumno,
                    hora_ini: horaAsignadaIni,
                    hora_fin: horaAsignadaFin
                }
            });

            return { success: true, message: "Inscripción realizada correctamente.", data: nuevaRevisionAlumno };

        } catch (error) {
            console.error("Error al unirse a la revisión:", error);
            return { success: false, message: "Error interno del servidor.", data: [] };
        }
    }
};

// ---------------------------
// FUNCIONES AUXILIARES
// ---------------------------

// Paso 4: Obtener franjas futuras considerando margen
function obtenerFranjasFuturas(revision, margenMinutos) {
    const ahora = new Date();
    const ahoraMasMargen = new Date(ahora.getTime() + margenMinutos * 60000);

    return revision.horario_revision
        .map(f => {
            const diaStr = f.dia.toISOString().split('T')[0]; // YYYY-MM-DD
            const fechaInicio = new Date(`${diaStr}T${f.hora_ini.toISOString().substr(11, 8)}Z`);
            const fechaFin = new Date(`${diaStr}T${f.hora_fin.toISOString().substr(11, 8)}Z`);
            return { ...f, fechaInicio, fechaFin };
        })
        .filter(f => f.fechaInicio > ahoraMasMargen)
        .sort((a, b) => a.fechaInicio - b.fechaInicio);
}

// Paso 5: Buscar primer slot disponible en las franjas
function buscarPrimerSlotDisponible(franjasFuturas, revision, duracion) {
    let horaAsignadaIni = null;
    let horaAsignadaFin = null;

    for (const franja of franjasFuturas) {
        const duracionFranjaMin = (franja.fechaFin - franja.fechaInicio) / 60000;
        const maxSlots = Math.floor(duracionFranjaMin / duracion);

        const alumnosEnFranja = revision.revision_alumno.map(a => {
            const diaStr = franja.dia.toISOString().split('T')[0];
            const horaIniReal = new Date(`${diaStr}T${a.hora_ini.toISOString().substr(11, 8)}Z`);
            const horaFinReal = new Date(`${diaStr}T${a.hora_fin.toISOString().substr(11, 8)}Z`);
            return { ...a, hora_ini_real: horaIniReal, hora_fin_real: horaFinReal };
        }).filter(a =>
            a.hora_ini_real >= franja.fechaInicio && a.hora_fin_real <= franja.fechaFin
        );

        if (alumnosEnFranja.length < maxSlots) {
            horaAsignadaIni = new Date(franja.fechaInicio.getTime() + alumnosEnFranja.length * duracion * 60000);
            horaAsignadaFin = new Date(horaAsignadaIni.getTime() + duracion * 60000);
            break;
        }
    }

    return { horaAsignadaIni, horaAsignadaFin };
}

module.exports = alumnoRevisionService;
