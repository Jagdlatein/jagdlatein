// /pages/api/paypal/test-token.js
import { paypalBase, paypalAccessToken } from "./_base";

export default async function handler(req, res) {
  try {
    const { env, base } = paypalBase();

    const token = await paypalAccessToken();

    return res.status(200).json({
      ok: true,
      env,
      base,
      tokenPreview: token ? token.slice(0, 12) + "..." : null,
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e.message || "paypal_token_error",
    });
  }
}
