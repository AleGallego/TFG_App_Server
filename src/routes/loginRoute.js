const express = require("express");
const loginService = require('../service/loginService.js')
const authMiddleware = require("../middlewares/authMiddleware.js");

const loginRoute = express.Router();

loginRoute.post("/", async (req, res) => {
    try {
        const { correo, contraseña } = req.body;

        if (!correo || !contraseña) {
            return res.status(422).json({ success: false, error: "Correo y contraseña requeridos", data: [] });
        }
        const result = await loginService.login(correo, contraseña)

        if (!result.success) {
            console.log(result)
            res.status(401).json( result )
        }
        else {

            res.cookie("token", result.data.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production", // solo HTTPS en prod
                sameSite: "strict",
                maxAge: 12 * 60 * 60 * 1000 // 12 horas
            });

            res.status(200).json({
                success: result.success, message: result.message, data: result.data.returnUser
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

loginRoute.get('/me', authMiddleware, async (req, res) => {
    try {

        const { correo,rol } = req.user
        const result = await loginService.loginCheck(correo,rol)
        return !result.success?res.status(401).json(result):res.status(200).json(result)

    } catch (err) {
        console.error('Error en /me:', err);
        return res.status(401).json({ success: false, message: 'Token inválido o expirado.' });
    }
});

module.exports = loginRoute;