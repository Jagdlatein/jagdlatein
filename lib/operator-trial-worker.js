import { createHash, timingSafeEqual } from "node:crypto";

// A separate key authorizes only the bounded notification worker. Account
// session keys never authorize scheduled work and are never reused here.
export function isOperatorTrialWorkerAuthorized(req, env = process.env) {
  // Copying a key from a text file can include surrounding whitespace. HTTP
  // Authorization values normalize it too; internal whitespace stays invalid.
  const secret = typeof env.CRON_SECRET === "string" ? env.CRON_SECRET.trim() : null;
  if (env.NODE_ENV !== "production" || env.VERCEL_ENV !== "production" || env.JL_TEST_ENVIRONMENT ||
      typeof secret !== "string" || !/^[A-Za-z0-9_-]{32,256}$/.test(secret)) return false;
  const header = req.headers.get("authorization") || "";
  if (header.length > 300) return false;
  const digest = value => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(header), digest(`Bearer ${secret}`));
}
