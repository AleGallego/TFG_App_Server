const express = require('express');
const alumnoTutoriaRoute = express.Router();
const alumnoTutoriaService = require('../service/alumnoTutoriaService');

alumnoTutoriaRoute.post('/solicitar', async (req, res) => {
    try {
        const { id_profesor, motivo, fecha, hora_ini, hora_fin } = req.body;
        const id_alumno = req.user.id;
        console.log(fecha, hora_ini, hora_fin)
        const result = await alumnoTutoriaService.solicitarTutoria({
            id_alumno,
            id_profesor,
            motivo,
            fecha,
            hora_ini,
            hora_fin
        });

        return result.success ? res.status(200).json(result) : res.status(400).json(result);
    } catch (error) {
        console.error("Error en route /solicitar:", error);
        return res.status(500).json({ success: false, message: "Error interno del servidor", data: [] });
    }
})

// GET /alumno/tutorias → lista las tutorías futuras y pendientes del alumno
alumnoTutoriaRoute.get('/tutorias', async (req, res) => {
    try {
        const id_alumno = req.user.id;

        const result = await alumnoTutoriaService.listarTutorias(id_alumno);

        return result.success
            ? res.status(200).json(result)
            : res.status(400).json(result);

    } catch (error) {
        console.error("Error en alumnoTutoriaRoute.get('/tutorias'):", error);
        return res.status(500).json({ success: false, message: "Error interno al obtener tutorías.", data: [] });
    }
})

// GET /alumno/profesores → lista los profesores de las asignaturas del alumno
alumnoTutoriaRoute.get('/profesores', async (req, res) => {
    try {
        const id_alumno = req.user.id;

        const result = await alumnoTutoriaService.listarProfesoresPorAsignatura(id_alumno);

        return result.success
            ? res.status(200).json(result)
            : res.status(400).json(result);

    } catch (error) {
        console.error("Error en alumnoTutoriaRoute.get('/profesores'):", error);
        return res.status(500).json({ success: false, message: "Error interno al obtener profesores.", data: [] });
    }
})

// GET /alumno/tutorias/horario/:id_profesor → obtiene el horario de un profesor concreto
alumnoTutoriaRoute.get('/tutorias/horario/:id_profesor', async (req, res) => {
    try {
        const id_profesor = parseInt(req.params.id_profesor);
        if(!id_profesor)
             return res.status(400).json({success: false, message: "No se ha seleccionado profesor.",data: [] });
        const result = await alumnoTutoriaService.obtenerHorarioProfesor(id_profesor);

        return result.success
            ? res.status(200).json(result)
            : res.status(400).json(result);

    } catch (error) {
        console.error("Error en alumnoTutoriaRoute.get('/tutorias/horario/:id_profesor'):", error);
        return res.status(500).json({success: false, message: "Error interno al obtener el horario del profesor.",data: [] });
    }
});






module.exports = alumnoTutoriaRoute;
