// pages/api/stripe/checkout.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { plan } = JSON.parse(req.body || '{}');
    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const price = plan === 'monthly' ? process.env.STRIPE_PRICE_MONTHLY : process.env.STRIPE_PRICE_YEARLY;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jagdlatein.de'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jagdlatein.de'}/cancel`,
      allow_promotion_codes: true,
      automatic_tax: { enabled: false },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error', err);
    return res.status(500).json({ error: 'Stripe error' });
  }
}
