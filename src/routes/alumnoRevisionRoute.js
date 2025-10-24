const express = require('express')
const alumnoRevisionRoute = express.Router()
const alumnoRevisionService = require('../service/alumnoRevisonService')

alumnoRevisionRoute.post("/unirse", async (req, res) => {
  try {
    const { id_revision } = req.body || {};
    const id_alumno = req.user.id;

    if (!id_revision) {
      return res.status(400).json({success: false,message: "Debe indicar el id de la revisión.",data: [],});
    }
    const resultado = await alumnoRevisionService.unirseRevision(id_revision, id_alumno);
    res.status(resultado.success ? 200 : 400).json(resultado);
  } catch (error) {
    console.error("Error al inscribirse en revisión:", error);
    res.status(500).json({success: false,message: "Error interno al inscribirse en la revisión.",data: [],});
  }
});
module.exports = alumnoRevisionRoute;

