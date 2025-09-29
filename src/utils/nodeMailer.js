const nodemailer = require("nodemailer");

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.NODE_CORREO,
        pass: process.env.NODE_PASS
    },
});

async function sendMailPassword(toData,subjectData,textData,htmlData) {

        const info = await transporter.sendMail({
            from: '"Maddison Foo Koch" <maddison53@ethereal.email>',
            to: toData,
            subject: subjectData,
            text: textData,
            html: htmlData,
        });

        console.log("Message sent:", info.messageId);

}

module.exports = sendMailPassword

