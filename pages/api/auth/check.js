// pages/api/auth/check.js

function isPaidEmail(email) {
  const raw = process.env.PAID_EMAILS || '';
  const allowed = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email.toLowerCase());
}

export default async function handler(req, res) {
  let email = '';

  if (req.method === 'POST') {
    // Kommt vom Frontend mit body: JSON.stringify({ email })
    const body = typeof req.body === 'string' ? safeJson(req.body) : req.body || {};
    email = (body.email || '').toString().trim().toLowerCase();
  } else {
    // Fallback für GET ?email=...
    email = (req.query.email || '').toString().trim().toLowerCase();
  }

  if (!email) {
    return res.status(400).json({
      error: 'E-Mail ungültig',
      active: false,
      hasAccess: false,
    });
  }

  const active = isPaidEmail(email);

  return res.status(200).json({
    active,          // für neue Komponenten (RequireAccess mit data.active)
    hasAccess: active, // für evtl. alten Code
  });
}

function safeJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}
