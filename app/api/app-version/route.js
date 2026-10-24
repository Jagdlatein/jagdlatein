import { validReleaseId } from "../../../lib/app-update";

export const dynamic = "force-dynamic";

export function GET() {
  const releaseId = process.env.NEXT_PUBLIC_JL_RELEASE_ID;
  const headers = { "Cache-Control": "no-store, max-age=0", "CDN-Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "no-store" };
  return validReleaseId(releaseId)
    ? Response.json({ releaseId }, { headers })
    : Response.json({ message: "Der aktuelle Stand ist gerade nicht prüfbar." }, { status: 503, headers });
}
