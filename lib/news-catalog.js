export const newsRefreshSeconds = 30 * 60;
export const newsTopics = [
  { id: "science", label: "Wissenschaft", icon: "chart", description: "Forschung, Studien und neue Erkenntnisse über Wildtiere und ihre Lebensräume." },
  { id: "hunting", label: "Jagd", icon: "deer", description: "Wildbiologie, Artenkenntnis und Fachwissen für die jagdliche Praxis." },
  { id: "nature", label: "Natur", icon: "leaf", description: "Wälder, Pflanzen, Vögel und ökologische Zusammenhänge im Revier." },
];
export const newsSources = [
  { id: "lwf", label: "Bayerische Landesanstalt für Wald und Forstwirtschaft", homepage: "https://www.lwf.bayern.de/", feed: "https://www.lwf.bayern.de/rss/rss_lwf_aktuell.xml", country: "DE", domains: ["lwf.bayern.de"], defaultTopic: "nature", upgradeHttp: true },
  { id: "bfw", label: "Bundesforschungszentrum für Wald", homepage: "https://www.bfw.gv.at/", feed: "https://www.bfw.gv.at/feed/", country: "AT", domains: ["bfw.gv.at"], defaultTopic: "science" },
  { id: "vogelwarte", label: "Schweizerische Vogelwarte", homepage: "https://www.vogelwarte.ch/de/", feed: "https://www.vogelwarte.ch/de/feed/?post_type=news", country: "CH", domains: ["vogelwarte.ch"], defaultTopic: "nature" },
  { id: "waldwissen", label: "Waldwissen.net · WSL, BFW, LWF und FVA", homepage: "https://www.waldwissen.net/de/", feed: "https://www.waldwissen.net/de/rss", country: "DACH", domains: ["waldwissen.net"], defaultTopic: "nature" },
  { id: "izw", label: "Leibniz-Institut für Zoo- und Wildtierforschung", homepage: "https://www.izw-berlin.de/", feed: "https://www.izw-berlin.de/de/pressemitteilungen-1499.html", format: "izw-html", country: "DE", domains: ["izw-berlin.de"], defaultTopic: "science" },
  { id: "vetmed", label: "Veterinärmedizinische Universität Wien", homepage: "https://www.vetmeduni.ac.at/", feed: "https://www.vetmeduni.ac.at/universitaet/infoservice/presseinformationen", format: "vetmed-html", country: "AT", domains: ["vetmeduni.ac.at"], defaultTopic: "science" },
];
export function normalizeNewsSearch(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ß/g, "ss").replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u");
}
export function filterNewsItems(items, { query = "", topic = "all", source = "all" } = {}) {
  const terms = normalizeNewsSearch(query).trim().slice(0, 160).split(/\s+/).filter(Boolean);
  return items.filter(item => (topic === "all" || item.topic === topic) && (source === "all" || item.sourceId === source)
    && terms.every(term => normalizeNewsSearch([item.title, item.sourceLabel, newsTopics.find(entry => entry.id === item.topic)?.label].join(" ")).includes(term)));
}
export function formatNewsDate(value, options = {}) {
  const date = new Date(value);
  if (!value || !Number.isFinite(date.getTime())) return "Noch kein erfolgreicher Abruf";
  return new Intl.DateTimeFormat("de-CH", { timeZone: "Europe/Zurich", day: "2-digit", month: "2-digit", year: "numeric", ...(options.withTime ? { hour: "2-digit", minute: "2-digit" } : {}) }).format(date);
}
