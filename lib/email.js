// lib/email.js
import nodemailer from "nodemailer";
import { getTestLoginMailMode, isLoginMailRecipientAllowed, loginMailSenderAddress,
  loginMailTransportOptions } from "./test-environment";

export class TestLoginMailError extends Error {
  constructor(diagnostic = { category: "unknown", stage: "unknown", responseCode: null }) {
    super("Test-E-Mail ist derzeit nicht verfügbar. Bitte später erneut versuchen.");
    this.name = "TestLoginMailError";
    this.code = "TEST_MAIL_UNAVAILABLE";
    this.status = 503;
    this.diagnostic = Object.freeze(diagnostic);
  }
}

export function safeLoginMailDiagnostic(error, phase) {
  // Exact enums only: never copy a provider message, response, command or cause.
  const categories = new Map([
    ["EAUTH", "auth"], ["ENOAUTH", "auth"], ["ETLS", "tls"], ["EREQUIRETLS", "tls"],
    ["CERT_HAS_EXPIRED", "tls"], ["DEPTH_ZERO_SELF_SIGNED_CERT", "tls"],
    ["UNABLE_TO_VERIFY_LEAF_SIGNATURE", "tls"], ["SELF_SIGNED_CERT_IN_CHAIN", "tls"],
    ["ERR_TLS_CERT_ALTNAME_INVALID", "tls"], ["ERR_TLS_HANDSHAKE_TIMEOUT", "tls"],
    ["EDNS", "dns"], ["ETIMEDOUT", "timeout"], ["ECONNECTION", "connection"],
    ["ESOCKET", "connection"], ["EENVELOPE", "envelope"], ["EMESSAGE", "message"],
    ["ESTREAM", "message"], ["EPROTOCOL", "protocol"],
  ]);
  const stages = new Map([
    ["CONN", "connection"], ["EHLO", "greeting"], ["HELO", "greeting"], ["LHLO", "greeting"],
    ["STARTTLS", "tls"], ["AUTH PLAIN", "authentication"], ["AUTH LOGIN", "authentication"],
    ["AUTH CRAM-MD5", "authentication"], ["AUTH XOAUTH2", "authentication"],
    ["MAIL FROM", "sender"], ["RCPT TO", "recipient"], ["DATA", "message"],
  ]);
  const category = categories.get(error?.code) || "unknown";
  const defaultStages = { auth: "authentication", tls: "tls", dns: "connection",
    connection: "connection", message: "message" };
  const stage = stages.get(error?.command) || defaultStages[category] || (phase === "transport" ? "transport" : "unknown");
  const responseCode = Number.isInteger(error?.responseCode) && error.responseCode >= 100 && error.responseCode <= 599
    ? error.responseCode : null;
  return { category, stage, responseCode };
}

export async function sendLoginCode(to, code) {
  // Validate the current private test settings before constructing any transport.
  const testMode = getTestLoginMailMode();
  if (!isLoginMailRecipientAllowed(to)) throw new TestLoginMailError();
  const options = loginMailTransportOptions();
  const from = loginMailSenderAddress();
  const recipient = testMode === "tester-smtp" ? to.trim().toLowerCase() : to;
  const html = `
    <p>Dein Jagdlatein Login-Code:</p>
    <h2 style="font-family:system-ui;">${code}</h2>
    <p>Gültig für 10 Minuten.</p>
  `;
  let phase = "transport";
  try {
    const mailer = nodemailer.createTransport(options);
    phase = "delivery";
    await mailer.sendMail({ from, to: recipient,
      subject: testMode ? "Jagdlatein Testumgebung: Dein Login-Code" : "Dein Login-Code",
      html: testMode ? "<p><strong>Jagdlatein Testumgebung</strong> – dieser Code gilt nur für dein getrenntes Testkonto.</p>" + html : html });
  } catch (error) {
    // SMTP failures can contain addresses, credentials or message contents.
    // Never pass those provider details into the test API's error logging.
    if (testMode) {
      const safeError = new TestLoginMailError(safeLoginMailDiagnostic(error, phase));
      console.error("Test-E-Mail Diagnose:", safeError.diagnostic);
      throw safeError;
    }
    throw error;
  }
}
