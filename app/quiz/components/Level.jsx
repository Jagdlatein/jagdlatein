export function calcLevel(points) {
  let level = 1;
  let xp = points;
  let next = 1000;

  while (xp >= next) {
    xp -= next;
    level++;
    next = Math.floor(next * 1.5);
  }

  return { level, xp, next };
}

// Alias für Kompatibilität mit Stats-Page
export function getLevel(points) {
  return calcLevel(points);
}

export default function Level({ points }) {
  const { level, xp, next } = calcLevel(points);
  const pct = Math.min(100, (xp / next) * 100);

  return (
    <div>
      <div style={{ fontWeight: 700 }}>Level {level}</div>
      <div
        style={{
          background: "#eee",
          borderRadius: 10,
          height: 6,
          marginTop: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: pct + "%",
            height: "100%",
            background: "#136f39",
          }}
        ></div>
      </div>
      <div style={{ fontSize: 12 }}>
        {xp}/{next} XP
      </div>
    </div>
  );
}
