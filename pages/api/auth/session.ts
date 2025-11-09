// pages/api/auth/session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";

function set(res: NextApiResponse, name: string, value: string, maxAge = 60 * 60 * 24 * 40) {
  const c = cookie.serialize(name, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  });
  res.setHeader("Set-Cookie", [...(res.getHeader("Set-Cookie") as string[] || []), c]);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "DELETE") {
    ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach((n) =>
      set(res, n, "", 0)
    );
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "POST") return res.status(405).end();

  const { email, adminToken } = req.body || {};

  // Admin
  if (adminToken && process.env.ADMIN_PASS && adminToken === process.env.ADMIN_PASS) {
    if (email) set(res, "jl_email", encodeURIComponent(email));
    set(res, "jl_admin", "1");
    set(res, "jl_session", "1");
    return res.status(200).json({ ok: true, mode: "admin" });
  }

  if (!email) return res.status(400).json({ error: "E-Mail fehlt" });

  // Deinen bestehenden Check aufrufen (interner Call)
  const base = process.env.NEXT_PUBLIC_SITE_URL || `http://${req.headers.host}`;
  const r = await fetch(`${base}/api/auth/check?email=${encodeURIComponent(email)}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!r.ok) return res.status(403).json({ error: "Kein aktives Abo" });

  set(res, "jl_email", encodeURIComponent(email));
  set(res, "jl_paid", "1");
  set(res, "jl_session", "1");
  return res.status(200).json({ ok: true, mode: "user" });
}
