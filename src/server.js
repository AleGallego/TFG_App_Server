const app = require('./app')
require('dotenv').config()
const PORT = process.env.PORT


const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});