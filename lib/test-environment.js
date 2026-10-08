// Private server setting. An isolated PayPal test deployment must never fall
// back to a live provider when one of its settings is missing.
export const PAYPAL_SANDBOX_API = "https://api-m.sandbox.paypal.com";
export const TEST_MAIL_HOST = "smtp.ethereal.email";
export const TESTER_MAIL_HOST = "asmtp.mail.hostpoint.ch";

function unavailable() {
  return Object.assign(new Error("Testumgebung ist nicht vollständig isoliert konfiguriert."), { status: 503 });
}

export function isPayPalSandboxTestEnvironment(env = process.env) {
  const mode = env.JL_TEST_ENVIRONMENT;
  if (!mode) return false;
  if (mode !== "paypal-sandbox") throw unavailable();
  return true;
}

export function assertTestPayPalApiBase(base, env = process.env) {
  if (isPayPalSandboxTestEnvironment(env) &&
      base !== PAYPAL_SANDBOX_API && base !== `${PAYPAL_SANDBOX_API}/`) throw unavailable();
}

// Only this non-sensitive mode is suitable for the login page's server props.
// Do not make rendering depend on SMTP secrets or expose the private tester list.
export function getTestLoginMailMode(env = process.env) {
  if (!isPayPalSandboxTestEnvironment(env)) return null;
  const mode = env.JL_TEST_MAIL_MODE ?? "sink";
  if (mode !== "sink" && mode !== "tester-smtp") throw unavailable();
  return mode;
}

function normalizePlainMailbox(value) {
  if (typeof value !== "string" || /[\u0000-\u001f\u007f]/.test(value)) return "";
  const email = value.trim().toLowerCase();
  if (email.length > 320 || email.includes("*") || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email)) return "";
  const local = email.slice(0, email.indexOf("@"));
  return local.startsWith(".") || local.endsWith(".") || local.includes("..") ? "" : email;
}

function testerMailConfiguration(env) {
  assertTestPayPalApiBase(env.PAYPAL_API_BASE, env);
  const from = normalizePlainMailbox(env.JL_TEST_SMTP_FROM);
  const user = normalizePlainMailbox(env.JL_TEST_SMTP_USER);
  const rawRecipients = env.JL_TEST_MAIL_RECIPIENTS;
  const recipients = typeof rawRecipients === "string" ? rawRecipients.split(",") : [];
  const normalizedRecipients = recipients.map(normalizePlainMailbox);
  if (env.JL_TEST_SMTP_HOST !== TESTER_MAIL_HOST ||
      !["465", "587"].includes(String(env.JL_TEST_SMTP_PORT)) ||
      !user ||
      typeof env.JL_TEST_SMTP_PASS !== "string" || !env.JL_TEST_SMTP_PASS.trim() ||
      !from || !recipients.length || recipients.length > 100 ||
      normalizedRecipients.some(email => !email)) throw unavailable();
  return { from, user, recipients: new Set(normalizedRecipients), port: Number(env.JL_TEST_SMTP_PORT) };
}

export function isLoginMailRecipientAllowed(to, env = process.env) {
  if (getTestLoginMailMode(env) !== "tester-smtp") return true;
  const configuration = testerMailConfiguration(env);
  const recipient = normalizePlainMailbox(to);
  return Boolean(recipient) && configuration.recipients.has(recipient);
}

export function loginMailSenderAddress(env = process.env) {
  const mode = getTestLoginMailMode(env);
  if (mode === "tester-smtp") return testerMailConfiguration(env).from;
  return mode === "sink" ? env.SMTP_USER : env.MAIL_FROM || "info@jagdlatein.de";
}

export function loginMailTransportOptions(env = process.env) {
  const mode = getTestLoginMailMode(env);
  if (!mode) {
    return {
      host: env.SMTP_HOST || "mail.hostpoint.ch",
      port: Number(env.SMTP_PORT || 587),
      secure: false,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    };
  }

  if (mode === "tester-smtp") {
    const { port, user } = testerMailConfiguration(env);
    return {
      host: TESTER_MAIL_HOST,
      port,
      secure: port === 465,
      requireTLS: true,
      tls: { servername: TESTER_MAIL_HOST, rejectUnauthorized: true },
      auth: { user, pass: env.JL_TEST_SMTP_PASS },
    };
  }

  assertTestPayPalApiBase(env.PAYPAL_API_BASE, env);
  if (env.SMTP_HOST !== TEST_MAIL_HOST || String(env.SMTP_PORT) !== "587" ||
      typeof env.SMTP_USER !== "string" || !/^[^@\s]+@ethereal\.email$/.test(env.SMTP_USER) ||
      typeof env.SMTP_PASS !== "string" || !env.SMTP_PASS.trim()) throw unavailable();

  return {
    host: TEST_MAIL_HOST,
    port: 587,
    secure: false,
    requireTLS: true,
    tls: { servername: TEST_MAIL_HOST, rejectUnauthorized: true },
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  };
}
