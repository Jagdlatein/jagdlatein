export default function Filters({ filter, setFilter }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
      
      {/* Gesamt */}
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

      {/* Woche */}
      <button
        onClick={() => setFilter("week")}
        style={{
          padding: "8px 14px",
          borderRadius: 10,
          border: 0,
          background: filter === "week" ? "#136f39" : "#ddd",
          color: filter === "week" ? "#fff" : "#000",
        }}
      >
        Woche
      </button>

    </div>
  );
}
