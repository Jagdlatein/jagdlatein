import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "MISSING",
    SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE ? "SET" : "MISSING"
  });
}
