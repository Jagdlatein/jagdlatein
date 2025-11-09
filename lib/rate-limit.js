// lib/rate-limit.js
// Token-Bucket mit optional Upstash Redis, sonst In-Memory (pro Vercel-Instance)

const MEMORY_BUCKETS = new Map(); // key -> {tokens, resetAt}

function memAllow(key, max, windowMs) {
  const now = Date.now();
  const b = MEMORY_BUCKETS.get(key) || { tokens: max, resetAt: now + windowMs };
  if (now > b.resetAt) { b.tokens = max; b.resetAt = now + windowMs; }
  if (b.tokens <= 0) { MEMORY_BUCKETS.set(key, b); return { ok:false, resetAt:b.resetAt }; }
  b.tokens -= 1; MEMORY_BUCKETS.set(key, b); return { ok:true, resetAt:b.resetAt };
}

export async function allowRate({key, max, windowMs}) {
  // Upstash Redis (falls konfiguriert)
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const now = Math.floor(Date.now()/1000);
    const ttl = Math.ceil(windowMs/1000);
    const redisKey = `rl:${key}:${Math.floor(now/ttl)}`;
    const r = await fetch(`${url}/incr/${encodeURIComponent(redisKey)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const count = await r.json();
    if (count === 1) {
      await fetch(`${url}/expire/${encodeURIComponent(redisKey)}/${ttl}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    return { ok: count <= max };
  }
  // Fallback In-Memory
  return memAllow(key, max, windowMs);
}
