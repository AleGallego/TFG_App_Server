const express = require('express')
const alumnoAsignaturasRoute = express.Router()
const alumnoAsignaturasService = require('../service/alumnoAsignaturasService')



alumnoAsignaturasRoute.get('/alumno/misAsignaturas', async function (req, res) {
    try {
        const result = await alumnoAsignaturasService.getMyAsignaturas(req.user.id)
        if (!result.success) return res.status(400).json(result);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "No se pudo procesar la solicitud en el servidor",
            data: []
        });
        console.error(err);
    }
})


module.exports = alumnoAsignaturasRoute