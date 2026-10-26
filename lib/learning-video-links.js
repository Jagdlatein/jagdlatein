// Deliberate lightweight discovery metadata. Do not import video lessons,
// question banks or players into a course or an individual portrait.
export const learningVideoLinks = [
  { id: "fuchs", title: "Fuchs auf Nahrungssuche", kind: "wild", speciesSlugs: ["fuchs"], breedIds: [], moduleIds: ["wissen-ausbau-raubwildoekologie"] },
  { id: "rotwild", title: "Rotwild in engem Kontakt", kind: "wild", speciesSlugs: ["rotwild"], breedIds: [], moduleIds: ["wissen-rotwild-sozialverhalten"] },
  { id: "schwarzwild", title: "Schwarzwild am Waldweg", kind: "wild", speciesSlugs: ["schwarzwild"], breedIds: [], moduleIds: ["wissen-schwarzwild-lebensweise"] },
  { id: "stockente", title: "Stockente bei der Nahrungssuche", kind: "wild", speciesSlugs: ["stockente"], breedIds: [], moduleIds: ["wissen-federwild-beobachtung"] },
  { id: "rehwild", title: "Rehwild im offenen Gelände", kind: "wild", speciesSlugs: ["rehwild"], breedIds: [], moduleIds: ["wissen-rehwild-jahreslauf"] },
  { id: "rehwild-galopp", title: "Rehe in Bewegung", kind: "wild", speciesSlugs: ["rehwild"], breedIds: [], moduleIds: ["wissen-rehwild-jahreslauf"] },
  { id: "dachs-fellpflege", title: "Dachs bei der Körperpflege", kind: "wild", speciesSlugs: ["dachs"], breedIds: [], moduleIds: ["wissen-ausbau-raubwildoekologie"] },
  { id: "biber-schwimmen", title: "Biber am Ufer", kind: "wild", speciesSlugs: ["biber"], breedIds: [], moduleIds: ["wissen-biber-schneidezaehne-2026"] },
  { id: "feldhase-feld", title: "Feldhase auf offenem Boden", kind: "wild", speciesSlugs: ["feldhase"], breedIds: [], moduleIds: ["wissen-ausbau-hasenartige"] },
  { id: "stockente-gefiederpflege", title: "Stockente bei der Gefiederpflege", kind: "wild", speciesSlugs: ["stockente"], breedIds: [], moduleIds: ["wissen-ausbau-federaufbau-funktion-2026"] },
  { id: "eichhoernchen-mauer", title: "Eichhörnchen an einer Hauswand", kind: "wild", speciesSlugs: ["eichhoernchen"], breedIds: [], moduleIds: ["wissen-vertiefung-populationsoekologie"] },
  // Basset Hound has no profile in the current breed corpus. The unnamed dog
  // in the tail clip must not be assigned a breed from its appearance.
  { id: "basset-faehrtenende", title: "Basset: Was ein Fährtenende zeigt", kind: "hund", speciesSlugs: [], breedIds: [], moduleIds: ["wissen-ausbau-hundeteam"] },
  { id: "labrador-signal", title: "Labrador: Ein gelerntes Lautsignal", kind: "hund", speciesSlugs: [], breedIds: ["labrador"], moduleIds: ["wissen-ausbau-hundelernen", "wissen-wachstum-hund-signale-kontext-2026"] },
  { id: "golden-wasser", title: "Golden Retriever: Schwimmen und Tragen", kind: "hund", speciesSlugs: [], breedIds: ["golden"], moduleIds: ["wissen-ausbau-hundeteam"] },
  { id: "rute-kontext", title: "Körpersprache: Die Rute im Zusammenhang", kind: "hund", speciesSlugs: [], breedIds: [], moduleIds: ["wissen-ausbau-hund-koerpersprache-2026"] },
].map(item => ({
  ...item,
  href: item.kind === "wild"
    ? `/lernen/wildtier-videofaelle?eintrag=${encodeURIComponent(item.id)}#video-fall`
    : `/lernen/jagdhund-videos?eintrag=${encodeURIComponent(item.id)}#hundevideo-film`,
}));

const matching = (field, value) => typeof value === "string" ? learningVideoLinks.filter(item => item[field].includes(value)) : [];
export const getWildlifeVideoLinks = slug => matching("speciesSlugs", slug);
export const getDogBreedVideoLinks = id => matching("breedIds", id);
export const getCourseVideoLinks = id => matching("moduleIds", id);
