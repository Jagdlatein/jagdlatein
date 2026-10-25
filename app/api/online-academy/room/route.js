import { academyJson, academyErrorResponse, getAcademyRoom } from "../../../../lib/online-academy-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
  try { return academyJson(await getAcademyRoom(req)); }
  catch (error) { return academyErrorResponse(error); }
}
