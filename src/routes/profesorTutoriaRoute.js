const express = require('express');
const profesorTutoriaRoute = express.Router();
const profesorTutoriaService = require('../service/profesorTutoriaService');


/*FORMATO: 
    {"horarios": [
        { "dia": 1, "hora_ini": "2025-10-20T09:00:00.000Z", "hora_fin": "2025-10-20T11:00:00.000Z" }
     ]
    }
    */
// POST → Definir/actualizar horario
profesorTutoriaRoute.post('/definir', async (req, res) => {
    try {
        const { horarios } = req.body
        const id_profesor = req.user.id
        const result = await profesorTutoriaService.definirHorario(id_profesor, horarios);
        return result.success ? res.status(200).json(result) : res.status(400).json(result);
    } catch (error) {
        console.error("Error en POST /definir:", error);
        return res.status(500).json({ success: false, message: "Error interno del servidor.", data: [] });
    }
});

// GET → Obtener horario de un profesor 
profesorTutoriaRoute.get('/miHorario', async (req, res) => {
    try {
        const id_profesor = req.user.id
        const result = await profesorTutoriaService.obtenerHorario(parseInt(id_profesor));

        return result.success ? res.status(200).json(result) : res.status(404).json(result);
    } catch (error) {
        console.error("Error en GET /:", error);
        return res.status(500).json({ success: false, message: "Error interno del servidor.", data: [] });
    }
});

// Aceptar tutoría
profesorTutoriaRoute.put('/aceptar', async (req, res) => {
    const { id_tutoria } = req.body;
    const id_profesor = req.user.id;

    try {
        const result = await profesorTutoriaService.aceptarTutoria(id_profesor, id_tutoria);
        return result.success ? res.status(200).json(result) : res.status(400).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error interno al aceptar tutoría.", data: [] });
    }
});

// Rechazar tutoría
profesorTutoriaRoute.delete('/rechazar', async (req, res) => {
    const { id_tutoria } = req.body;
    const id_profesor = req.user.id;

    try {
        const result = await profesorTutoriaService.rechazarTutoria(id_profesor, id_tutoria);
        return result.success ? res.status(200).json(result) : res.status(400).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error interno al rechazar tutoría.", data: [] });
    }
});

// Listar peticiones de tutorias o tutorias programadas
profesorTutoriaRoute.get('/tutorias/:aceptada', async (req, res) => {
    const id_profesor = req.user.id;
    let { aceptada } = req.params; // 'true' o 'false' desde la URL

    const map = { 'true': true, 'false': false };
    aceptada = map[aceptada];

    if (typeof aceptada !== 'boolean') {
        return res.status(400).json({ success: false, message: "Parámetro 'aceptada' inválido. Debe ser 'true' o 'false'.", data: [] });
    }

    try {
        const result = await profesorTutoriaService.listarTutorias(id_profesor, aceptada);
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error al obtener las tutorías.", data: [] });
    }
});




module.exports = profesorTutoriaRoute;