// lib/email.js
import nodemailer from "nodemailer";
import { getTestLoginMailMode, isLoginMailRecipientAllowed, loginMailSenderAddress,
  loginMailTransportOptions } from "./test-environment";

function testMailUnavailable() {
  return Object.assign(new Error("Test-E-Mail ist derzeit nicht verfügbar."), { status: 503 });
}

export async function sendLoginCode(to, code) {
  // Validate the current private test settings before constructing any transport.
  const testMode = getTestLoginMailMode();
  if (!isLoginMailRecipientAllowed(to)) throw testMailUnavailable();
  const options = loginMailTransportOptions();
  const from = loginMailSenderAddress();
  const recipient = testMode === "tester-smtp" ? to.trim().toLowerCase() : to;
  const html = `
    <p>Dein Jagdlatein Login-Code:</p>
    <h2 style="font-family:system-ui;">${code}</h2>
    <p>Gültig für 10 Minuten.</p>
  `;
  try {
    const mailer = nodemailer.createTransport(options);
    await mailer.sendMail({ from, to: recipient,
      subject: testMode ? "Jagdlatein Testumgebung: Dein Login-Code" : "Dein Login-Code",
      html: testMode ? "<p><strong>Jagdlatein Testumgebung</strong> – dieser Code gilt nur für dein getrenntes Testkonto.</p>" + html : html });
  } catch (error) {
    // SMTP failures can contain addresses, credentials or message contents.
    // Never pass those provider details into the test API's error logging.
    if (testMode) throw testMailUnavailable();
    throw error;
  }
}
