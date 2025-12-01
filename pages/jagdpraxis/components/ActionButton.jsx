export default function ActionButton({ text, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "14px 20px",
        background: "#1f2b23",
        color: "#fff",
        border: "none",
        borderRadius: 12,
        marginTop: 12,
        fontSize: 17,
        cursor: "pointer",
        fontWeight: "bold"
      }}
    >
      {text}
    </button>
  );
}
