// Private server setting. An isolated PayPal test deployment must never fall
// back to a live provider when one of its settings is missing.
export const PAYPAL_SANDBOX_API = "https://api-m.sandbox.paypal.com";
export const TEST_MAIL_HOST = "smtp.ethereal.email";

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

export function loginMailTransportOptions(env = process.env) {
  if (!isPayPalSandboxTestEnvironment(env)) {
    return {
      host: env.SMTP_HOST || "mail.hostpoint.ch",
      port: Number(env.SMTP_PORT || 587),
      secure: false,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
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
