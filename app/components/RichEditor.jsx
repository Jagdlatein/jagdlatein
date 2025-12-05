"use client";

export default function RichEditor({ value, onChange }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Text eingeben..."
      style={{
        width: "100%",
        minHeight: 240,
        padding: 12,
        borderRadius: 10,
        fontSize: 16,
        border: "1px solid #ccc",
        resize: "vertical",
      }}
    />
  );
}
