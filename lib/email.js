// lib/email.js
import nodemailer from "nodemailer";
import { isPayPalSandboxTestEnvironment, loginMailTransportOptions } from "./test-environment";

export async function sendLoginCode(to, code) {
  // Validate the current private test settings before constructing any transport.
  const mailer = nodemailer.createTransport(loginMailTransportOptions());
  const from = isPayPalSandboxTestEnvironment()
    ? process.env.SMTP_USER
    : process.env.MAIL_FROM || "info@jagdlatein.de";
  const html = `
    <p>Dein Jagdlatein Login-Code:</p>
    <h2 style="font-family:system-ui;">${code}</h2>
    <p>Gültig für 10 Minuten.</p>
  `;
  await mailer.sendMail({ from, to, subject: "Dein Login-Code", html });
}
