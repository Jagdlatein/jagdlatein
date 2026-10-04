import {
  requireAccountSession, getAccountDatabase, accountJson, accountErrorResponse,
  accountUnavailable, sessionRenewalRequired,
} from "../../../lib/course-progress-server";
import { resolveSubscriptionAccess } from "../../../lib/subscription-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const session = requireAccountSession(req);
    const database = getAccountDatabase();
    const pattern = session.email.replace(/[\\%_]/g, "\\$&");
    const { data: profile, error } = await database
      .from("userprofile")
      .select("email,is_premium,is_admin")
      .ilike("email", pattern)
      .maybeSingle();
    if (error) throw accountUnavailable();
    if (!profile || typeof profile.email !== "string" || profile.email.trim().toLowerCase() !== session.email) {
      throw sessionRenewalRequired();
    }
    const subscription = profile.is_admin === true && profile.is_premium !== true ? { paid: false, paidUntil: null }
      : await resolveSubscriptionAccess(database, session.email, { legacyPaid: profile.is_premium === true });
    return accountJson({ account: {
      email: session.email,
      paid: subscription.paid,
      paidUntil: subscription.paidUntil,
      accessType: subscription.accessType || "none",
      trialUntil: subscription.trialUntil || null,
      subscriptionStatus: subscription.status || null,
      admin: profile.is_admin === true,
    } });
  } catch (error) {
    return accountErrorResponse(error);
  }
}
