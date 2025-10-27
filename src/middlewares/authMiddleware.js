const jwt = require("jsonwebtoken");

// Middleware para proteger rutas
function authMiddleware(req, res, next) {
  try {
    // 1️ Leer la cookie 
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "No autenticado" });
    }

    // Verificar JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guardar info del usuario
    req.user = decoded; // { id: usuario.id, correo: usuario.correo, rol:rol}

    // Continuamos
    next();
  } catch (err) {
    console.error("Error en authMiddleware:", err);
    return res.status(401).json({ success: false, message: "Token inválido o expirado" });
  }
}

module.exports = authMiddleware;