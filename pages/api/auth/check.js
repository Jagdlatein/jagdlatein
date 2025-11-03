// pages/api/auth/check.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email } = JSON.parse(req.body || '{}');
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Missing email' });
    }

    const norm = email.trim().toLowerCase();

    // 1) Customer zur E-Mail finden
    const customers = await stripe.customers.list({ email: norm, limit: 5 });
    if (!customers.data.length) {
      return res.status(200).json({ active: false, reason: 'no_customer' });
    }

    // Preis-IDs (optional: falls du nur bestimmte Preise zulassen willst)
    const ALLOWED_PRICES = [
      process.env.STRIPE_PRICE_MONTHLY || '',
      process.env.STRIPE_PRICE_YEARLY || ''
    ].filter(Boolean);

    // 2) Für alle gefundenen Kunden schauen, ob ein aktives/trialing Abo existiert
    for (const c of customers.data) {
      const subs = await stripe.subscriptions.list({
        customer: c.id,
        status: 'all', // wir filtern gleich selber
        expand: ['data.items.price.product'],
        limit: 20
      });

      const match = subs.data.find(sub => {
        const isActive =
          ['active', 'trialing', 'past_due', 'unpaid'].includes(sub.status) && // „unpaid/past_due“ optional erlauben
          sub.items?.data?.length > 0;

        if (!isActive) return false;

        if (ALLOWED_PRICES.length === 0) return true; // wenn nicht gesetzt, alles ok

        // Mindestens eine Position mit erlaubter Preis-ID
        return sub.items.data.some(it => ALLOWED_PRICES.includes(it.price.id));
      });

      if (match) {
        // Kleines Resultat bauen
        const plan = match.items.data[0]?.price?.recurring?.interval || 'unknown';
        return res.status(200).json({
          active: true,
          email: norm,
          plan,
          customerId: c.id
        });
      }
    }

    return res.status(200).json({ active: false, reason: 'no_active_sub' });
  } catch (err) {
    console.error('auth/check error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
