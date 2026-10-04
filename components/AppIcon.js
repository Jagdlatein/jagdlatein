const aliases = {
  wildkunde: "deer", "waffen-sicherheit": "target", jagdpraxis: "practice",
  "natur-revier": "leaf", hundewesen: "paw", "wildbret-gesundheit": "health",
  jagdrecht: "law", "pruefung-sprache": "book", "wald-pflanzen": "tree",
  "landwirtschaft-lebensraeume": "wheat", "ausruestung-technik": "compass",
  "tierschutz-verantwortung": "shield", courses: "book", glossary: "book",
  ebook: "book", quiz: "target", daily: "calendar", stats: "chart",
};

export default function AppIcon({ name = "book", size = 24, className, style }) {
  const icon = aliases[name] || name;
  if (icon.startsWith("flag-")) {
    const country = icon.slice(5);
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className} style={style}>
        {country === "DE" ? <><path fill="#252b29" d="M3 5h18v5H3z" /><path fill="#b93b36" d="M3 10h18v5H3z" /><path fill="#d6af49" d="M3 15h18v4H3z" /></>
          : country === "AT" ? <><path fill="#b93b36" d="M3 5h18v14H3z" /><path fill="#fff" d="M3 10h18v4H3z" /></>
          : <><rect x="4" y="4" width="16" height="16" rx="2" fill="#b93b36" /><path fill="#fff" d="M10 7h4v3h3v4h-3v3h-4v-3H7v-4h3z" /></>}
        {country !== "CH" && <rect x="3" y="5" width="18" height="14" rx="1" fill="none" stroke="#796021" strokeOpacity=".15" />}
      </svg>
    );
  }
  const accent = "var(--icon-accent, #aa812b)";
  const shapes = {
    deer: <><path d="M8 13 6 8V3m0 5L3 6V4m3 1 3-2m7 10 2-5V3m0 5 3-2V4m-3 1-3-2" /><path d="m8 12 4-2 4 2-1 7-3 3-3-3Z" /><path stroke={accent} d="M10 15h.01M14 15h.01m-3 3h2" /></>,
    target: <><circle cx="11" cy="13" r="8" /><circle cx="11" cy="13" r="4" /><path stroke={accent} d="m11 13 9-9m-4 0h4v4" /></>,
    practice: <><path d="M5 5h4l1 7 4 2v5H4v-5l1-5Z" /><path stroke={accent} d="M15 3h4l1 7 2 1v4h-5l-3-2m-8 6v2h8" /><path d="M5 14h5" /></>,
    leaf: <><path d="M20 3C9 2 3 7 4 14c1 5 6 7 10 4 4-3 5-8 6-15Z" /><path stroke={accent} d="M3 22 16 8m-6 7-1-5m1 5h5" /></>,
    paw: <><ellipse cx="5" cy="9" rx="2" ry="2.7" /><ellipse cx="10" cy="5" rx="2" ry="2.7" /><ellipse cx="16" cy="6" rx="2" ry="2.7" /><ellipse cx="20" cy="11" rx="2" ry="2.7" /><path stroke={accent} d="M6 18c0-2 4-6 6-6s6 4 6 6c0 4-4 2-6 2s-6 2-6-2Z" /></>,
    health: <><path d="M12 3 4 6v6c0 4 3 7 8 9 5-2 8-5 8-9V6Z" /><path stroke={accent} d="M12 8v8m-4-4h8" /></>,
    law: <><path d="M12 3v18m-5 0h10M4 7h16M6 7l-3 7h6Zm12 0-3 7h6Z" /><path stroke={accent} d="M3 14c0 4 6 4 6 0m6 0c0 4 6 4 6 0" /></>,
    book: <><path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15" /><path stroke={accent} d="M5 8h4m-4 4h4m6-4h4m-4 4h4" /></>,
    tree: <><path d="m12 2-6 7h3l-5 6h5l-5 4h16l-5-4h5l-5-6h3Z" /><path stroke={accent} d="M12 15v7m-3 0h6" /></>,
    wheat: <><path d="M12 22V7m0 1c-3-1-5-3-5-6 3 0 5 3 5 6Zm0 5c-4 0-7-2-7-6 4 0 7 2 7 6Zm0 6c-4 0-7-2-7-6 4 0 7 2 7 6Z" /><path stroke={accent} d="M12 8c3-1 5-3 5-6-3 0-5 3-5 6Zm0 5c4 0 7-2 7-6-4 0-7 2-7 6Zm0 6c4 0 7-2 7-6-4 0-7 2-7 6Z" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path stroke={accent} d="m16 8-2 6-6 2 2-6Z" /><path d="M12 3v2m0 14v2M3 12h2m14 0h2" /></>,
    shield: <><path d="M12 3 4 6v6c0 4 3 7 8 9 5-2 8-5 8-9V6Z" /><path stroke={accent} d="M12 16s-5-3-5-6a2.8 2.8 0 0 1 5-1.5A2.8 2.8 0 0 1 17 10c0 3-5 6-5 6Z" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18" /><path stroke={accent} d="m8 15 3 3 5-5" /></>,
    chart: <><path d="M3 3v18h18" /><path stroke={accent} d="M7 17v-6m5 6V7m5 10V4" /></>,
    progress: <><path d="M4 6h5m6 0h5M4 12h5m6 0h5M4 18h5m6 0h5" /><path stroke={accent} d="m10 5 2 2 3-4m-5 8 2 2 3-4m-5 8 2 2 3-4" /></>,
    home: <><path d="m3 10 9-8 9 8M5 9v12h14V9" /><path stroke={accent} d="M9 21v-8h6v8" /></>,
    account: <><circle cx="12" cy="7" r="4" /><path stroke={accent} d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    community: <><circle cx="9" cy="7" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2" /><path stroke={accent} d="M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 4 5v1" /><path d="M8 18h2" /></>,
    "arrow-right": <path d="M4 12h16m-6-6 6 6-6 6" />,
    "arrow-left": <path d="M20 12H4m6-6-6 6 6 6" />,
    moon: <path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z" />,
    wind: <><path d="M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3" /><path stroke={accent} d="M3 16h5a3 3 0 1 1-3 3" /></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" stroke={accent} /></>,
    ruler: <><path d="m3 16 13-13 5 5L8 21Z" /><path stroke={accent} d="m7 12 2 2m2-6 2 2m2-6 2 2m-14 2 2 2" /></>,
    binoculars: <><circle cx="6" cy="16" r="4" /><circle cx="18" cy="16" r="4" /><path d="m2 15 3-11h3l2 11m4 0 2-11h3l3 11M10 12h4" /><path stroke={accent} d="M6 14h.01M18 14h.01" /></>,
    alert: <><path d="m12 3 10 18H2Z" /><path stroke={accent} d="M12 9v5m0 3h.01" /></>,
    camera: <><path d="M3 7h4l2-3h6l2 3h4v14H3Z" /><circle cx="12" cy="13" r="4" stroke={accent} /><path d="M18 10h.01" /></>,
    sound: <><path d="m3 10 5 0 5-4v12l-5-4H3Z" /><path stroke={accent} d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
    search: <><circle cx="10" cy="10" r="6" /><path stroke={accent} d="m15 15 6 6" /></>,
    download: <><path d="M4 16v5h16v-5" /><path stroke={accent} d="M12 3v12m-5-5 5 5 5-5" /></>,
    video: <><rect x="2" y="5" width="14" height="14" rx="2" /><path stroke={accent} d="m16 10 6-4v12l-6-4Z" /></>,
    cube: <><path d="m12 2 9 5v10l-9 5-9-5V7Zm0 10v10M3 7l9 5 9-5" /><path stroke={accent} d="m7 4 9 5v5" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className} style={style}>{shapes[icon] || shapes.book}</svg>;
}
