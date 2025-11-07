// pages/api/admin/login.js
export const config = { api: { bodyParser: true }, runtime: "nodejs" };

import crypto from "node:crypto";

function sign(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { user, pass } = req.body || {};
  const wantUser = (process.env.ADMIN_USER || "").trim();
  const wantPass = (process.env.ADMIN_PASS || "").trim();
  const secret   = (process.env.APP_SECRET || "").trim();

  if (!wantPass || !secret) {
    return res.status(500).json({ error: "Server misconfigured (ADMIN_PASS/APP_SECRET)" });
  }
  if (wantUser && String(user || "").trim() !== wantUser) {
    return res.status(401).json({ error: "Unauthorized (user)" });
  }
  if (String(pass || "").trim() !== wantPass) {
    return res.status(401).json({ error: "Unauthorized (password)" });
  }

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 8; // 8h
  const token = sign({ u: user || "admin", exp }, secret);

  // Set-Cookie (HttpOnly, Secure)
  res.setHeader("Set-Cookie", [
    `admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 8}`,
  ]);
  return res.status(200).json({ ok: true });
}
