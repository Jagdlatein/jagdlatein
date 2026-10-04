import { communityJson, communityErrorResponse, getCommunity, writeCommunity } from "../../../lib/community-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
  try { return communityJson(await getCommunity(req)); }
  catch (error) { return communityErrorResponse(error); }
}
async function write(req) {
  try { return communityJson(await writeCommunity(req)); }
  catch (error) { return communityErrorResponse(error); }
}
export const POST = write;
export const PATCH = write;
export const DELETE = write;
