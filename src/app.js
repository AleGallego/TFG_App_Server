const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // para logging de peticiones
require('dotenv').config();


// Importar rutas
//..............
const registerRoute = require('./routes/registerRoute.js')
const newPasswordRoute = require('./routes/newPasswordRoute.js')

const app = express();

// -------------------- Middlewares globales --------------------
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

//Uso de rutas importadas
app.use("/register",registerRoute)
app.use("/account",newPasswordRoute)

// -------------------- Middleware de error --------------------
// Middleware para manejar rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

// Exportar la app para server.js
module.exports = app;