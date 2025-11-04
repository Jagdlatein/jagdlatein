// lib/mail.js
import nodemailer from 'nodemailer';

export async function sendMail({ to, subject, html }) {
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP not configured, skipping email.');
    return;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465, // true bei 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    }
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'Jagdlatein <no-reply@jagdlatein.de>',
    to,
    subject,
    html,
  });
}
