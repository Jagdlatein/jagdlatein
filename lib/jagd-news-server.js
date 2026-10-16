import { unstable_cache } from "next/cache";
import { newsSources, newsRefreshSeconds } from "./news-catalog";
import { fetchNewsSource } from "./jagd-news-feeds";
import verifiedSnapshots from "./jagd-news-fallback.json";

// A new 30-minute key requests fresh data immediately, rather than showing one
// extra interval of stale data during background revalidation. Failed retrievals
// are not cached. Last successful/verified snapshots retain their original dates.
const lastSuccessful = new Map();
const readers = new Map(newsSources.map(source => [source.id, unstable_cache(async period => fetchNewsSource(source), ["jagdlatein-knowledge-news-v3", source.id, source.feed], { revalidate: newsRefreshSeconds * 2, tags: ["jagdlatein-news"] })]));
export async function collectJagdNews(readSource, now = Date.now()) {
  const results = await Promise.allSettled(newsSources.map(source => readSource(source)));
  return assembleJagdNews(results.map(result => result.status === "fulfilled" ? result.value : null), now);
}
function assembleJagdNews(snapshots, now) {
  const items = []; const sources = [];
  for (let index = 0; index < newsSources.length; index++) {
    const source = newsSources[index]; const snapshot = snapshots[index];
    const stale = Boolean(snapshot?.fetchedAt && now - Date.parse(snapshot.fetchedAt) > newsRefreshSeconds * 2000);
    const available = (snapshot?.items || []).filter(item => Date.parse(item.publishedAt) <= now && Date.parse(item.publishedAt) >= now - 366 * 86400000);
    items.push(...available);
    sources.push({ id: source.id, label: source.label, homepage: source.homepage, country: source.country, fetchedAt: snapshot?.fetchedAt || null, lastPublishedAt: available[0]?.publishedAt || null, status: snapshot ? snapshot.isFallback || stale ? "fallback" : "ok" : "unavailable", stale: stale || Boolean(snapshot?.isFallback) });
  }
  // Each verified source is bounded to 24 articles. Preserve the complete
  // bounded selection so a busy source cannot erase another topic's articles.
  const unique = [...new Map(items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).map(item => [item.url, item])).values()].slice(0, newsSources.length * 24);
  return { items: unique, sources, generatedAt: new Date(now).toISOString(), latestPublishedAt: unique[0]?.publishedAt || null, refreshSeconds: newsRefreshSeconds };
}
// Rendering the homepage must never wait for third-party sites. Keep real
// publication/retrieval dates in the initial cards, then refresh independently
// in the browser. The full feed remains behind the existing cached API.
export function getInitialJagdNews(now = Date.now()) {
  const snapshots = newsSources.map(source => {
    const recent = lastSuccessful.get(source.id);
    if (recent) return recent;
    const saved = verifiedSnapshots[source.id];
    return saved ? { ...saved, isFallback: true } : null;
  });
  const news = assembleJagdNews(snapshots, now);
  return { ...news, items: news.items.slice(0, 3), refreshPending: true };
}
export function getJagdNews() {
  const period = Math.floor(Date.now() / (newsRefreshSeconds * 1000));
  return collectJagdNews(async source => {
    try { const snapshot = await readers.get(source.id)(period); lastSuccessful.set(source.id, snapshot); return snapshot; }
    catch (error) {
      const saved = lastSuccessful.get(source.id) || verifiedSnapshots[source.id];
      if (saved) return { ...saved, isFallback: true };
      throw error;
    }
  });
}
