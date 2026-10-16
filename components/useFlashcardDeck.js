import { useEffect, useMemo, useState } from "react";
import { unpackFlashcards } from "../lib/flashcard-payload";

const EMPTY_LIST = Object.freeze([]);
export default function useFlashcardDeck({ deck, cards = EMPTY_LIST, categories = EMPTY_LIST, remote = false, totalCount }) {
  const initial = useMemo(() => deck ? unpackFlashcards(deck) : { cards, categories }, [deck, cards, categories]);
  const [complete, setComplete] = useState(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!remote) return;
    const controller = new AbortController();
    let current = true;
    setError("");
    const timeout = setTimeout(() => controller.abort(), 15000);
    (async () => {
      try {
        const response = await fetch("/api/lernen/lernkarten", { signal: controller.signal, cache: "no-store", credentials: "same-origin" });
        if (!response.ok) throw new Error(response.status === 401 ? "Bitte melde dich erneut an, um alle Karten zu laden." : response.status === 403 ? "Für alle Lernkarten ist ein aktiver Zugang erforderlich." : "Der vollständige Kartenbestand ist gerade nicht erreichbar.");
        const data = unpackFlashcards(await response.json());
        if (!data.cards.length || !data.cards.every(card => card.id && card.question && card.answer && Array.isArray(card.sources))) throw new Error("Der Kartenbestand konnte nicht geladen werden.");
        const expected = Number.isSafeInteger(totalCount) ? totalCount : initial.categories.reduce((sum, category) => sum + (category.count || 0), 0);
        const ids = new Set(data.cards.map(card => card.id));
        if (data.cards.length < expected || ids.size !== data.cards.length || initial.cards.some(card => !ids.has(card.id))) throw new Error("Der Kartenbestand ist unvollständig. Bitte lade ihn erneut.");
        if (current) setComplete({ data, initial });
      } catch (problem) {
        if (current) setError(problem.name === "AbortError" ? "Der Abruf dauert gerade zu lange. Du kannst ihn erneut starten." : problem.message || "Der vollständige Kartenbestand ist gerade nicht erreichbar.");
      } finally { clearTimeout(timeout); }
    })();
    return () => { current = false; clearTimeout(timeout); controller.abort(); };
  }, [initial, remote, revision, totalCount]);
  const full = complete?.initial === initial ? complete.data : null;
  return {
    // Stable category references preserve a learner's current filter/revealed card.
    cards: full?.cards || initial.cards, categories: initial.categories,
    totalCount: full?.cards.length || totalCount || initial.cards.length,
    incomplete: remote && !full, loading: remote && !full && !error, loadError: error,
    onReload: () => setRevision(value => value + 1),
  };
}
