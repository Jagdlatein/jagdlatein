// Read-only deployment check. Never prints keys or customer records.
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
require('@next/env').loadEnvConfig(root, false, { info() {}, error() {} });

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const missing = [];
if (!url) missing.push('SUPABASE_URL');
if (!key) missing.push('SUPABASE_SERVICE_ROLE_KEY');
if (Buffer.byteLength((process.env.JL_SESSION_SECRET || '').trim(), 'utf8') < 32) missing.push('JL_SESSION_SECRET (mindestens 32 Bytes)');
if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) missing.push('NEXT_PUBLIC_PAYPAL_CLIENT_ID');
if (!process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID) missing.push('NEXT_PUBLIC_PAYPAL_PLAN_ID');
if (!(process.env.PAYPAL_SECRET || process.env.PAYPAL_CLIENT_SECRET)) missing.push('PAYPAL_SECRET (alternativ PAYPAL_CLIENT_SECRET)');
if (!process.env.PAYPAL_WEBHOOK_ID) missing.push('PAYPAL_WEBHOOK_ID');
if (missing.length) {
  console.error('Lokal fehlen: ' + missing.join(', '));
  console.error('Das sagt nichts über die Variablen in Vercel aus. Keine Netzwerkprüfung ausgeführt.');
  process.exit(1);
}
if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_ID !== process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
  console.error('PAYPAL_CLIENT_ID und NEXT_PUBLIC_PAYPAL_CLIENT_ID müssen zur selben App gehören und hier identisch sein. Keine Netzwerkprüfung ausgeführt.');
  process.exit(1);
}
const offeredPlan = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID.trim();
const trialPlan = (process.env.NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID || '').trim();
const retainedTrialPlans = (process.env.PAYPAL_TRIAL_PLAN_IDS || '').split(',').map(value => value.trim()).filter(Boolean);
const allowedPlans = (process.env.PAYPAL_PLAN_IDS || [offeredPlan, trialPlan].filter(Boolean).join(',')).split(',').map(value => value.trim());
if (!offeredPlan || !allowedPlans.includes(offeredPlan)) {
  console.error('Der öffentliche PayPal-Plan ist nicht in PAYPAL_PLAN_IDS freigegeben. Keine Netzwerkprüfung ausgeführt.');
  process.exit(1);
}
if (trialPlan && (!/^P-[A-Z0-9]{6,64}$/.test(trialPlan) || !allowedPlans.includes(trialPlan))) {
  console.error('Der Testabo-Plan ist ungültig oder nicht in PAYPAL_PLAN_IDS freigegeben. Keine Netzwerkprüfung ausgeführt.');
  process.exit(1);
}
if (retainedTrialPlans.some(value => !/^P-[A-Z0-9]{6,64}$/.test(value) || !allowedPlans.includes(value))) {
  console.error('Ein bestehender Testabo-Plan ist ungültig oder nicht in PAYPAL_PLAN_IDS freigegeben. Keine Netzwerkprüfung ausgeführt.');
  process.exit(1);
}
try {
  const api = new URL(process.env.PAYPAL_API_BASE || 'https://api-m.paypal.com');
  if (!['https://api-m.paypal.com', 'https://api-m.sandbox.paypal.com', 'https://api.paypal.com', 'https://api.sandbox.paypal.com'].includes(api.origin) ||
      api.pathname !== '/' || api.username || api.password || api.search || api.hash) throw new Error();
} catch { console.error('PAYPAL_API_BASE ist ungültig. Keine Netzwerkprüfung ausgeführt.'); process.exit(1); }
let base;
try {
  base = new URL(url);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || !['','/'].includes(base.pathname)) throw new Error();
} catch { console.error('Die konfigurierte Supabase-URL ist ungültig.'); process.exit(1); }
const headers = { apikey: key, Authorization: 'Bearer ' + key };
async function read(path, options = {}) {
  const response = await fetch(new URL('/rest/v1/' + path, base), {
    ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(10000),
  });
  const data = await response.json();
  return { response, data };
}
const tables = {
  quiz_identities: 'account_email,username,country',
  verified_quiz_scores: 'account_email,username,country,total_points,rounds',
  activity_results: 'account_email,event_id,verification',
  paypal_subscriptions: 'subscription_id,account_email,status,paid_until,verified_at,review_reason' +
    (trialPlan || retainedTrialPlans.length ? ',plan_id,trial_started_at,trial_until' : ''),
  paypal_subscription_payments: 'subscription_id,payment_id,status,paid_at,period_until',
};
let failed = false;
for (const [table,columns] of Object.entries(tables)) {
  try {
    const { response, data } = await read(table + '?select=' + columns + '&limit=0');
    if (!response.ok || !Array.isArray(data) || data.length !== 0) throw new Error();
    console.log('OK: ' + table + ' ist mit den benötigten Spalten erreichbar (keine Kundendaten gelesen).');
  } catch { failed = true; console.error('FEHLER: ' + table + ' — Migration, Berechtigung oder Verbindung prüfen.'); }
}
try {
  const { response, data } = await read('rpc/read_ranked_quiz', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_email: 'readiness-probe@example.invalid', p_round_id: randomUUID() }),
  });
  if (response.ok || data?.code !== 'P0001' || !data?.message?.includes('JL_QUIZ_MISSING')) throw new Error();
  console.log('OK: geschützter Runden-Lesezugriff vorhanden, unbekannte Runde korrekt abgewiesen.');
} catch { failed = true; console.error('FEHLER: Runden-Lesefunktion — Migration oder Berechtigung prüfen.'); }
console.log('PayPal-Webhooks und Vercel-Variablen weiterhin im jeweiligen Projekt prüfen; es wurde keine Zahlung ausgelöst.');
process.exitCode = failed ? 1 : 0;
