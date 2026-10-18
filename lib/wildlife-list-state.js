import { europeanWildlifeGroups } from "./european-wildlife-discovery";

const groups = new Set(europeanWildlifeGroups);
export const defaultWildlifeListState = () => ({ query: "", group: "all" });

export function normalizeWildlifeListState(value = {}) {
  return {
    query: typeof value?.query === "string" ? value.query.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 160) : "",
    group: groups.has(value?.group) ? value.group : "all",
  };
}
export const sameWildlifeListState = (left, right) => left.query === right.query && left.group === right.group;

function localURL(asPath) {
  const path = typeof asPath === "string" && asPath.startsWith("/") && !asPath.startsWith("//")
    && !/[\\\u0000-\u001f\u007f]/.test(asPath) ? asPath : "/wildkunde";
  return new URL(path, "https://jagdlatein.invalid");
}
export function isWildlifeListURL(asPath) { return localURL(asPath).pathname.replace(/\/$/, "") === "/wildkunde"; }
export function readWildlifeListURL(asPath) {
  const params = localURL(asPath).searchParams;
  return normalizeWildlifeListState({ query: params.get("q"), group: params.get("group") });
}
export function wildlifeListURL(asPath, value) {
  const url = localURL(asPath), state = normalizeWildlifeListState(value);
  url.searchParams.delete("q"); url.searchParams.delete("group");
  if (state.query.trim()) url.searchParams.set("q", state.query);
  if (state.group !== "all") url.searchParams.set("group", state.group);
  return url.pathname + url.search + url.hash;
}
export function canonicalWildlifeListURL(asPath) {
  const url = localURL(asPath); url.searchParams.sort();
  return url.pathname + url.search + url.hash;
}
