/* Read-only sandbox inspection. This file never reads .env or production keys. */
const fs = require('node:fs');
const path = require('node:path');
const API = 'https://api-m.sandbox.paypal.com';
const REQUIRED_EVENTS = [
  'BILLING.SUBSCRIPTION.ACTIVATED', 'BILLING.SUBSCRIPTION.UPDATED',
  'BILLING.SUBSCRIPTION.CANCELLED', 'BILLING.SUBSCRIPTION.SUSPENDED',
  'BILLING.SUBSCRIPTION.EXPIRED', 'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
  'PAYMENT.SALE.COMPLETED', 'PAYMENT.SALE.REFUNDED', 'PAYMENT.SALE.REVERSED',
];
const LIVE_PLANS = new Set(['P-9XU38461YG7706134NESJQWA', 'P-0SN76115U1905643NNLBEIGQ']);
const PUBLIC_HOSTS = new Set(['jagdlatein.vercel.app', 'jagdlatein.de', 'www.jagdlatein.de']);
const fields = ['version', 'apiBase', 'testUrl', 'publicUrl', 'testSupabaseUrl', 'publicSupabaseUrl',
  'clientId', 'regularPlanId', 'trialPlanId', 'webhookId', 'separateDatabaseConfirmed', 'mailSinkConfirmed'];
