// pages/api/stripe/webhook.js
import Stripe from 'stripe';
import { sendMail } from '../../../lib/mail';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  const sig = req.headers['stripe-signature'];

  const buf = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook verify failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_details?.email;

      if (email) {
        await sendMail({
          to: email,
          subject: 'Jagdlatein – Zugang aktiviert',
          html: `
            <div style="font-family:system-ui,Arial">
              <h2>Willkommen bei Jagdlatein</h2>
              <p>Dein Zugang ist aktiv. Logge dich jetzt mit deiner E-Mail ein:</p>
              <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://jagdlatein.de'}/login">Zum Login</a></p>
              <p>Viel Erfolg & Waidmannsheil!</p>
            </div>
          `
        });
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook handler error', err);
    res.status(500).send('Webhook handler failed');
  }
}
// ersetze die Hilfsfunktion in /api/stripe/webhook/route.ts
import { randomBytes } from "crypto";

function cryptoRandom() {
  return randomBytes(16).toString("hex");
}
