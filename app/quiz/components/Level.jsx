export function getLevel(points) {
  if (points < 500) return "🌱 Wildbeobachter";
  if (points < 1500) return "🌿 Anfänger-Jäger";
  if (points < 4000) return "🦌 Revierkenner";
  if (points < 8000) return "🏹 Waidmann";
  if (points < 15000) return "🐗 Erfahrener Jäger";
  return "👑 Jagdmeister";
}
