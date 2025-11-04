export default async function handler(req, res) {
  res.status(200).json({
    ok: true,
    time: new Date().toISOString(),
    stripe: !!process.env.STRIPE_SECRET_KEY,
    site: process.env.NEXT_PUBLIC_SITE_URL || null
  });
}
