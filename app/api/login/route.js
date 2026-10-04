import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET(req) { return NextResponse.redirect(new URL("/login", req.url)); }
export function POST() { return NextResponse.json({ error: "Bitte über /login einen E-Mail-Code anfordern." }, { status: 410 }); }
