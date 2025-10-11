const express = require('express')
const TareasRoute = express.Router()
const tareasService = require('../service/pruebasService')


TareasRoute.post("/publicar", requireRole('profesor'),async function (req, res) {
    try {
        const { nombre, nota_minima, peso, fecha_entrega, id_clase } = req.body
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
        const nuevaTarea = await tareasService.nuevaPrueba(nombre, nota_minima, peso, fecha_entrega, id_clase);

        return res.status(201).json({ success: true, message: "Tarea publicada correctamente.", data: nuevaTarea });
    } catch (error) {
        console.error("Error al publicar tarea:", error);
        return res.status(500).json({
            success: false,
            error: "Error interno del servidor al publicar la tarea.",
            data: []
        });
    }

})

TareasRoute.put("/modificar/:id", requireRole('profesor'),async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, nota_minima, peso, fecha_entrega } = req.body;

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

        const tareaActualizada = await tareasService.modificarPrueba(parseInt(id), nombre, nota_minima, peso, fecha_entrega);

        return res.status(200).json({ success: true, message: "Tarea modificada correctamente.", data: tareaActualizada });

    } catch (error) {
        console.error("Error al modificar tarea:", error);
        return res.status(500).json({ success: false, message: error.message || "Error interno del servidor al modificar la tarea.", data: [] });
    }
});

TareasRoute.get('/', requireRole('profesor'),async function (req, res) {
    try {
        const { id } = req.user;
        const tareas = await tareasService.obtenerTareasProfesor(id);
        if (!tareas || tareas.length === 0) {
            return res.status(200).json({ success: true, message: 'El profesor no tiene tareas publicadas', data: [] });
        }

        return res.status(200).json({ success: true, message: 'Tareas obtenidas correctamente', data: tareas });

    } catch (error) {
        console.error('Error al obtener las tareas del profesor:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor', data: [] });
    }
});

module.exports = TareasRoute