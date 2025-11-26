"use client";

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      gap: 10,
      marginTop: 20
    }}>
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          background: page === 1 ? "#ccc" : "#136f39",
          color: "white",
          border: "none",
          cursor: page === 1 ? "default" : "pointer"
        }}
      >
        ◀
      </button>

      <span style={{ fontSize: 18, marginTop: 6 }}>
        Seite {page} / {pages}
      </span>

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === pages}
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          background: page === pages ? "#ccc" : "#136f39",
          color: "white",
          border: "none",
          cursor: page === pages ? "default" : "pointer"
        }}
      >
        ▶
      </button>
    </div>
  );
}
