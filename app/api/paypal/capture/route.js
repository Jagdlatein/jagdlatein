export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The active product is the subscription on /preise, not the former one-time orders.
export function POST() {
  return Response.json({ error: "Einmalzahlungen sind nicht verfügbar. Bitte die Preisseite verwenden." }, { status: 410 });
}