function origin(value, label) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`${label} fehlt oder ist ungültig.`); }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || url.port)
    throw new Error(`${label} muss eine reine HTTPS-Adresse ohne Zugangsdaten sein.`);
  return url;
}
function validateConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config) || config.version !== 1 ||
      Object.keys(config).some(key => !fields.includes(key)))
    throw new Error('Die Konfiguration ist ungültig. Secrets gehören nicht in diese Datei.');
  if (config.apiBase !== API) throw new Error('Gesperrt: Ausschließlich die PayPal-Sandbox-API ist erlaubt.');
  const testUrl = origin(config.testUrl, 'Adresse der Testversion');
  const publicUrl = origin(config.publicUrl, 'Adresse der öffentlichen App');
  if (!testUrl.hostname.endsWith('.vercel.app') || PUBLIC_HOSTS.has(testUrl.hostname) || testUrl.origin === publicUrl.origin)
    throw new Error('Gesperrt: Eine eigene Vercel-Testadresse wird benötigt; die öffentliche App ist keine Testversion.');
  const testDb = origin(config.testSupabaseUrl, 'Testdatenbank');
  const publicDb = origin(config.publicSupabaseUrl, 'Öffentliche Datenbank');
  if (![testDb, publicDb].every(url => /^[a-z0-9]{20}\.supabase\.co$/.test(url.hostname)) || testDb.origin === publicDb.origin ||
      config.separateDatabaseConfirmed !== true)
    throw new Error('Gesperrt: Getrennte Supabase-Projekte bestätigen und beide Projektadressen eintragen.');
  if (config.mailSinkConfirmed !== true) throw new Error('Gesperrt: Die Testversion braucht einen isolierten Mail-Sink.');
  if (typeof config.clientId !== 'string' || !/^[A-Za-z0-9_-]{20,256}$/.test(config.clientId))
    throw new Error('Die Client-ID der Sandbox-App fehlt.');
  for (const key of ['regularPlanId', 'trialPlanId']) {
    if (!/^P-[A-Z0-9]{24}$/.test(config[key] || '') || LIVE_PLANS.has(config[key]))
      throw new Error('Gesperrt: Eigenständige Sandbox-Plan-IDs werden benötigt.');
  }
  if (config.regularPlanId === config.trialPlanId || !/^[A-Z0-9]{8,64}$/.test(config.webhookId || ''))
    throw new Error('Zwei unterschiedliche Sandbox-Pläne und die Sandbox-Webhook-ID eintragen.');
  return config;
}
function cycleIs(cycle, tenure, sequence, unit, count, cycles, amount) {
  const price = cycle?.pricing_scheme?.fixed_price;
  // PayPal may omit pricing_scheme for a free trial.
  const priceMatches = tenure === 'TRIAL' && cycle?.pricing_scheme == null ||
    price?.currency_code === 'EUR' && typeof price.value === 'string' && /^\d+(?:\.\d{1,3})?$/.test(price.value) && Number(price.value) === amount;
  return cycle?.tenure_type === tenure && cycle.sequence === sequence && cycle.total_cycles === cycles &&
    cycle.frequency?.interval_unit === unit && cycle.frequency.interval_count === count && priceMatches &&
    !cycle.pricing_scheme?.tiers && !cycle.pricing_scheme?.pricing_model;
}
function validatePlan(plan, id, trial) {
  const cycles = plan?.billing_cycles;
  if (plan?.id !== id || plan.status !== 'ACTIVE' || !Array.isArray(cycles) || cycles.length !== (trial ? 2 : 1) ||
      !cycleIs(cycles[trial ? 1 : 0], 'REGULAR', trial ? 2 : 1, 'MONTH', 1, 0, 5) ||
      trial && !cycleIs(cycles[0], 'TRIAL', 1, 'DAY', 3, 1, 0) ||
      Number(plan.payment_preferences?.setup_fee?.value || 0) !== 0 || Number(plan.taxes?.percentage || 0) !== 0 ||
      plan.quantity_supported === true)
    throw new Error('Die Sandbox-Planbedingungen passen nicht zu 3 Tagen kostenlos beziehungsweise 5 EUR monatlich.');
  return true;
}
async function requestJson(url, options, allowedOrigin, fetchFn) {
  if (new URL(url).origin !== allowedOrigin) throw new Error('Unerwartetes Netzwerkziel blockiert.');
  let response;
  try { response = await fetchFn(url, { ...options, redirect: 'manual', signal: AbortSignal.timeout(15000) }); }
  catch { throw new Error('Sandbox-Prüfung derzeit nicht erreichbar.'); }
  if (!response.ok) throw new Error(`Sandbox-Prüfung fehlgeschlagen (HTTP ${response.status}); Antwortinhalt wird nicht ausgegeben.`);
  try { return await response.json(); } catch { throw new Error('Ungültige Sandbox-Antwort; Inhalt wird nicht ausgegeben.'); }
}
async function inspect(config, secrets = {}, fetchFn = fetch) {
  validateConfig(config); // Must happen before credentials or network access.
  if (!secrets.paypalSecret || !secrets.databaseKey) throw new Error('Sandbox-Secret und Schlüssel der separaten Testdatenbank fehlen.');
  const token = await requestJson(`${API}/v1/oauth2/token`, { method: 'POST', headers: {
    Authorization: `Basic ${Buffer.from(`${config.clientId}:${secrets.paypalSecret}`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }, body: 'grant_type=client_credentials' }, API, fetchFn);
  if (typeof token.access_token !== 'string' || !token.access_token) throw new Error('Kein gültiger Sandbox-Zugangstoken.');
  const paypalHeaders = { Authorization: `Bearer ${token.access_token}` };
  const regular = await requestJson(`${API}/v1/billing/plans/${config.regularPlanId}`, { headers: paypalHeaders }, API, fetchFn);
  const trial = await requestJson(`${API}/v1/billing/plans/${config.trialPlanId}`, { headers: paypalHeaders }, API, fetchFn);
  validatePlan(regular, config.regularPlanId, false); validatePlan(trial, config.trialPlanId, true);
  const webhook = await requestJson(`${API}/v1/notifications/webhooks/${config.webhookId}`, { headers: paypalHeaders }, API, fetchFn);
  const enabled = webhook?.event_types?.map(event => event.name) || [];
  if (webhook.id !== config.webhookId || webhook.url !== `${config.testUrl.replace(/\/$/, '')}/api/paypal/webhook` ||
      !enabled.includes('*') && REQUIRED_EVENTS.some(name => !enabled.includes(name)))
    throw new Error('Der Sandbox-Webhook zeigt nicht auf die Testversion oder ihm fehlen Aboereignisse.');
  const dbUrl = config.testSupabaseUrl.replace(/\/$/, '');
  const dbHeaders = { apikey: secrets.databaseKey, Authorization: `Bearer ${secrets.databaseKey}` };
  for (const [table, columns] of [
    ['paypal_subscriptions', 'subscription_id,trial_started_at,trial_until,paid_until,status,review_reason'],
    ['paypal_subscription_payments', 'subscription_id,payment_id,status,period_until'],
    ['userprofile', 'email,is_premium,is_admin'],
    ['login_codes', 'email,code_hash,expires_at,attempts,requested_at'],
  ]) {
    const result = await requestJson(`${dbUrl}/rest/v1/${table}?select=${columns}&limit=0`, { headers: dbHeaders }, dbUrl, fetchFn);
    if (!Array.isArray(result) || result.length) throw new Error('Die Testdatenbank-Strukturprüfung lieferte unerwartete Daten.');
  }
  const testUrl = config.testUrl.replace(/\/$/, '');
  const checkout = await requestJson(`${testUrl}/api/paypal/checkout-config`, {}, testUrl, fetchFn);
  if (checkout.planId !== config.trialPlanId || checkout.trialDays !== 3 || checkout.amount !== '5.00' || checkout.currency !== 'EUR')
    throw new Error('Die bereitgestellte Testversion bietet nicht den geprüften Sandbox-Testtarif an.');
  return { checkedAt: new Date().toISOString(), mode: 'sandbox-read-only', setup: 'passed',
    checks: ['separate-test-address', 'separate-database', 'sandbox-credentials', 'regular-plan', 'three-day-trial-plan',
      'sandbox-webhook-target-and-events', 'empty-database-shape-queries', 'deployed-checkout-config'],
    providerLifecycle: 'pending', paymentsCreated: 0, databaseWrites: 0,
    note: 'Die Einrichtung ist geprüft. Zustimmung, tatsächliche Abbuchung, Kündigung und Zahlungsausfall sind damit noch nicht nachgewiesen.' };
}
async function main() {
  const [, , mode, configPath, reportPath] = process.argv;
  if (!['--validate', '--check'].includes(mode) || !configPath) throw new Error('Den PowerShell-Helfer setup-paypal-sandbox.ps1 verwenden.');
  let config;
  try { config = JSON.parse(fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, '')); }
  catch { throw new Error('Zuerst die Sandbox-Konfigurationsvorlage außerhalb des Git-Projekts ausfüllen.'); }
  validateConfig(config);
  if (mode === '--validate') { console.log('Isolierte Ziele lokal geprüft; keine Netzwerkaufrufe.'); return; }
  const report = await inspect(config, { paypalSecret: process.env.JL_SANDBOX_PAYPAL_SECRET,
    databaseKey: process.env.JL_SANDBOX_DATABASE_KEY });
  if (reportPath) fs.writeFileSync(path.resolve(reportPath), JSON.stringify(report, null, 2));
  console.log('Sandbox-Einrichtung rein lesend geprüft. Echte Zahlungsabläufe bleiben separat zu prüfen.');
}
// Stdout keeps Windows PowerShell 5.1 from treating a safe prerequisite message
// as an unhandled NativeCommandError before the PowerShell wrapper writes its report.
if (require.main === module) main().catch(error => { console.log(error.message); process.exitCode = 1; });
module.exports = { API, REQUIRED_EVENTS, validateConfig, validatePlan, inspect };
