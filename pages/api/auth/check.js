// pages/api/admin/auth-check.js
export const config = { api: { bodyParser: true }, runtime: "nodejs" };

function getBearer(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : "";
}

export default function handler(req, res) {
  const sent = getBearer(req);
  const want = (process.env.ADMIN_PASS || "").trim();
  return res.status(200).json({
    ok: Boolean(sent && want && sent === want),
    has_admin_pass: Boolean(want),
    header_present: Boolean(req.headers.authorization),
    sent_len: sent ? sent.length : 0,
    match: sent === want
  });
}
