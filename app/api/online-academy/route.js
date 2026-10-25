import { academyJson, academyErrorResponse, getAcademyOverview, saveAcademyRecord } from "../../../lib/online-academy-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
  try { return academyJson(await getAcademyOverview(req)); }
  catch (error) { return academyErrorResponse(error); }
}
export async function POST(req) {
  try { return academyJson(await saveAcademyRecord(req)); }
  catch (error) { return academyErrorResponse(error); }
}
