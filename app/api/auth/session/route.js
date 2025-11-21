// app/api/auth/check/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Build Mode aktiv, wenn ENV fehlt
const BUILD_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE;

// Supabase nur initialisieren, wenn ENV vorhanden
let supabase = null;

if (!BUILD_MODE) {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
  );
}

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Bitte gültige E-Mail." },
        { status: 400 }
      );
    }

    const mail = email.toLowerCase().trim();

    // 🛡️ Build Mode: Dummy Antwort passt zum Cookie-Login-System
    if (BUILD_MODE) {
      return NextResponse.json({
        success: true,
        paid: false,
        admin: false,
      });
    }

    // 🔥 Runtime: User aus userprofile holen
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

export async function DELETE() {
  return NextResponse.json({ ok: true });
}
