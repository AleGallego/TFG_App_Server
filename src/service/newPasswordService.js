const sendMailPassword = require("../utils/nodeMailer.js")
const crypto = require("crypto");
const bcrypt = require("bcrypt");


const newPasswordService = {

    async sendEmailPassword(email) {

        // 1. Buscar el usuario por correo
        const alumno = await prisma.alumnos.findUnique({ where: { correo: email } });
        const profesor = await prisma.profesores.findUnique({ where: { correo: email } });
        // Comprobar si es alumno o profesor
        const user = alumno || profesor;
        const tipo = alumno ? "alumno" : profesor ? "profesor" : null;

        if (!user) {
            return { success: false, error: "El correo no está registrado" };
        }

        // 2. Generar token aleatorio
        const token = crypto.randomBytes(32).toString("hex");
        // 3. Hashear token para guardarlo seguro
        const tokenHash = await bcrypt.hash(token, 10);
        // 4. Definir expiración (1 hora)
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        // 5. Guardar en la BDD (sobreescribir si ya tenía uno)
        const whereField = tipo === "alumno"
            ? { id_alumno: user.id }
            : { id_profesor: user.id };

        await prisma.passwordresettoken.upsert({
            where: whereField,
            update: { tokenHash, expiresAt },
            create: { ...whereField, tokenHash, expiresAt },
        });
        // 4. Enviar correo
        const resetLink = `https://localhost:3000/account/reset-password?token=${token}`; // Este link apunta a una vista del frontend (REACT)
        await sendMailPassword(email, resetLink,);
        return {
            success: true,
            message: "Recibirás un enlace para restablecer tu contraseña."
        }
    },

    async createUserPassword(token, newPassword) {
        // 1. Traer solo tokens aún válidos
        const validTokens = await prisma.passwordresettoken.findMany({
            where: {
                expiresAt: { gt: new Date() }, // solo tokens no expirados
            },
            include: { alumnos: true, profesores: true },
        });
        // 2. Buscar el que coincida con el hash
        const resetToken = validTokens.find(r => bcrypt.compareSync(token, r.tokenHash));
        if (!resetToken) return { success: false, error: "Token inválido o expirado" };
        // 3. Actualizar contraseña del alumno
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        if (resetToken.id_alumno) {
            await prisma.alumnos.update({ where: { id: resetToken.id_alumno }, data: { contraseña: hashedPassword } });
        } else if (resetToken.id_profesor) {
            await prisma.profesores.update({ where: { id: resetToken.id_profesor }, data: { contraseña: hashedPassword } });
        }

        await prisma.passwordresettoken.delete({ where: { id: resetToken.id } });

        return { success: true, message: "Contraseña actualizada correctamente" };
    }
}
module.exports = newPasswordService