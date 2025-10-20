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

// Obtener todas las notas de una prueba
notasRoute.get("/prueba/:idPrueba", requireRole("profesor"), async (req, res) => {
    try {
        const idPrueba = parseInt(req.params.idPrueba, 10);

        if (isNaN(idPrueba)) {
            return res.status(400).json({ success: false, message: "ID de prueba inválido.", data: [] });
        }

        const result = await notasService.getNotasByPrueba(idPrueba);
        return result.success ? res.status(200).json(result) : res.status(400).json(result)


    } catch (error) {
        console.error("Error al obtener notas de la prueba:", error);
        res.status(500).json({ success: false, message: "Error interno al obtener notas.", data: [] });
    }
});

// PATCH para actualizar una nota concreta
notasRoute.patch("/actualizar", requireRole("profesor"), async (req, res) => {
    try {
        const { id_nota, nota } = req.body || {}

        if (id_nota === undefined || nota === undefined) {
            return res.status(400).json({ success: false, message: "Faltan parámetros.", data: [] });
        }

        const result = await notasService.actualizarNota(id_nota, nota);

        return result.success
            ? res.status(200).json(result)
            : res.status(400).json(result);

    } catch (error) {
        console.error("Error al actualizar la nota:", error);
        res.status(500).json({ success: false, message: "Error interno al actualizar la nota.", data: [] });
    }
});


module.exports = notasRoute