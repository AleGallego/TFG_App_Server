const express = require('express')
const profesorAsignaturasRouter = express.Router()
const profesorAsignaturasService = require('../service/profesorAsignaturasService')



profesorAsignaturasRouter.get('/profesor/asignaturas', async function (req, res) {
    const asignaturas = await profesorAsignaturasService.getAllAsignaturas()
    res.json(asignaturas)
})


profesorAsignaturasRouter.get('/profesor/asignaturas/:id/clases', async function (req, res) {
    const clases = await profesorAsignaturasService.getGruposAsignatura(parseInt(req.params.id,10))
    res.json(clases)
})














module.exports = profesorAsignaturasRouter