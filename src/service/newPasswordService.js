const sendMailPassword = require("../utils/nodeMailer.js")
const crypto = require("crypto");
const bcrypt = require("bcrypt");


const newPasswordService = {

    async sendEmailPassword(email) {

        // 1. Buscar el usuario por correo
        const alumno = await prisma.alumnos.findUnique({
            where: { correo: email }
        });
        if (!alumno) {
            return { success: false, error: "El correo no está registrado" };
        }

        // 2. Generar token aleatorio
        const token = crypto.randomBytes(32).toString("hex");

        // 3. Hashear token para guardarlo seguro
        const tokenHash = await bcrypt.hash(token, 10);

        // 4. Definir expiración (1 hora)
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        // 5. Guardar en la BDD (sobreescribir si ya tenía uno)
        await prisma.passwordresettoken.upsert({
            where: { id_alumno: alumno.id },
            update: { tokenHash: tokenHash, expiresAt: expiresAt },
            create: { id_alumno: alumno.id, tokenHash: tokenHash, expiresAt: expiresAt }
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

        const resetRecords = await prisma.passwordresettoken.findMany({ include: { alumnos: true } });

        const resetToken = resetRecords.find(r => bcrypt.compareSync(token, r.tokenHash));
        if (!resetToken) return { success: false, error: "Token inválido" };
        if (resetToken.expiresAt < new Date()) return { success: false, error: "Token expirado" };
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.alumnos.update({ where: { id: resetToken.id_alumno }, data: { contraseña: hashedPassword } });
        await prisma.passwordresettoken.delete({ where: { id_alumno: resetToken.id_alumno } });
        return { success: true, message: "Contraseña actualizada correctamente" };

    }
}
module.exports = newPasswordService