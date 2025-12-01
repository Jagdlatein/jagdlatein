export default function ResultBox({ correct }) {
  return (
    <div
      style={{
        marginTop: 30,
        padding: 18,
        background: correct ? "#d4f8c4" : "#f8d4d4",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        textAlign: "center",
        fontSize: 18,
        fontWeight: "bold",
      }}
    >
      {correct ? "✔ Richtige Entscheidung!" : "❌ Falsche Entscheidung"}
    </div>
  );
}
