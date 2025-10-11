const prisma = require("../prismaClient.js");

const profesorTareasService = {
    nuevaPrueba: async (nombre, nota_minima, peso, fecha_entrega, id_clase) => {
        try {
            // Se comprueba si la clase existe
            const clase = await prisma.clases.findUnique({
                where: { id: id_clase },
            });

            if (!clase) {
                throw new Error("La clase especificada no existe.");
            }
            const nuevaTarea = await prisma.pruebas.create({
                data: {
                    nombre,
                    nota_minima,
                    peso,
                    fecha_entrega: fecha_entrega ? new Date(fecha_entrega) : null,
                    id_clase
                },
            });

            return nuevaTarea;
        } catch (error) {
            console.error("Error en nuevaPrueba:", error);
            throw error;
        }
    },

    modificarPrueba: async (id, nombre, nota_minima, peso, fecha_entrega) => {
        const tarea = await prisma.pruebas.findUnique({ where: { id } });
        if (!tarea) throw new Error("La tarea especificada no existe.");

        const tareaActualizada = await prisma.pruebas.update({
            where: { id },
            data: {
                nombre: nombre ?? tarea.nombre,
                nota_minima: nota_minima ?? tarea.nota_minima,
                peso: peso ?? tarea.peso,
                fecha_entrega: fecha_entrega ? new Date(fecha_entrega) : tarea.fecha_entrega,
                fecha_modificacion: new Date(),
            },
        });

        return tareaActualizada;
    },
};

module.exports = profesorTareasService;
