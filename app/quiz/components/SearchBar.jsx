"use client";

export default function SearchBar({ value, onChange }) {
  return (
    <input
      type="text"
      placeholder="🔍 Spieler suchen..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "12px 16px",
        fontSize: 16,
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.15)",
        marginBottom: 16,
      }}
    />
  );
}
