export function getLevel(points) {
  if (points >= 15000) return "Hirschkaiser";
  if (points >= 12000) return "Berufsjäger";
  if (points >= 8000) return "Hundeführer";
  if (points >= 4000) return "Revierkenner";
  if (points >= 1000) return "Waidmann";
  return "Jungjäger";
}
