// pages/api/auth/check.js
import prisma from "../../../lib/prisma"; // ⬅️ WICHTIG: drei ../

function safeJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}

async function hasActiveAccess(email) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();

  // AccessPass per userId = E-Mail
  const pass = await prisma.accessPass.findUnique({
    where: { userId: normalized },
  });

  if (!pass) return false;
  if (pass.status !== "active") return false;

  const now = new Date();
  if (pass.expiresAt && pass.expiresAt < now) return false;

  return true;
}

export default async function handler(req, res) {
  let email = "";

  if (req.method === "POST") {
    const body =
      typeof req.body === "string" ? safeJson(req.body) : req.body || {};
    email = (body.email || "").toString().trim().toLowerCase();
  } else {
    email = (req.query.email || "").toString().trim().toLowerCase();
  }

  if (!email) {
    return res.status(400).json({
      error: "E-Mail ungültig",
      active: false,
      hasAccess: false,
    });
  }

  const active = await hasActiveAccess(email);

  return res.status(200).json({
    active,
    hasAccess: active,
  });
}
