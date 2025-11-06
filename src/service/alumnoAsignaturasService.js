const prisma = require("../prismaClient.js");
const { TIPOS_CLASE } = require("../config/config.js");

const alumnoAsignaturasService = {

    getMyClasesAsignaturas: async (myId) => {
        try {
            const matriculas = await prisma.matricula.findMany({
                where: { id_alumno: myId },
                select: {
                    nota_actual: true,
                    asignaturas: {
                        select: {
                            id: true,
                            nombre: true,
                            curso: true,
                        }
                    },
                    grupo: {
                        select: {
                            grupo_clases: {
                                select: {
                                    clases: {
                                        select: {
                                            id: true,
                                            tipo: true,
                                            nombre: true,
                                            id_asignatura: true,
                                            profesores: {
                                                select: {
                                                    id: true,
                                                    nombre: true,
                                                    apellidos: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!matriculas || matriculas.length === 0) {
                return {
                    success: false,
                    message: "No se encontraron asignaturas para este alumno.",
                    data: [],
                };
            }

            // Formatear los datos como querías (asignatura → clases → profesor)
            const asignaturasOrdenadas = matriculas.map((mat) => {
                const clasesFiltradas = mat.grupo.grupo_clases
                    .map(gc => gc.clases)
                    // Solo clases que pertenecen a la asignatura actual
                    .filter(c => c.id_asignatura === mat.asignaturas.id)
                    .map(c => ({
                        id: c.id,
                        tipo: c.tipo,
                        nombre: c.nombre,
                        profesor: c.profesores
                            ? `${c.profesores.nombre} ${c.profesores.apellidos}`
                            : "Sin profesor asignado"
                    }));

                return {
                    id: mat.asignaturas.id,
                    nombre: mat.asignaturas.nombre,
                    curso: mat.asignaturas.curso,
                    nota_actual: mat.nota_actual,
                    clases: clasesFiltradas
                };
            })


            return { success: true,message: "Asignaturas obtenidas correctamente.",data: asignaturasOrdenadas,  };

        } catch (error) {
            console.error("Error en getMyClasesAsignaturas:", error);
            return {success: false,message: "Error interno al obtener las asignaturas del alumno.",data: [] };
        }
    },

    getMyAsignaturas: async (myId) => {
        const asignaturas = await prisma.asignaturas.findMany({
            where: {
                matricula: {
                    some: { id_alumno: myId },
                },
            },
            select: {
                id: true,
                nombre: true,
                curso: true,
                matricula: {
                    where: { id_alumno: myId }, // 🔹 solo la matrícula de este alumno
                    select: {
                        nota_actual: true,
                    },
                },
            },
        });

        if (asignaturas.length === 0) {
            return {
                success: false,
                message: "No se encontraron asignaturas para este alumno.",
                data: [],
            };
        }
        else {
            return {
                success: true,
                message: "Asignaturas obtenidas correctamente.",
                data: asignaturas,
            };
        }
    },
    // obtener todas las pruebas con nota de una asignatura concreta
    getPruebasConNotas: async (id_alumno, id_asignatura) => {
        try {
            // Comprobamos primero si el alumno pertenece a esa asignatura
            const pertenece = await prisma.asignaturas.findFirst({
                where: {
                    id: id_asignatura,
                    matricula: {
                        some: { id_alumno: id_alumno }
                    }
                },
                select: { id: true }
            });

            if (!pertenece) {
                return { success: false, message: "No estás matriculado en esta asignatura", data: [] };
            }
            // Obtenemos las pruebas de todas las clases de la asignatura con la nota del alumno
            const pruebas = await prisma.pruebas.findMany({
                where: {
                    clases: {
                        id_asignatura: id_asignatura,
                        grupo_clases: {
                            some: {
                                grupo: {
                                    matricula: {
                                        some: { id_alumno }
                                    }
                                }
                            }
                        }
                    }
                },
                include: {
                    clases: {
                        select: {
                            id: true,
                            nombre: true,
                            tipo: true,
                            asignaturas: { select: { nombre: true } }
                        }
                    },
                    nota: {
                        where: { id_alumno },
                        select: { nota: true }
                    }
                },
                orderBy: { fecha_entrega: 'asc' }
            });

            if (pruebas.length === 0) {
                return { success: true, message: "No hay pruebas publicadas para esta asignatura", data: [] };
            }

            // Formateamos la salida para mayor claridad
            return formatoDatosNotas(pruebas)

        } catch (error) {
            console.error("Error en getPruebasConNotas:", error);
            return { success: false, message: "Error al obtener las pruebas del alumno", data: [] };
        }
    }
}
// Funcion auxiliar
function formatoDatosNotas(pruebas) {
    const pruebasFormateadas = pruebas.map(p => ({
        id: p.id,
        nombre: p.nombre,
        clase: p.clases.nombre,
        tipo_clase: p.clases.tipo,
        peso: p.peso,
        fecha_entrega: p.fecha_entrega,
        nota_minima: p.nota_minima,
        nota_alumno: p.nota.length > 0 ? p.nota[0].nota : null
    }));

    // Clasificamos las pruebas por tipo
    const data = {
        aula: pruebasFormateadas.filter(p => TIPOS_CLASE.AULA.includes(p.tipo_clase)),
        laboratorio: pruebasFormateadas.filter(p => TIPOS_CLASE.LABORATORIO.includes(p.tipo_clase))
    };
    return { success: true, message: "Pruebas obtenidas correctamente", data: data };
}

module.exports = alumnoAsignaturasService