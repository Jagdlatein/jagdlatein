import { getDeadline, waitUntil } from "@vercel/functions";
import nodemailer from "nodemailer";
import { loginMailSenderAddress, loginMailTransportOptions } from "./test-environment";
import { safeLoginMailDiagnostic } from "./email";

export const OPERATOR_TRIAL_RECIPIENT = "info@jagdlatein.de";
const LIVE_PAYPAL_API = "https://api-m.paypal.com";
const LIVE_PAYPAL_ORIGINS = new Set([LIVE_PAYPAL_API, "https://api.paypal.com"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAILBOX = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

function liveDeployment(env = process.env) {
  if (env.NODE_ENV !== "production" || env.VERCEL_ENV !== "production" || env.JL_TEST_ENVIRONMENT) return false;
  try {
    const url = new URL(env.PAYPAL_API_BASE || LIVE_PAYPAL_API);
    return LIVE_PAYPAL_ORIGINS.has(url.origin) && url.pathname === "/" && !url.search && !url.hash && !url.username && !url.password;
  } catch { return false; }
}

function mailConfiguration(env = process.env) {
  if (!liveDeployment(env)) return null;
  try {
    const options = loginMailTransportOptions(env);
    const from = loginMailSenderAddress(env);
    if (!options || !/^[a-z0-9.-]{1,253}$/i.test(options.host || "") ||
        ![465, 587].includes(options.port) || !MAILBOX.test(from || "") || from.length > 320 ||
        typeof options.auth?.user !== "string" || !options.auth.user.trim() ||
        typeof options.auth?.pass !== "string" || !options.auth.pass.trim()) return null;
    return { from, options: { ...options, secure: options.port === 465, requireTLS: true,
      tls: { ...options.tls, rejectUnauthorized: true },
      connectionTimeout: 4000, greetingTimeout: 4000, socketTimeout: 8000 } };
  } catch { return null; }
}

function unavailable() { return Object.assign(new Error("Abo-Benachrichtigungen sind derzeit nicht verfügbar."), { status: 503 }); }
function iso(value) {
  if (typeof value !== "string" || value.length > 64 || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}
function noticeIsValid(notice) {
  const start = iso(notice?.trial_started_at), end = iso(notice?.trial_until);
  return notice && UUID.test(notice.id || "") && UUID.test(notice.lease_token || "") &&
    UUID.test(notice.account_generation || "") && notice.environment === "Production" &&
    ["apple", "paypal"].includes(notice.provider) &&
    typeof notice.account_email === "string" && notice.account_email.length <= 320 &&
    /^[^\s@\u0000-\u001f\u007f]+@[^\s@\u0000-\u001f\u007f]+\.[^\s@\u0000-\u001f\u007f]+$/.test(notice.account_email) &&
    start && end && Date.parse(end) > Date.parse(start) &&
    Date.parse(end) - Date.parse(start) <= (notice.provider === "paypal" ? 3 : 400) * 86400000;
}
function safeDiagnostic(error) {
  const diagnostic = safeLoginMailDiagnostic(error, "delivery");
  return `${diagnostic.category}:${diagnostic.stage}${diagnostic.responseCode ? `:${diagnostic.responseCode}` : ""}`;
}
async function rpc(database, name, args = {}) {
  const result = await database.rpc(name, args);
  if (result?.error) throw unavailable();
  return result?.data;
}

// This endpoint's GET caller reads only. Missing infrastructure is presented as
// not configured, and never leaks provider errors, account identifiers or secrets.
export async function getOperatorTrialNotificationStatus(database) {
  const empty = { configured: false, recipient: OPERATOR_TRIAL_RECIPIENT,
    enabledSince: null, pendingCount: null, sentCount: null };
  try {
    const result = await rpc(database, "operator_trial_notification_status");
    const enabledSince = iso(result?.enabled_since);
    if (!enabledSince || !Number.isSafeInteger(result.pending_count) || result.pending_count < 0 ||
        !Number.isSafeInteger(result.sent_count) || result.sent_count < 0) return empty;
    return { ...empty, configured: Boolean(mailConfiguration()), enabledSince,
      pendingCount: result.pending_count, sentCount: result.sent_count };
  } catch { return empty; }
}

async function deliver(notice, configuration) {
  const mailer = nodemailer.createTransport(configuration.options);
  let timer;
  try {
    const start = new Date(notice.trial_started_at).toLocaleString("de-CH", { timeZone: "Europe/Zurich" });
    const end = new Date(notice.trial_until).toLocaleString("de-CH", { timeZone: "Europe/Zurich" });
    // Plain text prevents account input from being interpreted as HTML. The
    // recipient and link are fixed; no login token or customer receipt is sent.
    const message = { from: configuration.from, to: OPERATOR_TRIAL_RECIPIENT,
      subject: `Jagdlatein: Neues Testabo über ${notice.provider === "apple" ? "Apple" : "PayPal"}`,
      messageId: `<jagdlatein-trial-${notice.id}@jagdlatein.de>`,
      text: `Ein neues kostenloses Testabo wurde bestätigt.\n\nJagdlatein-Konto: ${notice.account_email}\nAnbieter: ${notice.provider === "apple" ? "Apple" : "PayPal"}\nBeginn: ${start}\nTestzugang bis: ${end}\nZeitzone: Europe/Zurich\n\nBetreiberübersicht: https://jagdlatein.de/admin/testabos\n\nDiese Nachricht bestätigt den Beginn des Testzugangs; sie ist kein Zahlungsbeleg.` };
    const sent = await Promise.race([mailer.sendMail(message), new Promise((_, reject) => {
      timer = setTimeout(() => { mailer.close(); reject(Object.assign(new Error("Mail timeout"), { code: "ETIMEDOUT" })); }, 12000);
    })]);
    if (!Array.isArray(sent?.accepted) || !sent.accepted.some(value => String(value).toLowerCase() === OPERATOR_TRIAL_RECIPIENT))
      throw Object.assign(new Error("Mail not accepted"), { code: "EENVELOPE" });
  } finally { clearTimeout(timer); mailer.close(); }
}

// Only a provider hook or an authenticated operator POST calls this mutating
// operation. PostgreSQL owns selection, leases, ownership and retry scheduling.
export async function drainOperatorTrialNotifications({ database, limit = 10 } = {}) {
  const counts = { processed: 0, sent: 0, retry: 0, suppressed: 0 };
  const configuration = mailConfiguration();
  if (!configuration) return counts;
  if (!Number.isInteger(limit) || limit < 1 || limit > 10 || !database) throw unavailable();
  // Catch up failed post-response queue calls without replaying old registrations.
  await rpc(database, "reconcile_operator_trial_notifications", { p_limit: 100 });
  const startedAt = Date.now();
  for (let index = 0; index < limit && Date.now() - startedAt < 20000; index++) {
    const notice = await rpc(database, "claim_operator_trial_notification");
    if (notice === null) break;
    if (!noticeIsValid(notice)) throw unavailable();
    counts.processed++;
    let state = "sent", diagnostic = null;
    try {
      // The claim contains a transient email joined from the current account;
      // a deletion before SMTP starts suppresses this notification.
      const stillCurrent = await rpc(database, "operator_trial_notification_claim_current",
        { p_id: notice.id, p_lease_token: notice.lease_token });
      if (stillCurrent !== true) { state = "suppressed"; counts.suppressed++; }
      else { await deliver(notice, configuration); counts.sent++; }
    } catch (error) { state = "retry"; diagnostic = safeDiagnostic(error); counts.retry++; }
    // SMTP acceptance and the durable acknowledgement cannot be one transaction.
    // A crash between them can resend; the stable Message-ID aids deduplication.
    await rpc(database, "finish_operator_trial_notification",
      { p_id: notice.id, p_lease_token: notice.lease_token, p_state: state, p_diagnostic: diagnostic });
    if (state === "retry") break;
  }
  return counts;
}

// This shared provider module is used by both App Router and Pages SSR. The
// official Vercel API works in both; Next's after() cannot be imported by Pages.
// A public runtime deadline is required before starting work. Register a lazy
// promise with waitUntil first, then open its gate: registration failures cannot
// launch an untracked task. Cron/admin reconciliation covers missing/short-lived
// contexts. Payment results never depend on optional outbox or SMTP work.
export function scheduleOperatorTrialNotification(database, { provider, environment, contractId }) {
  if (!liveDeployment() || environment !== "Production" || !["paypal", "apple"].includes(provider)) return;
  let start;
  try {
    const deadline = getDeadline();
    if (!deadline || !Number.isFinite(deadline.getTime()) || deadline.getTime() - Date.now() < 15000) return;
    const gate = new Promise(resolve => { start = resolve; });
    const task = gate.then(async allowed => {
      if (!allowed) return;
      try {
        await rpc(database, "queue_operator_trial_notification", {
          p_provider: provider, p_environment: environment, p_contract_id: contractId,
        });
        await drainOperatorTrialNotifications({ database, limit: 2 });
      } catch { console.error("Abo-Benachrichtigung: Wird später erneut geprüft."); }
    });
    waitUntil(task);
    start(true);
  } catch { if (start) start(false); /* The durable worker retries without affecting billing. */ }
}
