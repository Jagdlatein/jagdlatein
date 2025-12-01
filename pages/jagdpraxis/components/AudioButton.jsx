export default function AudioButton({ src }) {
  function playSound() {
    const audio = new Audio(src);
    audio.play();
  }

  return (
    <button
      onClick={playSound}
      style={{
        marginTop: 20,
        background: "#1f2b23",
        color: "#fff",
        borderRadius: 12,
        padding: "10px 16px",
        border: "none",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      🔊 Geräusch abspielen
    </button>
  );
}
