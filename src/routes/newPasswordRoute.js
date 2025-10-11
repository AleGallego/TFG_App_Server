const express = require('express')
const newPasswordRoute = express.Router()
const newPasswordService = require('../service/newPasswordService.js')


newPasswordRoute.post('/generatePass', async function (req, res) {
        const { correo } = req.body;
        if (!correo) return res.status(422).json({ success: false, error: "Correo requerido" });
        try {
                const result = await newPasswordService.sendEmailPassword(correo);
                if (!result.success) return res.status(400).json(result);
                res.status(200).json(result);
        } catch (err) {
                res.status(500).json({
                        success: false,
                        message: "No se pudo procesar la solicitud en el servidor"
                });
                console.error(err);
        }
})

newPasswordRoute.post('/reset-password', async function (req, res) {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
                return res.status(422).json({ success: false, error: "Token y nueva contraseña son requeridos" });
        }
        try {
                const result = await newPasswordService.createUserPassword(token, newPassword);
                if (!result.success) return res.status(400).json(result);
                res.status(200).json(result);
        } catch (err) {
                res.status(500).json({ success: false, error: "Error en el servidor al actualizar la contraseña" });
                console.error(err);
        }
})

module.exports = newPasswordRoute