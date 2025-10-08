const express = require('express')
const tablonAnunciosRoute = express.Router()
const tablonAnunciosService = require('../service/tablonAnunciosService')
const requireRole = require('../middlewares/rolesMiddleware');


tablonAnunciosRoute.post('/profesor/publicar', requireRole('alumno'), async function (req, res) {
    try {
        const { titulo, contenido, id_asignatura, id_clase } = req.body;
        const id_profesor = req.user.id; // viene del token JWT
        console.log("Titulo: ", titulo)
        console.log("contenido: ", contenido)
        console.log("id_asignatura: ", id_asignatura)
        console.log("id_clase: ", id_clase)
        console.log("id_profesor: ", id_profesor)
        // Comprobaciones básicas
        if (!titulo || !contenido || !id_asignatura || !id_clase) {
            return res.status(422).json({
                success: false,
                message: 'Faltan datos obligatorios para crear la publicación',
            });
        }

        const result = await tablonAnunciosService.crearEntrada(titulo, contenido, id_asignatura, id_clase, id_profesor);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al crear la publicación',
        });
    }


})


tablonAnunciosRoute.get('/alumno/uiltimasEntradas', requireRole('alumno'), async function (req, res) {

    try {
        const { limit = 10, offset = 0 } = req.query; // paginación opcional

        // Llamada al service pasando el id del alumno
        const entradas = await tablonAnunciosService.obtenerEntradasAlumno(
            req.user.id,
            parseInt(limit),
            parseInt(offset)
        );

        res.status(200).json({
            success: true,
            message: 'Entradas obtenidas correctamente',
            data: entradas,
        });
    } catch (err) {
        console.error('Error al obtener entradas del tablón:', err);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las entradas del tablón',
        });
    }
})


module.exports = tablonAnunciosRoute