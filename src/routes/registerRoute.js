const registerService = require('../service/registerService.js')
const express = require('express')
const registerRoute = express.Router()


        registerRoute.get('/excel', async function (req, res) {

                const result = await registerService.registerUsers('C:/Users/aleja/Desktop/TFG/App_Server/src/assets/EjemploListaExcel.xlsx')// EJEMPLO
                result.success? res.status(200).json({message: result.message, invalidos:result.invalidos}):res.status(400).json({message:result.message, invalidos:result.invalidos})
        })


module.exports = registerRoute

