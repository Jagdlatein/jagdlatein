// app/api/login/route.js
import { NextResponse } from 'next/server';

function isPaidEmail(email) {
  const raw = process.env.PAID_EMAILS || '';
  const allowed = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email.toLowerCase());
}

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

  const email = body && body.email ? body.email.trim().toLowerCase() : '';

  if (!email) {
    return NextResponse.json(
      { success: false, message: 'E-Mail fehlt' },
      { status: 400 }
    );
  }

  // 🔒 Hier wird jetzt geprüft, ob die Mail bezahlt ist
  if (!isPaidEmail(email)) {
    return NextResponse.json(
      { success: false, message: 'Für diese E-Mail existiert kein bezahltes Abo.' },
      { status: 403 }
    );
  }

  // Wenn alles ok: "Token" erzeugen (simple Session-ID)
  const token = 'token-' + Date.now();

  return NextResponse.json(
    { success: true, token },
    { status: 200 }
  );
}

export function GET() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed' },
    { status: 405 }
  );
}
