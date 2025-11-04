// pages/api/paypal/capture-order.js
import { sendMail } from '../../../lib/mail';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { orderID } = JSON.parse(req.body || '{}');
    if (!orderID) return res.status(400).json({ error: 'Missing orderID' });

    // Access Token holen
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
    const accessRes = await fetch(`${process.env.PAYPAL_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials'
    });
    const access = await accessRes.json();

    // Capture
    const capRes = await fetch(`${process.env.PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${access.access_token}`, 'Content-Type': 'application/json' }
    });
    const capture = await capRes.json();

    // E-Mail des Käufers (falls verfügbar)
    const email =
      capture?.payer?.email_address ||
      capture?.purchase_units?.[0]?.shipping?.address?.email_address ||
      null;

    if (capture?.status === 'COMPLETED' && email) {
      await sendMail({
        to: email,
        subject: 'Jagdlatein – Zugang aktiviert',
        html: `
          <div style="font-family:system-ui,Arial">
            <h2>Danke für deinen Kauf</h2>
            <p>Dein Zugang ist aktiv. Logge dich mit deiner E-Mail ein:</p>
            <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://jagdlatein.de'}/login">Zum Login</a></p>
            <p>Weidmannsheil!</p>
          </div>
        `
      });
    }

    res.status(200).json({ capture });
  } catch (e) {
    console.error('PayPal capture error', e);
    res.status(500).json({ error: 'PayPal capture failed' });
  }
}
