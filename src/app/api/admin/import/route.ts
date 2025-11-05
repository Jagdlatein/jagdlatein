// /src/app/api/admin/import/route.ts
import { NextResponse } from "next/server";

// Platzhalter-Endpoint, damit der Build nicht an fehlenden Imports scheitert.
// (Später hier echte Admin-Import-Logik + Auth/DB einsetzen.)

export async function GET() {
  return NextResponse.json({ ok: true, status: "import-endpoint-ready" });
}

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Admin-Import ist noch nicht konfiguriert." },
    { status: 501 }
  );
}
