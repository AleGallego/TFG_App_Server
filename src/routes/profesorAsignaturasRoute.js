const express = require('express')
const profesorAsignaturasRoute = express.Router()
const profesorAsignaturasService = require('../service/profesorAsignaturasService')

profesorAsignaturasRoute.get('/asignaturas', async function (req, res) {
    try {
        const result = await profesorAsignaturasService.getAllAsignaturas();

        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);

    } catch (err) {
        console.error('Error en route GET /profesor/asignaturas:', err);
        return res.status(500).json({ success: false, message: 'Error interno del servidor al obtener asignaturas', data: [] });
    }
})

profesorAsignaturasRoute.get('/asignaturas/:id/clases', async function (req, res) {

    try {
        const id_asignatura = parseInt(req.params.id);

        if (!id_asignatura || isNaN(id_asignatura)) {
            return res.status(400).json({ success: false, message: "ID de asignatura no válido", data: [] });
        }

        const result = await profesorAsignaturasService.getClasesAsignatura(id_asignatura);

        if (!result.success) {
            return res.status(400).json(result);
        }

        // Éxito
        return res.status(200).json(result);

    } catch (error) {
        console.error("Error en route GET /profesor/asignaturas/:id/clases:", error);
        return res.status(500).json({ success: false, message: "Error interno del servidor al obtener las clases", data: [] });
    }
})

profesorAsignaturasRoute.put('/clases/:id_clase/asignar', async function (req, res) {
    const { id_clase } = req.params
    const { id } = req.user

    // Validaciones básicas
    if (!id_clase || isNaN(id_clase)) {
        return res.status(400).json({ success: false, message: "ID de clase no válido" });
    }

    try {
        const resultado = await profesorAsignaturasService.asignarClaseProfesor(parseInt(id_clase), parseInt(id))
        res.status(resultado.success ? 200 : 400).json(resultado)
    } catch (error) {
        console.error("Error en la ruta de asignarClaseProfesor:", error)
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
}
)

// GET /profesor/asignaturas → lista todas las asignaturas que imparte el profesor junto con sus clases
profesorAsignaturasRoute.get('/asignaturasYclases', async (req, res) => {
    try {
        const profesorId = req.user.id;

        const result = await profesorAsignaturasService.getMyClasesAsignaturasProfesor(profesorId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);

    } catch (err) {
        console.error('Error en route GET /profesor/asignaturas:', err);
        return res.status(500).json({ success: false, message: 'Error interno del servidor al obtener asignaturas', data: [] });
    }
})



module.exports = profesorAsignaturasRoute