import { newsSources } from "./news-catalog";

export function communityNewsSource(value) {
  if (typeof value !== "string" || value.length > 2048) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || !newsSources.some(source => source.domains.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`)))) return "";
    url.hash = "";
    return url.href;
  } catch { return ""; }
}
export function newsDiscussionHref(item) {
  const source = communityNewsSource(item?.url);
  const title = typeof item?.title === "string" ? item.title.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 120) : "";
  const category = item?.topic === "equipment" ? "ausruestung-technik" : item?.topic === "hunting" ? "jagdpraxis" : "natur-revier";
  const params = new URLSearchParams({ category, ...(title ? { thema: title } : {}), ...(source ? { quelle: source } : {}) });
  return `/community?${params}`;
}
