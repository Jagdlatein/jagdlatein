export const ACCOUNT_DELETION_CONFIRMATION = "KONTO LÖSCHEN";
export const ACCOUNT_DELETION_REAUTH_SECONDS = 10 * 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class AccountDeletionError extends Error {
  constructor(code, status, message) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function isAccountDeletionEnabled() {
  return process.env.ACCOUNT_DELETION_ENABLED === "true";
}

export function deletionUnavailable() {
  return new AccountDeletionError("ACCOUNT_DELETION_UNAVAILABLE", 503,
    "Die direkte Kontolöschung ist derzeit nicht verfügbar. Bitte später erneut versuchen oder die Kontohilfe nutzen.");
}

export function requiresDeletionReauthentication(session, nowMs = Date.now()) {
  const now = Math.floor(nowMs / 1000);
  return !UUID.test(session?.accountGeneration || "") || !Number.isInteger(session?.authenticatedAt) ||
    session.authenticatedAt > now || now - session.authenticatedAt > ACCOUNT_DELETION_REAUTH_SECONDS;
}

export function requireDeletionReauthentication(session, nowMs = Date.now()) {
  if (requiresDeletionReauthentication(session, nowMs)) {
    throw new AccountDeletionError("DELETION_REAUTH_REQUIRED", 401,
      "Bitte bestätige deine Anmeldung mit einem neuen E-Mail-Code, bevor du dein Konto löschst.");
  }
}

export function requireDeletionOrigin(req) {
  let origin;
  try {
    const supplied = req.headers.get("origin");
    if (!supplied || supplied === "null") throw new Error();
    origin = new URL(supplied);
    if (origin.origin !== new URL(req.url).origin || origin.username || origin.password ||
      origin.pathname !== "/" || origin.search || origin.hash) throw new Error();
  } catch {
    throw new AccountDeletionError("INVALID_ORIGIN", 403, "Diese Anfrage ist nicht erlaubt.");
  }
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    throw new AccountDeletionError("INVALID_ORIGIN", 403, "Diese Anfrage ist nicht erlaubt.");
  }
  if ((req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new AccountDeletionError("INVALID_DELETION", 415, "Bitte die Löschbestätigung als JSON senden.");
  }
}

export async function readDeletionConfirmation(req) {
  const length = req.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > 2048)) {
    throw new AccountDeletionError("INVALID_DELETION", 413, "Die Anfrage ist zu groß.");
  }
  if (!req.body || typeof req.body.getReader !== "function") {
    throw new AccountDeletionError("INVALID_DELETION", 400, "Die Löschbestätigung fehlt.");
  }
  const reader = req.body.getReader();
  let size = 0;
  const parts = [];
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) {
        await reader.cancel();
        throw new AccountDeletionError("INVALID_DELETION", 413, "Die Anfrage ist zu groß.");
      }
      parts.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
    let body;
    try { body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
    catch { throw new AccountDeletionError("INVALID_DELETION", 400, "Die Löschbestätigung ist ungültig."); }
    if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).length !== 2 || body.confirmation !== ACCOUNT_DELETION_CONFIRMATION ||
      body.acknowledgeSubscriptions !== true ||
      Object.keys(body).some(key => !["confirmation", "acknowledgeSubscriptions"].includes(key))) {
      throw new AccountDeletionError("INVALID_DELETION", 400,
        "Bitte die Löschbestätigung und den Hinweis zu laufenden Abos bestätigen.");
    }
    return body;
  } finally { reader.releaseLock(); }
}

export async function deleteCurrentAccount(database, session) {
  const { data, error } = await database.rpc("delete_jagdlatein_account", {
    p_email: session.email,
    p_account_generation: session.accountGeneration,
  });
  if (error?.message?.includes("JL_DELETE_ACCOUNT_MISSING")) {
    throw new AccountDeletionError("SESSION_RENEWAL_REQUIRED", 401, "Dieses Konto ist nicht mehr verfügbar.");
  }
  if (error || data?.deleted !== true) throw deletionUnavailable();
  return { deleted: true };
}
