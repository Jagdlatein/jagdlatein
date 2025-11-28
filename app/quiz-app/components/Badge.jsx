export function calcBadge(points) {
  if (points >= 20000) return { emoji: "👑", label: "Elitejäger" };
  if (points >= 10000) return { emoji: "🦊", label: "Wilderer" };
  if (points >= 5000) return { emoji: "🐗", label: "Profi" };
  if (points >= 1000) return { emoji: "🦌", label: "Jäger" };
  return { emoji: "🌱", label: "Anfänger" };
}

// Alias für alte Stats-Page-Kompatibilität
export function getHirschBadge(points) {
  return calcBadge(points);
}

export default function Badge({ points }) {
  const { emoji, label } = calcBadge(points);

  return (
    <div
      style={{
        background: "#f8ead5",
        borderRadius: 12,
        padding: "6px 12px",
        fontSize: 14,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span>{emoji}</span> {label}
    </div>
  );
}
