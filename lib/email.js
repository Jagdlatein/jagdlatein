// lib/mail.js
import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "mail.hostpoint.ch",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // TLS via STARTTLS
  auth: {
    user: process.env.SMTP_USER, // z.B. info@jagdlatein.de
    pass: process.env.SMTP_PASS,
  },
});

export async function sendLoginCode(to, code) {
  const from = process.env.MAIL_FROM || "info@jagdlatein.de";
  const html = `
    <p>Dein Jagdlatein Login-Code:</p>
    <h2 style="font-family:system-ui;">${code}</h2>
    <p>Gültig für 10 Minuten.</p>
  `;
  await mailer.sendMail({ from, to, subject: "Dein Login-Code", html });
}
