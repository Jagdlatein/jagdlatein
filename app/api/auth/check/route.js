export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// SERVER CLIENT benutzen – NICHT NEXT_PUBLIC
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email fehlt." },
        { status: 400 }
      );
    }

    const mail = email.toLowerCase().trim();

    const { data: profile, error } = await supabase
      .from("userprofile")
      .select("*")
      .ilike("email", mail)
      .maybeSingle();

    if (error) {
      console.error("Supabase Fehler:", error);
      return NextResponse.json(
        { success: false, message: "Datenbankfehler." },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "E-Mail ist nicht registriert." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      paid: profile.is_premium === true,
      admin: profile.is_admin === true,
    });

  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.toString() },
      { status: 500 }
    );
  }
}

export function POST(req) {
  return GET(req);
}
