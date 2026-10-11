const legacyPrices = Object.freeze({
  "P-9XU38461YG7706134NESJQWA": "5.00",
  "P-0SN76115U1905643NNLBEIGQ": "5.00",
});
const validId = value => typeof value === "string" && /^P-[A-Z0-9]{6,64}$/.test(value);

// Server-only configuration: bind each approved tariff to its own plan ID.
// Retired contracts keep their original price even when the public offer changes.
export function paypalPlanPricing(planId, env = process.env) {
  if (!validId(planId)) return null;
  let configured = {};
  if (env.PAYPAL_PLAN_PRICES !== undefined && env.PAYPAL_PLAN_PRICES !== "") {
    if (typeof env.PAYPAL_PLAN_PRICES !== "string" || env.PAYPAL_PLAN_PRICES.length > 12000)
      throw new Error("Invalid PayPal plan pricing configuration");
    try { configured = JSON.parse(env.PAYPAL_PLAN_PRICES); }
    catch { throw new Error("Invalid PayPal plan pricing configuration"); }
    if (!configured || typeof configured !== "object" || Array.isArray(configured) || Object.keys(configured).length > 100 ||
        Object.entries(configured).some(([id, amount]) => !validId(id) || !["5.00", "10.00"].includes(amount) ||
          (Object.hasOwn(legacyPrices, id) && amount !== legacyPrices[id])))
      throw new Error("Invalid PayPal plan pricing configuration");
  }
  const amount = legacyPrices[planId] || configured[planId];
  return amount ? { amount: `${amount}0`, currency: "EUR" } : null;
}
