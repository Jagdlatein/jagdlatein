// pages/api/auth/check.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email } = JSON.parse(req.body || '{}');
    if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Missing email' });

    const norm = email.trim().toLowerCase();

    const customers = await stripe.customers.list({ email: norm, limit: 10 });
    if (!customers.data.length) return res.status(200).json({ active: false, reason: 'no_customer' });

    const ALLOWED_PRICES = [
      process.env.STRIPE_PRICE_MONTHLY || '',
      process.env.STRIPE_PRICE_YEARLY || ''
    ].filter(Boolean);

    const okStatuses = new Set(['active', 'trialing']); // strenger als vorher

    for (const c of customers.data) {
      const subs = await stripe.subscriptions.list({
        customer: c.id,
        status: 'all',
        expand: ['data.items.price'],
        limit: 50
      });

      const match = subs.data.find(sub => {
        if (!okStatuses.has(sub.status)) return false;
        if (!sub.items?.data?.length) return false;
        if (!ALLOWED_PRICES.length) return true;
        return sub.items.data.some(it => ALLOWED_PRICES.includes(it.price.id));
      });

      if (match) {
        const item = match.items.data[0];
        const interval = item?.price?.recurring?.interval || 'unknown';
        const periodEnd = match.current_period_end ? new Date(match.current_period_end * 1000).toISOString() : null;
        return res.status(200).json({ active: true, email: norm, plan: interval, customerId: c.id, periodEnd });
      }
    }

    return res.status(200).json({ active: false, reason: 'no_active_sub' });
  } catch (err) {
    console.error('auth/check error', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
