const express = require('express')
const TareasRoute = express.Router()
const tareasService = require('../service/pruebasService')
const requireRole = require('../middlewares/rolesMiddleware');


TareasRoute.post("/publicar", requireRole('profesor'), async function (req, res) {
    try {
        const { nombre, nota_minima, peso, fecha_entrega, id_clase } = req.body
        const myId = req.user.id
        // --- Validaciones básicas ---
        if (!nombre || !id_clase) {
            return res.status(422).json({ success: false, message: "Se deben proporcionar el nombre y la clase para publicar la tarea.", data: [] });
        }
        // Validar peso y nota mínima si se envían
        if (peso !== undefined && (isNaN(peso) || peso < 0)) {
            return res.status(400).json({ success: false, message: "El campo 'peso' debe ser un número positivo.", data: [] });
        }

        if (nota_minima !== undefined && (isNaN(nota_minima) || nota_minima < 0)) {
            return res.status(400).json({ success: false, message: "El campo 'nota_minima' debe ser un número positivo.", data: [] });
        }

        // Llamada al servicio
        const result = await tareasService.nuevaPrueba(myId, nombre, nota_minima, peso, fecha_entrega, id_clase);
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);


    } catch (error) {
        console.error("Error al publicar tarea:", error);
        return res.status(500).json({
            success: false,
            error: "Error interno del servidor al publicar la tarea.",
            data: []
        });
    }

})

TareasRoute.put("/modificar/:id", requireRole('profesor'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, nota_minima, peso, fecha_entrega } = req.body;
        const myId = req.user.id

        if (!id) {
            return res.status(400).json({ success: false, message: "Se debe especificar el ID de la tarea a modificar.", data: [] });
        }

        // Validaciones opcionales
        if (peso !== undefined && (isNaN(peso) || peso < 0)) {
            return res.status(400).json({ success: false, message: "El campo 'peso' debe ser un número positivo.", data: [] });
        }

        if (nota_minima !== undefined && (isNaN(nota_minima) || nota_minima < 0)) {
            return res.status(400).json({ success: false, message: "El campo 'nota_minima' debe ser un número positivo.", data: [] });
        }

        const tareaActualizada = await tareasService.modificarPrueba(myId, parseInt(id), nombre, nota_minima, peso, fecha_entrega);

        return res.status(200).json({ success: true, message: "Tarea modificada correctamente.", data: tareaActualizada });

    } catch (error) {
        console.error("Error al modificar tarea:", error);
        return res.status(500).json({ success: false, message: error.message || "Error interno del servidor al modificar la tarea.", data: [] });
    }
});

// Obtener todas las pruebas de una asignatura o de una clase en concreto
TareasRoute.get('/profesor/:id_asignatura', requireRole('profesor'), async function (req, res) {
    try {
        const { id } = req.user;
        const { id_asignatura } = req.params;
        const { id_clase } = req.query;

        if (!id_asignatura) {
            return res.status(422).json({ success: false, message: "Debe especificarse una asignatura", data: [] });
        }
        const tareas = await tareasService.obtenerPruebasProfesor(id, parseInt(id_asignatura), id_clase ? parseInt(id_clase) : null);
        if (!tareas || tareas.length === 0) {
            return res.status(200).json({ success: true, message: 'El profesor no tiene tareas publicadas', data: [] });
        }

        return res.status(200).json({ success: true, message: 'Tareas obtenidas correctamente', data: tareas });

    } catch (error) {
        console.error('Error al obtener las tareas del profesor:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor', data: [] });
    }
});

TareasRoute.get('/alumno/:id_asignatura', requireRole('alumno'), async function (req, res) {
    try {
        const { id } = req.user; // ID del alumno autenticado
        const { id_asignatura } = req.params;

        if (!id_asignatura) {
            return res.status(422).json({ success: false, message: 'Debe especificarse una asignatura', data: [] });
        }

        const pruebas = await tareasService.obtenerPruebasAlumno(id, parseInt(id_asignatura));

        if (!pruebas || pruebas.length === 0) {
            return res.status(200).json({ success: true, message: 'No hay tareas disponibles para esta asignatura', data: [] });
        }

        return res.status(200).json({ success: true, message: 'Tareas obtenidas correctamente', data: pruebas });

    } catch (error) {
        console.error('Error al obtener tareas del alumno:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            data: []
        });
    }
});

module.exports = TareasRoute