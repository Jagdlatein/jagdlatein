export default function ProgressBar({ progress }) {
  return (
    <div style={{ marginTop: 20, background: "#ddd", height: 10, borderRadius: 10 }}>
      <div
        style={{
          width: progress + "%",
          height: 10,
          background: "#caa53b",
          borderRadius: 10,
          transition: "0.3s"
        }}
      ></div>
    </div>
  );
}
