export function getHirschBadge(points) {
  if (points < 1000) return "🟩";
  if (points < 3000) return "🟦";
  if (points < 6000) return "🟨";
  if (points < 12000) return "🟧";
  return "🟥";
}
