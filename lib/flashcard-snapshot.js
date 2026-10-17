// Server only. One immutable snapshot per content array/header in this process.
import { createHash } from "node:crypto";
import { packFlashcards } from "./flashcard-payload";
import { FLASHCARD_PAGING_FORMAT, FLASHCARD_PAGE_CARDS, FLASHCARD_PAGE_BYTES, FLASHCARD_MAX_PARTS } from "./flashcard-paging";

const snapshots = new WeakMap();
export function getFlashcardSnapshot(deck) {
  const { cards, ...header } = deck;
  const key = JSON.stringify(header);
  const cached = snapshots.get(cards);
  if (cached?.key === key) return cached.snapshot;
  const revision = createHash("sha256").update(JSON.stringify(deck)).digest("hex");
  const chunks = [];
  function append(items) {
    const packed = packFlashcards({ ...header, cards: items });
    // Reserve space for the full manifest, added after all boundaries are known.
    if (Buffer.byteLength(JSON.stringify(packed), "utf8") <= FLASHCARD_PAGE_BYTES - 16 * 1024) chunks.push(packed);
    else {
      if (items.length < 2) throw new Error("Eine Lernkarte überschreitet das Transportlimit.");
      const middle = Math.ceil(items.length / 2);
      append(items.slice(0, middle)); append(items.slice(middle));
    }
  }
  for (let offset = 0; offset < cards.length; offset += FLASHCARD_PAGE_CARDS) append(cards.slice(offset, offset + FLASHCARD_PAGE_CARDS));
  if (chunks.length > FLASHCARD_MAX_PARTS) throw new Error("Zu viele Lernkartenpakete.");
  const manifest = { format: FLASHCARD_PAGING_FORMAT, revision, total: cards.length, sizes: chunks.map(chunk => chunk.cards.length) };
  const parts = chunks.map((chunk, part) => ({ ...chunk, paging: { ...manifest, part } }));
  if (parts.some(part => Buffer.byteLength(JSON.stringify(part), "utf8") > FLASHCARD_PAGE_BYTES)) throw new Error("Lernkartenpaket überschreitet das Transportlimit.");
  const snapshot = { manifest, parts };
  snapshots.set(cards, { key, snapshot });
  return snapshot;
}
