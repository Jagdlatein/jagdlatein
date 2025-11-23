// app/api/paypal/webhook/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Build Mode aktiv, wenn ENV fehlt
const BUILD_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE;

// Supabase NICHT in Build-Phase initialisieren!
let supabase = null;

if (!BUILD_MODE) {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
  );
}

export async function POST(req) {
  try {
    const body = await req.json();

    const eventType = body?.event_type;
    const payerEmail = body?.resource?.payer?.email_address;

    if (!payerEmail) {
      return NextResponse.json({ error: "Keine Email." }, { status: 400 });
    }

    // Im Build nur Dummy zurückgeben
    if (BUILD_MODE) {
      return NextResponse.json({ ok: true, build: true });
    }

    // Nur abgeschlossene Zahlungen akzeptieren
    if (eventType !== "PAYMENT.CAPTURE.COMPLETED") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Premium-Benutzer erstellen/aktualisieren
    const { error } = await supabase
      .from("userprofile")
      .upsert(
        { email: payerEmail.toLowerCase(), is_premium: true },
        { onConflict: "email" }
      );

    if (error) {
      console.log("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, premium: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.toString() },
      { status: 500 }
    );
  }
}

// GET → erlaubt, dass Vercel PageScanner nicht crasht
export async function GET() {
  return NextResponse.json({ ok: true });
}
