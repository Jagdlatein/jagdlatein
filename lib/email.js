import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,          // z.B. smtp.office365.com / smtp.gmail.com
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,                         // bei Port 465: true
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Versendet den Login-Code (Magic Code)
 * @param {string} to  Empfänger (E-Mail)
 * @param {string} code  6-stelliger Code
 */
export async function sendLoginCode(to, code) {
  const from = process.env.MAIL_FROM || "info@jagdlatein.de";
  const html = `
    <p>Dein Jagdlatein Login-Code:</p>
    <h2 style="font-family:system-ui;margin:8px 0">${code}</h2>
    <p>Gültig für 10 Minuten.</p>
  `;
  await mailer.sendMail({ from, to, subject: "Dein Login-Code", html });
}
