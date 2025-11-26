"use client";

export default function Filters({ active, onChange }) {
  const tabs = [
    ["today", "Heute"],
    ["week", "Woche"],
    ["month", "Monat"],
    ["year", "Jahr"],
    ["all", "Gesamt"]
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        marginBottom: 22,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.12)",
      }}
    >
      {tabs.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{
            padding: "12px 0",
            fontSize: 16,
            fontWeight: 600,
            background: active === key ? "#136f39" : "#eee",
            color: active === key ? "white" : "#333",
            border: "none",
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
