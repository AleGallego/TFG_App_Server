const express = require('express')
const profesorRevisionRoute = express.Router()
const profesorRevisionService = require('../service/profesorRevisonService')


profesorRevisionRoute.post("/crear", async (req, res) => {
    const id_profesor = req.user.id; // el id del profesor autenticado
    const { motivo, fecha, duracion, id_prueba } = req.body || {}

    try {
        const result = await profesorRevisionService.crearRevision(id_profesor, motivo, fecha, duracion, id_prueba);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(201).json(result);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error interno al crear la revisión.", });
    }
});

// Obtener todas las revisiones venideras
profesorRevisionRoute.get("/pendientes", async (req, res) => {
    try {
        id_profesor = req.user.id
        const resultado = await profesorRevisionService.obtenerRevisionesPendientes(id_profesor);
        res.status(resultado.success ? 200 : 400).json(resultado);
    } catch (error) {
        console.error("Error al obtener revisiones pendientes:", error);
        res.status(500).json({ success: false, message: "Error interno al obtener las revisiones pendientes.", data: [], });
    }
});

profesorRevisionRoute.delete('/borrar', async (req, res) => {
    const id_profesor = req.user.id;
    const { id_revision } = req.body || {}
    if (!id_revision)
        return res.status(400).json({ success: false, message: "No se ha pasado la revisión correctamente", data: [], });

    try {
        const result = await profesorRevisionService.borrarRevision(id_profesor, id_revision);
        return result.success ? res.status(200).json(result) : res.status(400).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error interno al borrar la revisión.", data: [], });
    }
});

module.exports = profesorRevisionRoute