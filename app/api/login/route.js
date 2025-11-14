// app/api/login/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  let body = null;

  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json(
      { success: false, message: 'Ungültige Anfrage' },
      { status: 400 }
    );
  }

  const email = body && body.email ? body.email.trim() : '';

  if (!email) {
    return NextResponse.json(
      { success: false, message: 'E-Mail fehlt' },
      { status: 400 }
    );
  }

  // TODO: hier echte Prüfung einbauen
  const fakeToken = 'token-' + Date.now();

  return NextResponse.json(
    { success: true, token: fakeToken },
    { status: 200 }
  );
}

export function GET() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed' },
    { status: 405 }
  );
}
