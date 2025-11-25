import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
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

    // Case-insensitive Suche
    const mail = email.toLowerCase().trim();

    // Hole komplett den User
    const { data: profile, error } = await supabase
      .from("userprofile")
      .select("*")
      .ilike("email", mail)   // ⭐ ilike → case-insensitive
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
