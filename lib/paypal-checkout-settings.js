import { assertTestPayPalApiBase, isPayPalSandboxTestEnvironment } from "./test-environment";

const LIVE_CLIENT_ID = "AQx7R9V-b-x8NJmvXUkRrJ-Js68jqMq3udNpdVmONZrpS0y6zpUj5QMIAiunCQDCTPpwmiKFaJJybJBW";
const LIVE_PLAN_IDS = new Set(["P-9XU38461YG7706134NESJQWA", "P-0SN76115U1905643NNLBEIGQ"]);
const validPlan = value => typeof value === "string" && /^P-[A-Z0-9]{6,64}$/.test(value);

// These settings are returned by the server before the browser can load the SDK.
// A missing public test value must never select a historical live default.
export function paypalCheckoutSettings(env = process.env) {
  const sandbox = isPayPalSandboxTestEnvironment(env);
  const trialPlanId = (env.NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID || "").trim();
  if (trialPlanId && !validPlan(trialPlanId)) throw new Error("Invalid trial configuration");

  if (sandbox) {
    assertTestPayPalApiBase(env.PAYPAL_API_BASE, env);
    const clientId = env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const regularPlanId = env.NEXT_PUBLIC_PAYPAL_PLAN_ID?.trim();
    if (typeof clientId !== "string" || !/^[A-Za-z0-9_-]{20,256}$/.test(clientId) ||
        clientId === LIVE_CLIENT_ID || env.PAYPAL_CLIENT_ID !== clientId ||
        !validPlan(regularPlanId) || LIVE_PLAN_IDS.has(regularPlanId) ||
        (trialPlanId && (LIVE_PLAN_IDS.has(trialPlanId) || trialPlanId === regularPlanId)))
      throw new Error("Incomplete sandbox checkout configuration");
    return { sandbox, clientId, planId: trialPlanId || regularPlanId, trial: Boolean(trialPlanId) };
  }

  return {
    sandbox,
    clientId: env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || LIVE_CLIENT_ID,
    planId: trialPlanId || (env.NEXT_PUBLIC_PAYPAL_PLAN_ID || "P-9XU38461YG7706134NESJQWA").trim(),
    trial: Boolean(trialPlanId),
  };
}
