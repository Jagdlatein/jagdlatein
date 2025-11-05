// /src/app/api/admin/import/route.js
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, status: "import-endpoint-ready" });
}

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Admin-Import ist noch nicht konfiguriert." },
    { status: 501 }
  );
}
