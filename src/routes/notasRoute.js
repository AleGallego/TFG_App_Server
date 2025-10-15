const express = require("express");
const multer = require('multer');
const requireRole = require('../middlewares/rolesMiddleware.js')
const notasService = require('../service/notasService')
const notasRoute = express.Router();
const upload = multer(); // memoria, no disco

notasRoute.post("/publicar", requireRole("profesor"), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No se ha enviado ningún archivo.', data: [] });
        }

        //  Comprobación de idPrueba
        const { idPrueba } = req.body;
        if (!idPrueba) {
            return res.status(400).json({ success: false, message: 'Falta el parámetro idPrueba.', data: [] });
        }

        const result = await notasService.publicarNotas(req.file.buffer, Number(idPrueba))
        //  Respuesta según resultado
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error al procesar el Excel de notas:', error);
        res.status(500).json({ success: false, message: 'Error interno al procesar el Excel de notas.', data: [] });
    }

});

module.exports = notasRoute