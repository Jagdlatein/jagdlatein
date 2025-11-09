// lib/mail.js
import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // STARTTLS on port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// helper to send login code
export async function sendLoginCode(to, code) {
  const from = process.env.MAIL_FROM || `info@jagdlatein.de`;
  const html = `<p>Dein Jagdlatein Login-Code:</p><h2>${code}</h2><p>Gültig für 10 Minuten.</p>`;
  await mailer.sendMail({ from, to, subject: "Dein Login-Code — Jagdlatein", html });
}
