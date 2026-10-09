import { accountJson, accountErrorResponse } from "../../../../lib/course-progress-server";
import { requirePayPalAccount, verifiedPayPalOffer } from "../../../../lib/paypal-checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { database } = await requirePayPalAccount(req);
    return accountJson(await verifiedPayPalOffer(database));
  } catch (error) { return accountErrorResponse(error); }
}
