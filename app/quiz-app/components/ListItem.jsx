import Avatar from "./Avatar";
import Flag from "./Flag";
import { getHirschBadge } from "./Badge";
import { getLevel } from "./Level";

export default function ListItem({ item, index }) {
  const badge = getHirschBadge(item.total_points);
  const level = getLevel(item.total_points);

  const medal = index === 0 ? "🥇" :
                index === 1 ? "🥈" :
                index === 2 ? "🥉" : `${index + 1}.`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 18px",
        background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(10px)",
        borderRadius: 16,
        border: "1px solid rgba(0,0,0,0.1)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        gap: 12
      }}
    >

      {/* Platz */}
      <div style={{ fontSize: 26, fontWeight: 700, width: 60 }}>
        {medal}
      </div>

      {/* Avatar */}
      <Avatar username={item.username} />

      {/* Username + Infos */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          {item.username} <Flag country={item.country || "DE"} />
        </div>
        <div style={{ fontSize: 14, opacity: 0.7 }}>
          {badge.icon} {badge.label} • Level {level} • {item.rounds} Runden
        </div>
      </div>

      {/* Punkte */}
      <div style={{
        fontSize: 22,
        fontWeight: 800,
        color: "#136f39",
        minWidth: 100,
        textAlign: "right"
      }}>
        {item.total_points}
      </div>
    </div>
  );
}
