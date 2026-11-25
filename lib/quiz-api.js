import { createClient } from "@supabase/supabase-js";
import { accountDatabaseOptions } from "./account-session";

export const LEAGUE_COUNTRIES = new Set(["DE", "AT", "CH", "FR", "IT", "ES", "PT", "NL", "BE", "LU", "DK", "NO", "SE", "FI", "PL", "CZ", "SK", "HU", "SI", "HR", "RO", "BG", "GR", "IE", "UK"]);

export function cleanQuizUsername(value) {
  if (typeof value !== "string") return "";
  const clean = value.trim().toLowerCase();
  return clean.length > 0 && clean.length <= 40 && !/[\u0000-\u001f\u007f]/.test(clean) ? clean : "";
}

const MAX_QUIZ_BODY_BYTES = 4096;
const QUIZ_BODY_TIMEOUT_MS = 8000;
class QuizBodyError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function readQuizBody(req) {
  const invalid = () => new QuizBodyError(400, "Ungültige Anfrage.");
  const tooLarge = () => new QuizBodyError(413, "Die Quizanfrage ist zu gross.");
  const claimed = req.headers.get("content-length");
  if (claimed !== null && (!/^\d+$/.test(claimed) || Number(claimed) > MAX_QUIZ_BODY_BYTES)) throw tooLarge();
  if (typeof req.body?.getReader !== "function") throw invalid();
  let reader;
  try { reader = req.body.getReader(); } catch { throw invalid(); }
  const chunks = [];
  let size = 0, timer, cancelled = false;
  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    // Cancellation belongs to the underlying transport. Its rejection or a
    // nonsettling promise must not hold up our bounded error response.
    try { Promise.resolve(reader.cancel()).catch(() => {}); } catch {}
  };
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new QuizBodyError(408, "Die Quizanfrage hat zu lange gedauert. Bitte versuche es erneut."));
      cancel();
    }, QUIZ_BODY_TIMEOUT_MS);
  });
  try {
    for (;;) {
      const { value, done } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      if (!(value instanceof Uint8Array)) throw invalid();
      size += value.byteLength;
      if (size > MAX_QUIZ_BODY_BYTES) { cancel(); throw tooLarge(); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!body || Array.isArray(body) || typeof body !== "object") throw invalid();
    return body;
  } catch (error) {
    if (error instanceof QuizBodyError) throw error;
    throw invalid();
  } finally { clearTimeout(timer); try { reader.releaseLock(); } catch {} }
}

export function quizDatabase(session = null) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw Object.assign(new Error("Die Rangliste ist gerade nicht erreichbar."), { status: 503 });
  return createClient(url, key, accountDatabaseOptions(session));
}

export function quizFailure(error) {
  const status = [400, 401, 403, 404, 408, 409, 410, 413, 503].includes(error?.status) ? error.status : 503;
  return Response.json({ success: false, error: status === 503 ? "Die Rangliste ist gerade nicht erreichbar. Bitte versuche es erneut." : error.message },
    { status, headers: { "Cache-Control": "private, no-store" } });
}
