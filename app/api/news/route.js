import { getJagdNews } from "../../../lib/jagd-news-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return Response.json(await getJagdNews(), { headers: { "Cache-Control": "public, max-age=0, s-maxage=60" } }); }
  catch { return Response.json({ message: "Die Nachrichten konnten gerade nicht geladen werden. Bitte erneut versuchen." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
