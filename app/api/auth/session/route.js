// app/api/auth/check/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Build Mode aktiv, wenn ENV fehlt
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

// -------------------------------
// GET – für Login-Check (authCheck nutzt GET!)
// -------------------------------
export async function GET(req) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Bitte gültige E-Mail." },
        { status: 400 }
      );
    }

    const mail = email.toLowerCase().trim();

    if (BUILD_MODE) {
      return NextResponse.json({
        success: true,
        paid: false,
        admin: false,
      });
    }

    const { data: profile } = await supabase
      .from("userprofile")
      .select("is_premium")
      .eq("email", mail)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({
        success: false,
        message: "E-Mail ist nicht registriert.",
      });
    }

    return NextResponse.json({
      success: true,
      paid: profile.is_premium === true,
      admin: false,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.toString() },
      { status: 500 }
    );
  }
}

// POST bleibt zur Sicherheit bestehen (falls später benutzt)
export async function POST(req) {
  return GET(req);
}

export async function DELETE() {
  return NextResponse.json({ ok: true });
}
