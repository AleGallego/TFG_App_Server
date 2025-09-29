const registerService = require('../service/registerService.js')
const express = require('express')
const registerRoute = express.Router()


registerRoute.get('/excel', async function (req, res) {

        registerService.registerUsers('C:/Users/aleja/Desktop/TFG/App_Server/src/assets/EjemploListaExcel.xlsx')// EJEMPLO
        .then(alumnos=>res.send(alumnos)) // Cambiar
        .catch(err=>res.status(500).json({ error: err.message }))
})


module.exports = registerRoute

