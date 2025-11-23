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

export async function GET(req) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ success: false, message: "Email fehlt." });
    }

    const mail = email.toLowerCase().trim();

    if (BUILD_MODE) {
      return NextResponse.json({ success: true, paid: false, admin: false });
    }

    const { data: profile } = await supabase
      .from("userprofile")
      .select("is_premium")
      .eq("email", mail)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      paid: profile?.is_premium === true,
      admin: false,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.toString() });
  }
}

export function POST(req) {
  return GET(req);
}
