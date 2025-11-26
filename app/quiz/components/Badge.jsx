export default function Badge({ points }) {
  let emoji = "🦌";
  let label = "Jäger";

  if (points > 10000) {
    emoji = "👑";
    label = "Elite";
  } else if (points > 5000) {
    emoji = "🦊";
    label = "Profi";
  } else if (points > 2000) {
    emoji = "🐗";
    label = "Fortgeschritten";
  }

  return (
    <div
      style={{
        marginLeft: 12,
        background: "#f2e2c4",
        padding: "6px 10px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 700,
        color: "#4b371c",
      }}
    >
      {emoji} {label}
    </div>
  );
}
