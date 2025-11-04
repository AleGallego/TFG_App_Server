const prisma = require("../prismaClient.js");
const { TIPOS_CLASE } = require("../config/config.js");

const alumnoAsignaturasService = {

    getMyClasesAsignaturas: async (myId) => {
        const asignaturas = await prisma.$queryRaw`
  select c.tipo,a.id as asignatura_id,a.nombre as asignatura,al.id,c.id as id_clase,c.nombre,m.nota_actual,a.curso,
  CONCAT(p.nombre, ' ', p.apellidos) AS nombre_profesor from alumnos al
join matricula m on al.id=m.id_alumno
join asignaturas a on m.id_asignatura=a.id
join grupo g on m.id_grupo=g.id
join grupo_clases gc on g.id=gc.id_grupo
join clases c on gc.id_clases = c.id
join profesores p on p.id = c.id_profesor
where al.id=${myId} AND c.id_asignatura = m.id_asignatura
  ORDER BY a.id, c.id;
`;

        if (asignaturas.length === 0) {
            return {
                success: false,
                message: "No se encontraron asignaturas para este alumno.",
                data: [],
            };
        }
        else {
            const asignaturasOrdenadas = Object.values(
                asignaturas.reduce((acc, row) => {
                    if (!acc[row.id]) {
                        acc[row.id] = {
                            id: row.asignatura_id,
                            nombre: row.asignatura,
                            curso: row.curso,
                            nota_actual: row.nota_actual,
                            clases: [],
                        };
                    }
                    acc[row.id].clases.push({
                        id: row.id_clase,
                        tipo: row.tipo,
                        nombre: row.nombre,
                        profesor: row.nombre_profesor
                    });
                    return acc;
                }, {})
            );
            return {
                success: true,
                message: "Asignaturas obtenidas correctamente.",
                data: asignaturasOrdenadas,
            };
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
                return { success: false, message: "No hay pruebas publicadas para esta asignatura", data: [] };
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