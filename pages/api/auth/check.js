// pages/api/auth/check.js
import prisma from "../../../lib/prisma"; // wie in request-code.js

function ok(res, data) { return res.status(200).json(data); }
function bad(res, msg) { return res.status(400).json({ error: msg }); }

export default async function handler(req, res) {
  if (req.method !== "GET") return bad(res, "GET required");

  const { email } = req.query || {};
  if (!email || typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return bad(res, "E-Mail ungültig");
  }

  // TODO: HIER deine echte Bezahl-Logik eintragen.
  // Ich mache dir ein Beispiel mit einer fiktiven Tabelle "paidUser":
  //
  //   model PaidUser {
  //     id     Int    @id @default(autoincrement())
  //     email  String @unique
  //     active Boolean @default(true)
  //   }
  //
  // Passe den Tabellen-/Feldnamen an dein Schema an!

  let hasAccess = false;

  try {
    const paid = await prisma.paidUser.findFirst({
      where: {
        email: email.toLowerCase(),
        active: true,
      },
    });

    hasAccess = !!paid;
  } catch (e) {
    // Prisma-Fehler lieber als 500 zurückgeben
    console.error("check error", e);
    return res.status(500).json({ error: "Datenbankfehler" });
  }

  return ok(res, { hasAccess });
}
