export function getNextUrl(next) {
  const value = Array.isArray(next) ? next[0] : next;
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return "/";
  try {
    const target = new URL(value, "https://jagdlatein.invalid");
    const pathname = decodeURIComponent(target.pathname).replace(/\/+$/, "");
    if (target.origin !== "https://jagdlatein.invalid" || ["/login", "/registrieren"].includes(pathname) || pathname.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(pathname)) return "/";
  } catch { return "/"; }
  return value;
}

export function getLoginDestination(next, account, paymentUrl = "/preise#paypal-subscribe-preise") {
  const destination = getNextUrl(next);
  const pathname = new URL(destination, "https://jagdlatein.invalid").pathname.replace(/\/+$/, "");
  const accountRoute = ["/konto", "/meine-kurse", "/auswertungen", "/quiz-app/stats", "/quiz/stats", "/community"].includes(pathname)
    || /^\/community\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname);
  if (account?.paid === true || account?.admin === true || accountRoute) return destination;
  const base = String(paymentUrl);
  const hash = base.indexOf("#");
  const before = hash >= 0 ? base.slice(0, hash) : base;
  const after = hash >= 0 ? base.slice(hash) : "";
  return `${before}${before.includes("?") ? "&" : "?"}next=${encodeURIComponent(destination)}${after}`;
}
