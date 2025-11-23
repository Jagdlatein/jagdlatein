import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BUILD_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE;

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

    // Events, die Premium aktivieren dürfen
    const event = body?.event_type;
    const email =
      body?.resource?.subscriber?.email_address ||
      body?.resource?.payer?.email_address;

    if (!email) {
      return NextResponse.json({ error: "Keine E-Mail erhalten" }, { status: 400 });
    }

    // Nur echte Premium-Events
    const validEvents = [
      "BILLING.SUBSCRIPTION.ACTIVATED",
      "PAYMENT.CAPTURE.COMPLETED"
    ];

    if (!validEvents.includes(event)) {
      return NextResponse.json({
        ok: true,
        info: "Event ignoriert",
        event
      });
    }

    if (BUILD_MODE) {
      return NextResponse.json({ ok: true, build: true });
    }

    // Premium setzen/geupsert
    await supabase
      .from("userprofile")
      .upsert(
        {
          email: email.toLowerCase(),
          is_premium: true,
        },
        { onConflict: "email" }
      );

    return NextResponse.json({
      ok: true,
      premium: true,
      event,
      email,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.toString() },
      { status: 500 }
    );
  }
}

// GET für Vercel Build
export function GET() {
  return NextResponse.json({ ok: true });
}
