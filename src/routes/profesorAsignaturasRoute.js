const express = require('express')
const profesorAsignaturasRoute = express.Router()
const profesorAsignaturasService = require('../service/profesorAsignaturasService')



profesorAsignaturasRoute.get('/profesor/asignaturas', async function (req, res) {
    const asignaturas = await profesorAsignaturasService.getAllAsignaturas()
    res.json(asignaturas)
})


profesorAsignaturasRoute.get('/profesor/asignaturas/:id/clases', async function (req, res) {
    const clases = await profesorAsignaturasService.getClasesAsignatura(parseInt(req.params.id,10))
    res.json(clases)
})
module.exports = profesorAsignaturasRoute