import { createClient } from "@supabase/supabase-js";

export const LEAGUE_COUNTRIES = new Set(["DE", "AT", "CH", "FR", "IT", "ES", "PT", "NL", "BE", "LU", "DK", "NO", "SE", "FI", "PL", "CZ", "SK", "HU", "SI", "HR", "RO", "BG", "GR", "IE", "UK"]);

export function cleanQuizUsername(value) {
  if (typeof value !== "string") return "";
  const clean = value.trim().toLowerCase();
  return clean.length > 0 && clean.length <= 40 && !/[\u0000-\u001f\u007f]/.test(clean) ? clean : "";
}

export async function readQuizBody(req) {
  try {
    const body = await req.json();
    if (!body || Array.isArray(body) || typeof body !== "object") throw new Error();
    return body;
  } catch { throw Object.assign(new Error("Ungültige Anfrage."), { status: 400 }); }
}

export function quizDatabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw Object.assign(new Error("Die Rangliste ist gerade nicht erreichbar."), { status: 503 });
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function quizFailure(error) {
  const status = [400, 401, 403, 404, 409, 410, 503].includes(error?.status) ? error.status : 503;
  return Response.json({ success: false, error: status === 503 ? "Die Rangliste ist gerade nicht erreichbar. Bitte versuche es erneut." : error.message },
    { status, headers: { "Cache-Control": "private, no-store" } });
}
