// The ranked quiz now releases one server-owned question at a time.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;
export async function GET() {
  return Response.json({ error: "Bitte das Quiz neu laden. Die Fragen werden jetzt während der Runde einzeln geladen." },
    { status: 410, headers: { "Cache-Control": "private, no-store" } });
}
