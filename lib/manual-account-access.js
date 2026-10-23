import { normalizeAccountEmail } from "./account-session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NONE = Object.freeze({ paid: false, paidUntil: null, accessType: "none", trialUntil: null, source: "none", status: null });
function unavailable() { return Object.assign(new Error("Kontozugriff derzeit nicht verfügbar."), { status: 503 }); }
function timestamp(value) {
  return typeof value === "string" && value.length <= 64 && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null;
}

// This is independent of Apple/PayPal: a courtesy interval never represents a
// payment, subscription, free trial, renewal instruction or administrator role.
export function manualAccountAccessFromRow(row, email, nowMs = Date.now()) {
  const normalized = normalizeAccountEmail(email);
  if (!normalized || !Number.isFinite(nowMs)) throw unavailable();
  if (row === null) return NONE;
  const owner = row?.owner;
  const starts = timestamp(row?.starts_at), expires = timestamp(row?.expires_at);
  if (!row || typeof row !== "object" || Array.isArray(row) || !owner || Array.isArray(owner) ||
      !UUID.test(row.account_generation || "") || owner.account_generation !== row.account_generation ||
      normalizeAccountEmail(owner.email) !== normalized || starts === null || expires === null || expires <= starts) throw unavailable();
  if (starts > nowMs || expires <= nowMs) return NONE;
  return { paid: true, paidUntil: new Date(expires).toISOString(), accessType: "courtesy", trialUntil: null,
    source: "manual_grant", status: null };
}

export async function resolveManualAccountAccess(database, email, { nowMs = Date.now() } = {}) {
  const normalized = normalizeAccountEmail(email);
  if (!normalized) throw unavailable();
  // The FK joins only the currently existing account generation. A removed
  // account's grant is deleted in the same transaction; same-email recreation
  // cannot inherit it. No profile is ever inserted or modified here.
  const { data, error } = await database.from("account_access_grants")
    .select("account_generation,starts_at,expires_at,owner:userprofile!inner(email,account_generation)")
    .ilike("owner.email", normalized.replace(/[\\%_]/g, "\\$&")).maybeSingle();
  if (error) {
    // An environment without this optional migration keeps its existing
    // provider-only behavior. Other database errors must never grant access.
    if (["42P01", "PGRST205"].includes(error.code)) return NONE;
    throw unavailable();
  }
  return manualAccountAccessFromRow(data, normalized, nowMs);
}
