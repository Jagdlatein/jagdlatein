export default function Level({ points }) {
  const level = Math.floor(points / 1000) + 1;
  const next = level * 1000;
  const progress = Math.min(100, Math.round((points / next) * 100));

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>Level {level}</div>

      <div
        style={{
          width: "100%",
          height: 8,
          background: "#e6e6e6",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#136f39",
            transition: "width 0.3s",
          }}
        />
      </div>

      <div style={{ fontSize: 12, opacity: 0.7 }}>
        {points}/{next} XP
      </div>
    </div>
  );
}
