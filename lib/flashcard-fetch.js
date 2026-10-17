import { unpackFlashcards } from "./flashcard-payload";
import { flashcardSelectionQuery, matchesFlashcardSelection } from "./flashcard-selection";
import { validFlashcardManifest, FLASHCARD_PAGE_BYTES } from "./flashcard-paging";

const INCOMPLETE = "Der Kartenbestand ist unvollständig. Bitte lade ihn erneut.";
function validateCards(data) {
  if (!data.cards.length || !data.cards.every(card => card.id && card.question && card.answer && Array.isArray(card.sources))) throw new Error("Der Kartenbestand konnte nicht geladen werden.");
}
function sameScope(a, b) {
  return (a?.courseId || "") === (b?.courseId || "") && (a?.lessonId || "") === (b?.lessonId || "") && !b?.invalid;
}
async function request(query, fetcher, signal) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const cancel = () => { clearTimeout(timeout); controller.abort(); };
  signal.addEventListener("abort", cancel, { once: true });
  if (signal.aborted) cancel();
  try {
    if (controller.signal.aborted) throw Object.assign(new Error("aborted"), { name: "AbortError" });
    const search = query.toString();
    const response = await fetcher(`/api/lernen/lernkarten${search ? `?${search}` : ""}`, { signal: controller.signal, cache: "no-store", credentials: "same-origin" });
    if (!response.ok) {
      const problem = new Error(response.status === 401 ? "Bitte melde dich erneut an, um alle Karten zu laden." : response.status === 403 ? "Für alle Lernkarten ist ein aktiver Zugang erforderlich." : response.status === 409 ? "Der Lernkartenbestand wurde aktualisiert. Bitte lade diese Seite neu." : "Der vollständige Kartenbestand ist gerade nicht erreichbar.");
      if (response.status === 409) problem.code = "FLASHCARD_REVISION_CHANGED";
      throw problem;
    }
    if (controller.signal.aborted) throw Object.assign(new Error("aborted"), { name: "AbortError" });
    const body = await response.json();
    if (controller.signal.aborted) throw Object.assign(new Error("aborted"), { name: "AbortError" });
    return body;
  } finally { cancel(); signal.removeEventListener("abort", cancel); }
}

export async function fetchFlashcardDeck(initial, expected, { fetcher = fetch, signal }) {
  const base = flashcardSelectionQuery(initial.selection);
  let data;
  if (!initial.paging) {
    // Already open older pages keep their original request/response contract.
    data = unpackFlashcards(await request(new URLSearchParams(base), fetcher, signal));
  } else {
    const manifest = initial.paging;
    if (!validFlashcardManifest(manifest, expected)) throw new Error(INCOMPLETE);
    const parts = new Array(manifest.sizes.length);
    let cursor = 0;
    const stop = new AbortController();
    const cancel = () => stop.abort();
    signal.addEventListener("abort", cancel, { once: true });
    if (signal.aborted) stop.abort();
    async function worker() {
      while (!stop.signal.aborted) {
        const part = cursor++;
        if (part >= parts.length) return;
        const query = new URLSearchParams({ ...base, part: String(part), revision: manifest.revision });
        const body = await request(query, fetcher, stop.signal);
        if (new TextEncoder().encode(JSON.stringify(body)).byteLength > FLASHCARD_PAGE_BYTES) throw new Error(INCOMPLETE);
        const page = unpackFlashcards(body), paging = page.paging;
        if (!paging || paging.part !== part || paging.revision !== manifest.revision || paging.format !== manifest.format
          || paging.total !== expected || JSON.stringify(paging.sizes) !== JSON.stringify(manifest.sizes)
          || page.cards.length !== manifest.sizes[part] || !sameScope(initial.selection, page.selection)
          || JSON.stringify(page.categories) !== JSON.stringify(initial.categories)) throw new Error(INCOMPLETE);
        validateCards(page);
        if (!stop.signal.aborted) parts[part] = page;
      }
    }
    try {
      // Bound parallel requests; preserve catalog order independently of arrival.
      await Promise.all(Array.from({ length: Math.min(3, parts.length) }, worker));
      if (stop.signal.aborted || [...parts].some(part => !part)) throw Object.assign(new Error("aborted"), { name: "AbortError" });
      const { paging, ...header } = parts[0];
      data = { ...header, cards: parts.flatMap(part => part.cards) };
    } finally { stop.abort(); signal.removeEventListener("abort", cancel); }
  }
  validateCards(data);
  const ids = new Set(data.cards.map(card => card.id));
  if (data.cards.length !== expected || ids.size !== data.cards.length || initial.cards.some(card => !ids.has(card.id))
    || !sameScope(initial.selection, data.selection)
    || initial.selection && !data.cards.every(card => matchesFlashcardSelection(card, initial.selection))) throw new Error(INCOMPLETE);
  // A changed answer/source with unchanged IDs also requires a fresh page.
  if (initial.paging) {
    const byId = new Map(data.cards.map(card => [card.id, card]));
    if (initial.cards.some(card => JSON.stringify(card) !== JSON.stringify(byId.get(card.id)))) throw new Error(INCOMPLETE);
  }
  return data;
}
