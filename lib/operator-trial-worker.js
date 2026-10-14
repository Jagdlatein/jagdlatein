import { createHash, timingSafeEqual } from "node:crypto";

// A separate key authorizes only the bounded notification worker. Account
// session keys never authorize scheduled work and are never reused here.
export function isOperatorTrialWorkerAuthorized(req, env = process.env) {
  const secret = env.CRON_SECRET;
  if (env.NODE_ENV !== "production" || env.VERCEL_ENV !== "production" || env.JL_TEST_ENVIRONMENT ||
      typeof secret !== "string" || !/^[A-Za-z0-9_-]{32,256}$/.test(secret)) return false;
  const header = req.headers.get("authorization") || "";
  if (header.length > 300) return false;
  const digest = value => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(header), digest(`Bearer ${secret}`));
}
