import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

// PayPal sendet Events hierher
export async function POST(req) {
  try {
    const body = await req.json();

    // Wichtig: Nur Completed-Zahlungen akzeptieren
    const eventType = body?.event_type;
    const payerEmail = body?.resource?.payer?.email_address;

    if (!payerEmail) {
      return NextResponse.json({ error: "Keine E-Mail erhalten" }, { status: 400 });
    }

    if (eventType !== "PAYMENT.CAPTURE.COMPLETED") {
      return NextResponse.json({ ok: true, info: "Event ignoriert" });
    }

    // Auto-User erstellen + Premium aktivieren
    const { data, error } = await supabase
      .from("userprofile")
      .upsert(
        {
          email: payerEmail.toLowerCase(),
          is_premium: true,
        },
        { onConflict: "email" }
      );

    if (error) {
      console.log("Supabase Fehler", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.toString() },
      { status: 500 }
    );
  }
}
