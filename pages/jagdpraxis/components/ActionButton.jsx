export default function ActionButton({ text, onClick, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
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
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.65 : 1,
        fontWeight: "bold"
      }}
    >
      {text}
    </button>
  );
}
