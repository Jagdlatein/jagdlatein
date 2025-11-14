// app/api/login/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  let body: { email?: string } | null = null;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Ungültige Anfrage' },
      { status: 400 }
    );
  }

  const email = body?.email?.trim();

  if (!email) {
    return NextResponse.json(
      { success: false, message: 'E-Mail fehlt' },
      { status: 400 }
    );
  }

  // TODO: Hier deine echte Kauf-Prüfung einbauen
  // z.B. gegen Datenbank oder Liste von bezahlten E-Mails

  const fakeToken = 'token-' + Date.now();

  return NextResponse.json(
    { success: true, token: fakeToken },
    { status: 200 }
  );
}

// Optional: GET blocken, damit du siehst, dass Route existiert
export function GET() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed' },
    { status: 405 }
  );
}
