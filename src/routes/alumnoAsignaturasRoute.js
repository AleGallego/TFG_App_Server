const express = require('express')
const alumnoAsignaturasRoute = express.Router()
const alumnoAsignaturasService = require('../service/alumnoAsignaturasService')



alumnoAsignaturasRoute.get('/misClasesAsignaturas', async function (req, res) {
    try {
        const result = await alumnoAsignaturasService.getMyClasesAsignaturas(req.user.id)
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

/*alumnoAsignaturasRoute.get('/misAsignaturas', async function (req, res) {
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
    */

// Pruebas (con nota) del alumno en una asignatura concreta
alumnoAsignaturasRoute.get('/misAsignaturas/:id_asignatura/pruebas', async function (req, res) {
    try {
        const id_alumno = req.user.id;
        const id_asignatura = parseInt(req.params.id_asignatura);

        if (!id_asignatura || isNaN(id_asignatura)) {
            return res.status(422).json({success: false, message: "ID de asignatura no válido",data: [] });
        }

        const result = await alumnoAsignaturasService.getPruebasConNotas(id_alumno, id_asignatura);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(200).json(result);

    } catch (err) {
        console.error("Error en /alumno/asignaturas/:id_asignatura/pruebas:", err);
        res.status(500).json({success: false,message: "Error interno del servidor al obtener las pruebas del alumno",data: []});
    }
});


module.exports = alumnoAsignaturasRoute