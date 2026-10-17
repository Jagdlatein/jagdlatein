import { useEffect, useMemo, useState } from "react";
import { unpackFlashcards } from "../lib/flashcard-payload";
import { fetchFlashcardDeck } from "../lib/flashcard-fetch";

const EMPTY_LIST = Object.freeze([]);
export default function useFlashcardDeck({ deck, cards = EMPTY_LIST, categories = EMPTY_LIST, remote = false, totalCount }) {
  const initial = useMemo(() => deck ? unpackFlashcards(deck) : { cards, categories }, [deck, cards, categories]);
  const [complete, setComplete] = useState(null);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!remote) return;
    const controller = new AbortController();
    let current = true;
    setError(null);
    (async () => {
      try {
        const expected = Number.isSafeInteger(totalCount) ? totalCount : initial.categories.reduce((sum, category) => sum + (category.count || 0), 0);
        const data = await fetchFlashcardDeck(initial, expected, { signal: controller.signal });
        if (current) setComplete({ data, initial });
      } catch (problem) {
        if (current) setError({ initial, refresh: problem.code === "FLASHCARD_REVISION_CHANGED", message: problem.name === "AbortError" ? "Der Abruf dauert gerade zu lange. Du kannst ihn erneut starten." : problem.message || "Der vollständige Kartenbestand ist gerade nicht erreichbar." });
      }
    })();
    return () => { current = false; controller.abort(); };
  }, [initial, remote, revision, totalCount]);
  const full = complete?.initial === initial ? complete.data : null;
  const loadError = error?.initial === initial ? error.message : "";
  return {
    // Stable category references preserve a learner's current filter/revealed card.
    cards: full?.cards || initial.cards, categories: initial.categories, selection: initial.selection || null,
    totalCount: full?.cards.length || totalCount || initial.cards.length,
    incomplete: remote && !full, loading: remote && !full && !loadError, loadError,
    onReload: () => {
      if (error?.initial === initial && error.refresh) window.location.reload();
      else setRevision(value => value + 1);
    },
  };
}
