export default function Avatar({ username }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "#136f39",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 18,
      }}
    >
      {username?.charAt(0)?.toUpperCase()}
    </div>
  );
}
