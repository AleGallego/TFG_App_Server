const prisma = require("../prismaClient.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const loginService = {

    login: async (correo, contraseña) => {

        let usuario = null;
        let rol = "";
        let returnUser = {}

        // Buscar primero en alumnos
        usuario = await prisma.alumnos.findUnique({ where: { correo } });
        if (usuario) {
            rol = "alumno";
            returnUser = { id: usuario.id, correo: usuario.correo, nombre: usuario.alumno, uo: usuario.uo, rol: rol }
        } else {
            // Si no está en alumnos, buscar en profesores
            usuario = await prisma.profesores.findUnique({ where: { correo } });
            if (usuario) {
                rol = "profesor"
                returnUser = { id: usuario.id, correo: usuario.correo, nombre: usuario.nombre, apellidos: usuario.apellidos, rol: rol }
            };
        }

        // Si no está ni en alumnos ni en profesores
        if (!usuario) {
            return { success: false, message: "Correo incorrecto", data: [] };
        }

        // Validar la contraseña
        const isValid = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!isValid) {
            return { success: false, message: "Contraseña incorrecta", data: [] };
        }

        // Generar token con el rol
        const token = jwt.sign(
            { id: usuario.id, correo: usuario.correo, rol: rol },
            process.env.JWT_SECRET,
            { expiresIn: "12h" }
        );

        return { success: true, message: "Inicio de sesión correcto", data: { token, returnUser } };

    },

    loginCheck: async (correo, rol) => {
        console.log(correo)
        usuario = await prisma.alumnos.findUnique({ where: { correo } });
        if (usuario) {
            returnUser = { id: usuario.id, correo: usuario.correo, nombre: usuario.alumno, uo: usuario.uo, rol: rol }
        } else {
            // Si no está en alumnos, buscar en profesores
            usuario = await prisma.profesores.findUnique({ where: { correo } });
            if (usuario) {
                returnUser = { id: usuario.id, correo: usuario.correo, nombre: usuario.nombre, apellidos: usuario.apellidos, rol: rol }
            };
        }

        // Si no está ni en alumnos ni en profesores
        if (!usuario) {
            return { success: false, message: "Sesión no disponible", data: [] }
        }
        return { success: true, message: "Se mantiene la sesión", data: returnUser }

    }


}
module.exports = loginService