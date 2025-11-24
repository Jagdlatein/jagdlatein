import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors });
}

export async function GET() {
  return NextResponse.json({ ok: true }, { headers: cors });
}

export async function POST(req) {
  try {
    const body = await req.json();

    const event = body?.event_type;

    const email =
      body?.resource?.subscriber?.email_address ||
      body?.resource?.payer?.email_address;

    if (!email) {
      return NextResponse.json(
        { error: "Keine E-Mail erhalten" },
        { status: 400, headers: cors }
      );
    }

    const validEvents = [
      "CHECKOUT.ORDER.APPROVED",
      "PAYMENT.CAPTURE.COMPLETED",
      "BILLING.SUBSCRIPTION.ACTIVATED",
    ];

    if (!validEvents.includes(event)) {
      return NextResponse.json(
        { ok: true, info: "Event ignoriert", event },
        { headers: cors }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const service = process.env.SUPABASE_SERVICE_ROLE;

    if (!url || !service) {
      return NextResponse.json(
        { ok: true, build: true },
        { headers: cors }
      );
    }

    const supabase = createClient(url, service);

    await supabase
      .from("userprofile")
      .upsert(
        {
          email: email.toLowerCase(),
          is_premium: true,
        },
        { onConflict: "email" }
      );

    return NextResponse.json(
      { ok: true, premium: true, event, email },
      { headers: cors }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500, headers: cors }
    );
  }
}
