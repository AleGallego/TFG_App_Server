const express = require('express')
const newPasswordRoute = express.Router()
const newPasswordService = require('../service/newPasswordService.js')


newPasswordRoute.post('/generatePass', async function (req, res) {

        res.send(req.body)
        newPasswordService(req.body.toData,req.body.subjectData,req.body.textData, req.body.htmlData)
})


module.exports = newPasswordRoute