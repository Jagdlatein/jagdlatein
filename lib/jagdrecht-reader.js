export async function readJagdrechtArray(path, signal, fields) {
  const response = await fetch(path, { signal });
  if (!response.ok) throw new Error("Die ausgewählten Inhalte konnten nicht geladen werden.");
  const data = await response.json();
  if (!Array.isArray(data) || data.some(row => !row || fields.some(field => typeof row[field] !== "string"))) {
    throw new Error("Die ausgewählten Inhalte liegen nicht im erwarteten Format vor.");
  }
  return data;
}

export function splitLiteralSearch(text, search) {
  if (!search) return [text];
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.split(new RegExp(`(${escaped})`, "gi"));
}
