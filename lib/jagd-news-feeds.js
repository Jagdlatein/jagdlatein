import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";

export const NEWS_MAX_BYTES = 1024 * 1024;
const array = value => value == null ? [] : Array.isArray(value) ? value : [value];
const text = value => typeof value === "string" || typeof value === "number" ? String(value) : value && typeof value === "object" ? text(value["#text"]) : "";
function decodeText(value) {
  const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", auml: "ä", ouml: "ö", uuml: "ü", Auml: "Ä", Ouml: "Ö", Uuml: "Ü", szlig: "ß" };
  return String(value).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity.startsWith("#")) {
      const point = entity[1]?.toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return Number.isInteger(point) && point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : " ";
    }
    return Object.hasOwn(entities, entity) ? entities[entity] : match;
  });
}
export function cleanNewsText(value, limit = 400) {
  // Feed text is displayed as plain React text, never interpreted as HTML.
  return decodeText(text(value).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ").replace(/<[^>]*>/g, " "))
    .replace(/\[\/?(?:i|b|u)\]/gi, "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}
export function trustedNewsUrl(value, source) {
  try {
    if (!text(value).trim()) return null;
    const url = new URL(decodeText(text(value)).trim(), source.homepage);
    if (source.upgradeHttp && url.protocol === "http:" && source.domains.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`))) url.protocol = "https:";
    if (url.protocol !== "https:" || url.username || url.password || url.port && url.port !== "443"
      || !source.domains.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`))) return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
    return url.href;
  } catch { return null; }
}
const political = /\b(\w*politik\w*|politisch\w*|partei\w*|parlament\w*|bundestag\w*|bundesrat\w*|landtag\w*|nationalrat\w*|\w*minister\w*|\w*regierung\w*|wahlkampf\w*|petition\w*|\w*gesetz\w*|novell\w*|\w*verordnung\w*|verbandsposition\w*|stellungnahme\w*|forderungen?|resolution\w*|kundgebung\w*|demonstration\w*|subvention\w*|intern)\b/;
const administrative = /\b(stellenangebot\w*|karriere\w*|stellenausschreibung\w*|neuer\s+direktor|neue\s+direktorin|personalie\w*|ausschreibung\w*|gala\w*|jubilaum\w*|forschungspreis\w*|pilzausstellung\w*|tagung\w*|kongress\w*|seminar\w*|webinar\w*)\b/;
const nature = /\b(wald\w*|walder\w*|forst\w*|baum\w*|baume\w*|pflanz\w*|biodivers\w*|lebensraum\w*|okolog\w*|artenvielfalt\w*|vogel\w*|nist\w*|gart\w*|insek\w*|boden\w*|wasser\w*|klima\w*|biotop\w*|habitat\w*|pilz\w*|natur\w*|steinadler\w*|saugetier\w*|fledermaus\w*|tierart\w*)\b/;
const hunting = /\b(wildtier\w*|wildbiolog\w*|jagd\w*|jaeger\w*|jagdhund\w*|hunde\w*|schwarzwild\w*|wildschwein\w*|rotwild\w*|rehwild\w*|reh\w*|hirsch\w*|gams\w*|gaems\w*|steinbock\w*|steinwild\w*|raubwild\w*|fuchs\w*|dachs\w*|marder\w*|hase\w*|kaninchen\w*|raufuss\w*|haselhuhn\w*|auerhuhn\w*|birkhuhn\w*|federwild\w*|wildbret\w*|faehrte\w*|verbiss\w*|schaelschaden\w*|nachsuche\w*|wildkrank\w*|schweinepest\w*|vogelgrippe\w*|tularaemie\w*|wildunfall\w*)\b/;
const science = /\b(forsch\w*|studie\w*|wissenschaft\w*|experiment\w*|monitoring\w*|messung\w*|untersuch\w*|daten\w*|erkenntnis\w*|genet\w*)\b/;
const outsideFocus = /\b(gepard\w*|hyane\w*|giraffe\w*|elefant\w*|okapi\w*|przewalski\w*|kakadu\w*|kasachstan\w*|namibia\w*|ostafrika\w*|sudafrika\w*|amazonas\w*)\b/;
const distantTitle = /\b(korea\w*|sudkorea\w*|china\w*|japan\w*|brasilien\w*|kanada\w*|australien\w*|usa|neuseeland\w*|indien\w*)\b/;
function fold(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ß/g, "ss"); }
export function classifyNews(title, description = "", defaultTopic = "nature") {
  const value = fold(`${title} ${description}`);
  if (political.test(value) || administrative.test(value) || outsideFocus.test(value) || distantTitle.test(fold(title)) || !(nature.test(value) || hunting.test(value))) return null;
  if (science.test(value) || defaultTopic === "science") return "science";
  if (hunting.test(value) && !/\bhirschkafer\w*\b/.test(value)) return "hunting";
  return defaultTopic === "science" ? "science" : "nature";
}
export function parseNewsFeed(xml, source, now = Date.now()) {
  if (typeof xml !== "string" || Buffer.byteLength(xml) > NEWS_MAX_BYTES || /<!\s*(DOCTYPE|ENTITY)\b/i.test(xml)) throw new Error("Unzulässiger Nachrichtenfeed.");
  const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, parseTagValue: false, parseAttributeValue: false, processEntities: false, maxNestedTags: 30 });
  const tree = parser.parse(xml, true);
  const rss = tree.rss?.channel || tree.RDF;
  const entries = rss ? array(rss.item) : tree.feed ? array(tree.feed.entry) : null;
  if (!entries) throw new Error("Kein unterstützter Nachrichtenfeed.");
  const seen = new Set(); const items = [];
  for (const entry of entries.slice(0, 100)) {
    const title = cleanNewsText(entry.title, 260);
    const description = cleanNewsText(entry.description || entry.summary || entry.content, 6000);
    const topic = classifyNews(title, description, source.defaultTopic);
    const link = array(entry.link).find(item => typeof item === "string" || item?.["@_href"] && (!item["@_rel"] || item["@_rel"] === "alternate"));
    const url = trustedNewsUrl(typeof link === "object" ? link["@_href"] : link, source);
    const published = text(entry.pubDate || entry.published || entry.date || entry.updated);
    const publishedTime = published ? Date.parse(published) : NaN;
    // Future and undated entries are never presented as current news.
    if (!title || !topic || !url || seen.has(url) || !Number.isFinite(publishedTime) || publishedTime > now || publishedTime < now - 366 * 86400000) continue;
    seen.add(url);
    items.push({ id: createHash("sha256").update(url).digest("hex").slice(0, 20), title, url, publishedAt: new Date(publishedTime).toISOString(), sourceId: source.id, sourceLabel: source.label, topic });
  }
  return items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 24);
}
export function parseNewsHtml(html, source, now = Date.now()) {
  if (typeof html !== "string" || Buffer.byteLength(html) > NEWS_MAX_BYTES) throw new Error("Nachrichtenseite zu groß.");
  // Only the verified article-card structure is read. A redesign fails closed;
  // navigation, images, scripts and arbitrary links are never treated as news.
  const starts = source.format === "izw-html" ? /<div\b[^>]*class="[^"]*\blayout_latest\b[^"]*"[^>]*>/g
    : /<div\b[^>]*class="[^"]*\bnews-list-item\b[^"]*"[^>]*>/g;
  const matches = [...html.matchAll(starts)];
  if (!matches.length) throw new Error("Struktur der Nachrichtenquelle geändert.");
  const records = [];
  for (let index = 0; index < Math.min(matches.length, 30); index++) {
    const block = html.slice(matches[index].index, matches[index + 1]?.index || matches[index].index + 16000);
    const anchor = source.format === "izw-html" ? block.match(/<h2\b[^>]*>\s*<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i)
      : block.match(/<a\b[^>]*class="[^"]*\bnews-headline-link\b[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i)
        || block.match(/<a\b[^>]*href="([^"]+)"[^>]*class="[^"]*\bnews-headline-link\b[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
    if (!anchor) continue;
    const time = block.match(/<time\b[^>]*datetime="([^"]+)"/i)?.[1] || block.match(/<time\b[^>]*>([\s\S]*?)<\/time>/i)?.[1];
    const day = cleanNewsText(time || "", 50).match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    // Date-only announcements use noon UTC so their calendar date remains
    // correct in Zurich both in summer and winter; no publication time is shown.
    const published = day ? `${day[3]}-${day[2]}-${day[1]}T12:00:00Z` : time || "";
    const title = cleanNewsText(anchor[2], 260); const url = trustedNewsUrl(anchor[1], source);
    const description = source.format === "izw-html" ? cleanNewsText(block.match(/<div\b[^>]*class="[^"]*ce_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || "", 5000) : "";
    const topic = classifyNews(title, description, source.defaultTopic); const timestamp = Date.parse(published);
    if (!title || !url || !topic || !Number.isFinite(timestamp) || timestamp > now || timestamp < now - 366 * 86400000) continue;
    records.push({ id: createHash("sha256").update(url).digest("hex").slice(0, 20), title, url, publishedAt: new Date(timestamp).toISOString(), sourceId: source.id, sourceLabel: source.label, topic });
  }
  return [...new Map(records.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).map(item => [item.url, item])).values()].slice(0, 24);
}
export async function fetchNewsSource(source, { fetchImpl = fetch, now = Date.now } = {}) {
  const response = await fetchImpl(source.feed, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(6000), headers: { Accept: source.format ? "text/html" : "application/rss+xml, application/atom+xml, application/xml, text/xml", "User-Agent": "Jagdlatein-Wissen/1.0 (+https://jagdlatein.vercel.app/news)" } });
  if (!response.ok || Number(response.headers.get("content-length") || 0) > NEWS_MAX_BYTES) throw new Error("Nachrichtenquelle derzeit nicht erreichbar.");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Nachrichtenquelle ohne Inhalt.");
  const chunks = []; let size = 0;
  try {
    for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > NEWS_MAX_BYTES) throw new Error("Nachrichtenfeed zu groß."); chunks.push(value); }
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  const fetchedAt = new Date(now()).toISOString();
  const raw = Buffer.concat(chunks).toString("utf8");
  const items = source.format ? parseNewsHtml(raw, source, Date.parse(fetchedAt)) : parseNewsFeed(raw, source, Date.parse(fetchedAt));
  return { items, fetchedAt };
}
