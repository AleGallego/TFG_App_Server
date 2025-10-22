const express = require('express')
const profesorRevisionRoute = express.Router()
const profesorRevisionService = require('../service/profesorRevisonService')

// Formato horas: 2025-10-20T09:00:00.000Z
profesorRevisionRoute.post("/crear", async (req, res) => {
    const id_profesor = req.user.id;
    const { motivo, duracion, id_prueba, horario } = req.body || {};

    try {
        const result = await profesorRevisionService.crearRevisionConHorarios(
            id_profesor,
            motivo,
            duracion,
            id_prueba,
            horario
        );

        return result.success ? res.status(201).json(result) : res.status(400).json(result);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error interno al crear la revisión." });
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

profesorRevisionRoute.delete('/borrar/revision', async (req, res) => {
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

profesorRevisionRoute.put("/modificar", async (req, res) => {
    try {
        const id_profesor = req.user.id
        const { id_revision,duracion, horario } = req.body || {};

        if (!id_revision) {
            return res.status(400).json({ success: false, message: "Debe especificarse el id de la revisión." });
        }

        const resultado = await profesorRevisionService.actualizarRevision(id_revision,duracion, horario,id_profesor );
        res.status(resultado.success ? 200 : 400).json(resultado);

    } catch (error) {
        console.error("Error en PUT /profesor/revision/:id_revision:", error);
        res.status(500).json({ success: false, message: "Error interno al actualizar la revisión.", data: [], });
    }
});

// Borrar una franja horaria concreta de una revisión
profesorRevisionRoute.delete("/borrar/horario", async (req, res) => {
    try {
        const {id_horario} = req.body || {}
        const id_profesor = req.user.id;
       if (!id_horario) {
            return res.status(400).json({ success: false, message: "Error, no se ha obtenido el id del horario.",data: [] });
        }
        const resultado = await profesorRevisionService.eliminarFranjaHorario(id_horario, id_profesor);

        res.status(resultado.success ? 200 : 400).json(resultado);
    } catch (error) {
        console.error("Error al eliminar la franja de horario:", error);
        res.status(500).json({ success: false, message: "Error interno al eliminar la franja de horario.", data: [] });
    }
});

module.exports = profesorRevisionRoute