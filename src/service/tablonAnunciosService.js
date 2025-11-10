const prisma = require('../prismaClient.js');

const tablonAnunciosService = {

    crearEntrada: async (titulo, contenido, id_asignatura, id_clase, id_profesor) => {
        try {
            // Comprobamos si la asignatura y la clase existen
            const asignatura = await prisma.asignaturas.findUnique({
                where: { id: id_asignatura },
            });
            const clase = await prisma.clases.findUnique({
                where: { id: id_clase },
            });

            if (!asignatura || !clase) {
                return { success: false, message: 'Asignatura o clase no válida', data: [] };
            }

            // Comprobamos que la clase pertenezca a la asignatura
            if (clase.id_asignatura !== id_asignatura) {
                return { success: false, message: 'La clase no pertenece a la asignatura seleccionada', data: [] };
            }


            // Crear la entrada en el tablón
            const nuevaEntrada = await prisma.tablon_anuncios.create({
                data: {
                    titulo,
                    contenido,
                    id_asignatura,
                    id_clase,
                    id_profesor,
                },
            });

            return {
                success: true,
                message: 'Publicación creada correctamente',
                data: nuevaEntrada,
            };
        } catch (err) {
            console.error('Error en tablonAnunciosService.crearEntrada:', err);
            return {
                success: false,
                message: 'No se pudo crear la publicación en el tablón',
            };
        }
    },

    obtenerEntradasAlumno: async (id_alumno, limit, offset) => {
        try {
            // primero ver las matriculas del alumno con su grupo
            const matriculas = await prisma.matricula.findMany({
                where: { id_alumno },
                include: {
                    grupo: { include: { grupo_clases: { include: { clases: true } } } }
                }
            });

            if (!matriculas.length) return [];

            // Obtener todos los IDs de clase
            const idClases = matriculas.flatMap(m =>
                m.grupo?.grupo_clases.map(gc => gc.id_clases) || []
            );

            if (!idClases.length) return [];

            // los anuncios de esas clases obtenidas
            const entradas = await prisma.tablon_anuncios.findMany({
                where: { id_clase: { in: idClases } },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
                include: {
                    asignaturas: true,
                    clases: true // <- incluye el nombre de la clase
                }
            });

            // Marcar todos como leídos
            await prisma.tablon_anuncios.updateMany({
                where: { id: { in: entradas.map(e => e.id) } },
                data: { leido: true }
            });

            // Formatear resultado para frontend
            return entradas.map(e => ({
                id: e.id,
                asignatura: e.asignaturas?.nombre || 'Asignatura desconocida',
                clase: e.clases?.nombre || 'Clase desconocida',
                titulo: e.titulo,
                contenido: e.contenido,
                leido:e.leido,
                createdAt: e.createdAt
            }));
        } catch (err) {
            console.error('Error en tablonAnunciosService.obtenerEntradasAlumno:', err);
            return [];
        }
    }


};

module.exports = tablonAnunciosService;
