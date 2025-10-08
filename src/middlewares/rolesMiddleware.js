function requireRole(...rolesPermitidos) {

  return (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, error: "No autenticado" });
      }

      if (!rolesPermitidos.includes(user.rol)) {
        return res.status(403).json({ success: false, error: "No tienes acceso a este recurso" });
      }

      next();
    } catch (err) {
      console.error("Error en requireRole:", err);
      return res.status(500).json({ success: false, error: "Error interno en roles" });
    }
  };
}

module.exports = requireRole;
