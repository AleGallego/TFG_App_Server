const express = require("express");
const loginService = require('../service/loginService.js')

const loginRoute = express.Router();

loginRoute.post("/", async (req, res) => {
    try {
        const { correo, contraseña } = req.body;

        if (!correo || !contraseña) {
            return res.status(422).json({ success: false, error: "Correo y contraseña requeridos", data: [] });
        }
        const result = await loginService.login(correo, contraseña)

        if (!result.success) {
            res.status(401).json({ success: result.success, message: result.message })
        }
        else {

            res.cookie("token", result.data, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production", // solo HTTPS en prod
                sameSite: "strict",
                maxAge: 12 * 60 * 60 * 1000 // 12 horas
            });

            res.status(200).json({
                success: result.success, message: result.message
            });

        }

    }
    catch (error) {
        console.error("Error en /login:", error);
        res.status(500).json({ success: false, error: "Error interno del servidor" });
    }
});


// GET /logout
loginRoute.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Sesión cerrada correctamente" });
});

module.exports = loginRoute;