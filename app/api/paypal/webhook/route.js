export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  console.log("🔥 PAYPAL WEBHOOK WURDE AUSGEFÜHRT");
  const body = await req.text();
  console.log("📩 RAW BODY:", body);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

export function GET() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
