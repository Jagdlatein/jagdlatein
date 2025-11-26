export function getHirschBadge(points) {
  if (points >= 15000) return { label: "Kapitaler Hirsch", icon: "🦌👑", level: 6 };
  if (points >= 10000) return { label: "Starker Hirsch", icon: "🦌", level: 5 };
  if (points >= 5000) return { label: "Spießer", icon: "🦌", level: 4 };
  if (points >= 2000) return { label: "Jährling", icon: "🦌", level: 3 };
  return { label: "Kalb", icon: "🦌", level: 1 };
}
