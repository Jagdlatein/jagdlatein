import { unstable_cache } from "next/cache";
import { newsSources, newsRefreshSeconds } from "./news-catalog";
import { fetchNewsSource } from "./jagd-news-feeds";
import verifiedSnapshots from "./jagd-news-fallback.json";

// A new 30-minute key requests fresh data immediately, rather than showing one
// extra interval of stale data during background revalidation. Failed retrievals
// are not cached. Last successful/verified snapshots retain their original dates.
const lastSuccessful = new Map();
const readers = new Map(newsSources.map(source => [source.id, unstable_cache(async period => fetchNewsSource(source), ["jagdlatein-knowledge-news-v2", source.id, source.feed], { revalidate: newsRefreshSeconds * 2, tags: ["jagdlatein-news"] })]));
export async function collectJagdNews(readSource, now = Date.now()) {
  const results = await Promise.allSettled(newsSources.map(source => readSource(source)));
  const items = []; const sources = [];
  for (let index = 0; index < newsSources.length; index++) {
    const source = newsSources[index]; const result = results[index];
    const snapshot = result.status === "fulfilled" ? result.value : null;
    const stale = Boolean(snapshot?.fetchedAt && now - Date.parse(snapshot.fetchedAt) > newsRefreshSeconds * 2000);
    const available = (snapshot?.items || []).filter(item => Date.parse(item.publishedAt) <= now && Date.parse(item.publishedAt) >= now - 366 * 86400000);
    items.push(...available);
    sources.push({ id: source.id, label: source.label, homepage: source.homepage, country: source.country, fetchedAt: snapshot?.fetchedAt || null, lastPublishedAt: available[0]?.publishedAt || null, status: snapshot ? snapshot.isFallback || stale ? "fallback" : "ok" : "unavailable", stale: stale || Boolean(snapshot?.isFallback) });
  }
  const unique = [...new Map(items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).map(item => [item.url, item])).values()].slice(0, 80);
  return { items: unique, sources, generatedAt: new Date(now).toISOString(), latestPublishedAt: unique[0]?.publishedAt || null, refreshSeconds: newsRefreshSeconds };
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
