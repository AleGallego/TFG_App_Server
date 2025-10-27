const prisma = require("../prismaClient.js");

const alumnoAsignaturasService = {

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
                            id:true,
                            nombre: true,
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
            const data = pruebas.map(p => ({
                id: p.id,
                nombre: p.nombre,
                peso:p.peso,
                fecha_entrega: p.fecha_entrega,
                nota_minima: p.nota_minima,
                nota_alumno: p.nota.length > 0 ? p.nota[0].nota : null
            }));

            return { success: true, message: "Pruebas obtenidas correctamente", data: data };

        } catch (error) {
            console.error("Error en getPruebasConNotas:", error);
            return { success: false, message: "Error al obtener las pruebas del alumno", data: [] };
        }
    }


}

module.exports = alumnoAsignaturasService