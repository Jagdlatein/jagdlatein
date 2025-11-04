// scripts/predeploy.mjs
const must = (key) => {
  const v = process.env[key];
  if (!v || String(v).trim() === '') {
    throw new Error(`Missing env var: ${key}`);
  }
};

// Nur warnen, nicht hart abbrechen:
const should = (key) => {
  const v = process.env[key];
  if (!v || String(v).trim() === '') {
    console.warn(`Warning: optional env var missing: ${key}`);
  }
};

try {
  // Basis
  must('NEXT_PUBLIC_SITE_URL');

  // Stripe (für Auto-Zugang mindestens Secret nötig; Preise optional wenn Payment Links)
  should('STRIPE_PRICE_MONTHLY');
  should('STRIPE_PRICE_YEARLY');
  must('STRIPE_SECRET_KEY');

  // Webhook (optional – nur falls benutzt)
  if (process.env.ENABLE_STRIPE_WEBHOOK === 'true') {
    must('STRIPE_WEBHOOK_SECRET');
  } else {
    console.warn('Info: Stripe webhook disabled (ENABLE_STRIPE_WEBHOOK!=true)');
  }

  // PayPal (optional, Buttons funktionieren auch ohne Server-Capture)
  if (process.env.ENABLE_PAYPAL === 'true') {
    must('PAYPAL_CLIENT_ID');
    must('PAYPAL_SECRET');
    must('PAYPAL_BASE'); // https://api-m.paypal.com oder sandbox
  } else {
    console.warn('Info: PayPal disabled (ENABLE_PAYPAL!=true)');
  }

  // Mail (optional)
  if (process.env.ENABLE_SMTP === 'true') {
    must('SMTP_HOST'); must('SMTP_PORT'); must('SMTP_USER'); must('SMTP_PASS');
    should('MAIL_FROM');
  } else {
    console.warn('Info: SMTP disabled (ENABLE_SMTP!=true)');
  }

  // Admin-Token (optional)
  should('NEXT_PUBLIC_ADMIN_TOKEN');

  console.log('✅ Predeploy checks passed.');
} catch (e) {
  console.error('❌ Predeploy check failed:', e.message);
  process.exit(1);
}
