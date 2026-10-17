// Shared transport contract. No catalog or authentication imports.
export const FLASHCARD_PAGING_FORMAT = "jagdlatein-flashcard-pages-v1";
export const FLASHCARD_PAGE_CARDS = 256;
export const FLASHCARD_PAGE_BYTES = 256 * 1024;
export const FLASHCARD_MAX_PARTS = 2048;
export const FLASHCARD_REVISION = /^[a-f0-9]{64}$/;

export function readFlashcardPageRequest(query) {
  const parts = query.getAll("part"), revisions = query.getAll("revision");
  if (!parts.length && !revisions.length) return null;
  if (parts.length !== 1 || revisions.length !== 1 || !/^(0|[1-9][0-9]{0,3})$/.test(parts[0])
    || Number(parts[0]) >= FLASHCARD_MAX_PARTS || !FLASHCARD_REVISION.test(revisions[0])) return { invalid: true };
  return { part: Number(parts[0]), revision: revisions[0] };
}

export function validFlashcardManifest(manifest, expected) {
  return manifest?.format === FLASHCARD_PAGING_FORMAT && FLASHCARD_REVISION.test(manifest.revision)
    && Number.isSafeInteger(manifest.total) && manifest.total > 0 && manifest.total === expected
    && Array.isArray(manifest.sizes) && manifest.sizes.length > 0 && manifest.sizes.length <= FLASHCARD_MAX_PARTS
    && manifest.sizes.every(size => Number.isSafeInteger(size) && size > 0 && size <= FLASHCARD_PAGE_CARDS)
    && manifest.sizes.reduce((sum, size) => sum + size, 0) === expected;
}
