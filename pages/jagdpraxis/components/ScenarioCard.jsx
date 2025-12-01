export default function ScenarioCard({ title, text }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: 20,
        borderRadius: 14,
        boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
        marginTop: 20,
        borderLeft: "6px solid #d4af37",
      }}
    >
      <h2 style={{ margin: 0 }}>{title}</h2>
      <p style={{ marginTop: 10, lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}
