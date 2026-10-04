// Client-supplied points cannot prove completion of a ranked round.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return Response.json({ success: false, error: "Bitte das Quiz neu laden. Ergebnisse werden jetzt während der Runde automatisch gespeichert." },
    { status: 410, headers: { "Cache-Control": "private, no-store" } });
}
