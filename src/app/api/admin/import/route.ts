// Temporäre Platzhalter-Route, damit der Build nicht fehlschlägt.
// TODO: Eigene Import-Logik + echte Auth/Prisma einbauen.

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Admin-Import ist noch nicht konfiguriert." },
    { status: 501 }
  );
}

export async function GET() {
  return NextResponse.json({ ok: true, status: "import-endpoint-ready" });
}
