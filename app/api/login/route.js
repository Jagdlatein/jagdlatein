// app/api/login/route.js
import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma"; // ggf. Pfad anpassen

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

  // falls expiresAt gesetzt ist: prüfen
  if (pass.expiresAt && pass.expiresAt < now) {
    return false;
  }

  return true;
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json(
      { success: false, message: "Ungültige Anfrage" },
      { status: 400 }
    );
  }

  const email = body?.email?.toString().trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      { success: false, message: "E-Mail fehlt" },
      { status: 400 }
    );
  }

  const allowed = await hasActiveAccess(email);

  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Für diese E-Mail ist (noch) kein aktiver Zugang hinterlegt. Bitte zuerst über PayPal kaufen.",
      },
      { status: 403 }
    );
  }

  // hier könnte man später ein echtes JWT verwenden
  const token = "token-" + Date.now();

  return NextResponse.json(
    {
      success: true,
      token,
      email,
    },
    { status: 200 }
  );
}

export function GET() {
  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 }
  );
}
