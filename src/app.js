const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // para logging de peticiones
const cookieParser = require("cookie-parser");
require('dotenv').config();


// Importar rutas
//..............
const registerRoute = require('./routes/registerRoute.js')
const newPasswordRoute = require('./routes/newPasswordRoute.js')
const profesorAsignaturasRouter = require('./routes/profesorAsignaturasRoute.js')
const alumnoAsignaturasRouter = require('./routes/alumnoAsignaturasRoute.js')
const loginRoute = require('./routes/loginRoute.js')
const tablonAnunciosRoute = require('./routes/tablonAnunciosRoute.js')
const pruebasRoute = require('./routes/pruebasRoute.js')
const notasRoute = require('./routes/notasRoute.js')
const profesorTutoriaRoute = require('./routes/profesorTutoriaRoute.js')
const alumnoTutoriaRoute = require('./routes/alumnoTutoriaRoute.js')
const profesorRevisionRoute = require('./routes/profesorRevisionRoute.js')


// Importar Middlewares
//....................
const authMiddleware = require("./middlewares/authMiddleware.js");
const requireRole = require('./middlewares/rolesMiddleware.js')



const app = express();

// -------------------- Middlewares globales --------------------
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

//Uso de rutas importadas
app.use("/register", authMiddleware, requireRole("profesor"), registerRoute)
app.use("/login", loginRoute)
app.use("/account", newPasswordRoute)
app.use("/asignaturas-p", authMiddleware, requireRole("profesor"), profesorAsignaturasRouter)
app.use("/asignaturas-a", authMiddleware, requireRole("alumno"), alumnoAsignaturasRouter)
app.use("/anuncios", authMiddleware, tablonAnunciosRoute)
app.use("/pruebas", authMiddleware,pruebasRoute)
app.use("/notas", authMiddleware,notasRoute)
app.use("/tutorias-p", authMiddleware,requireRole("profesor"),profesorTutoriaRoute)
app.use("/tutorias-a", authMiddleware,requireRole("alumno"),alumnoTutoriaRoute)
app.use("/revision-p", authMiddleware,requireRole("profesor"),profesorRevisionRoute)


// -------------------- Middleware de error --------------------
// Middleware para manejar rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

// Exportar la app para server.js
module.exports = app;