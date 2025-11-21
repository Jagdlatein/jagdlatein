// app/api/auth/check/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

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

    // 🔥 User aus userprofile holen
    const { data: profile } = await supabase
      .from("userprofile")
      .select("is_premium")
      .eq("email", mail)
      .maybeSingle();

    // User hat kein Profil → nicht registriert
    if (!profile) {
      return NextResponse.json({
        success: false,
        message: "E-Mail ist nicht registriert.",
      });
    }

    return NextResponse.json({
      success: true,
      paid: profile.is_premium === true,
      admin: false, // optional: falls du ein Admin-System aufbauen willst
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.toString() },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach((name) =>
    cookies().set({
      name,
      value: "",
      path: "/",
      maxAge: 0,
    })
  );

  return NextResponse.json({ ok: true });
}
