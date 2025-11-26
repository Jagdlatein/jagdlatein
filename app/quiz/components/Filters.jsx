export default function Filters({ filter, setFilter }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
      <button
        onClick={() => setFilter("all")}
        style={{
          padding: "8px 14px",
          borderRadius: 10,
          border: 0,
          background: filter === "all" ? "#136f39" : "#ddd",
          color: filter === "all" ? "#fff" : "#000",
        }}
      >
        Gesamt
      </button>

      <button
        onClick={() => setFilter("month")}
        style={{
          padding: "8px 14px",
          borderRadius: 10,
          border: 0,
          background: filter === "month" ? "#136f39" : "#ddd",
          color: filter === "month" ? "#fff" : "#000",
        }}
      >
        Monat
      </button>
    </div>
  );
}
