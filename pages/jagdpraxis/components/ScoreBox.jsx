export default function ScoreBox({ score, max }) {
  return (
    <div style={{
      marginTop: 30,
      padding: 16,
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      textAlign: "center",
      borderLeft: "6px solid #caa53b",
      fontSize: 18,
      fontWeight: "bold",
      color: "#1f2b23"
    }}>
      Punktestand: {score} / {max}
    </div>
  );
}
