const registerService = require('../service/registerService.js')
const multer = require('multer');
const express = require('express')
const registerRoute = express.Router()
const upload = multer(); // memoria, no disco

registerRoute.post('/excel', upload.single('file'), async function (req, res) {
        try {
                if (!req.file) {
                        return res.status(400).json({ success:false, message: 'No se ha enviado ningún archivo.', data:[]});
                }

                const result = await registerService.registerUsers(req.file.buffer);
                result.success ? res.status(200).json({ success:result.success, message: result.message, data:{invalidos: result.invalidos, eliminados: result.eliminados, cambiosGrupo: result.cambiosGrupo} }) :
                res.status(400).json({ success:result.success,message: result.message, data:{invalidos: result.invalidos, eliminados: result.eliminados, cambiosGrupo: result.cambiosGrupo} })
        } catch (error) {
                console.error('Error al procesar el Excel:', error);
                res.status(500).json({ success: false, message: 'Error interno al procesar el Excel.', data: [] });
        }
})


module.exports = registerRoute

