export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    // RAW BODY einlesen
    const raw = await req.text().catch(e => "RAW_ERROR:" + e.toString());

    // Alle Header sammeln
    const headers = Object.fromEntries(req.headers.entries());

    // Alles loggen
    console.log("📥 RAW:", raw);
    console.log("📥 HEADERS:", headers);

    // Immer Erfolg melden - nur Debug
    return NextResponse.json({ ok: true, raw, headers });
  } catch (err) {
    console.error("❌ DEBUG ERROR:", err);
    return NextResponse.json(
      { error: err.toString() },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ ok: true });
}
