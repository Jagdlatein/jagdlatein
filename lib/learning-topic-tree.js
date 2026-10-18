import { getLearningCategory } from "./learning-categories";

// Explicit editorial navigation, audited against course descriptions and lesson
// titles on 2026-10-18. These are topics, not inferred biological classifications.
// Reserve only the four already assigned Round 5 courses; no missing course may
// be silently placed in an "other" group.
export const reservedLearningTopicModuleIds = Object.freeze([
  "wissen-pruefung-schilddruese-round5-2026",
  "wissen-pruefung-nebennieren-round5-2026",
  "wissen-vertiefung-samenruhe-keimung-round5-2026",
  "wissen-vertiefung-gallen-blattminen-round5-2026",
]);

export const learningTopicTree = [
  {
    "categorySlug": "wildkunde",
    "groups": [
      {
        "id": "schalenwild",
        "title": "Schalenwild",
        "moduleIds": [
          "wissen-rehwild-jahreslauf",
          "wissen-rotwild-sozialverhalten",
          "wissen-schwarzwild-lebensweise",
          "wissen-gams-steinbock",
          "wissen-vertiefung-wild-alpine-winterstrategien",
          "wissen-vertiefung-wild-hirsche-vergleichen",
          "wissen-vertiefung-wild-schwarzwild-fortpflanzung"
        ]
      },
      {
        "id": "hasen-raubsaeuger",
        "title": "Hasen & Raubsäuger",
        "moduleIds": [
          "wissen-ausbau-hasenartige",
          "wissen-ausbau-raubwildoekologie",
          "wissen-vertiefung-wild-kleine-beutegreifer"
        ]
      },
      {
        "id": "federwild",
        "title": "Federwild",
        "moduleIds": [
          "wissen-federwild-beobachtung",
          "wissen-vertiefung-wild-huehner-nachwuchs",
          "wissen-vertiefung-wild-wasservoegel-jahreslauf"
        ]
      },
      {
        "id": "koerperbau-atmung",
        "title": "Körperbau, Nerven & Atmung",
        "moduleIds": [
          "wissen-pruefung-saeugeratmung-round2-2026",
          "wissen-pruefung-nervensystem-round2-2026",
          "wissen-ausbau-biologie-vogelkoerper-2026",
          "wissen-ausbau-federaufbau-funktion-2026",
          "wissen-ausbau-zahnalter-beweisgrenzen-2026",
          "wissen-vertiefung-geweih-horn-gewebe-2026"
        ]
      },
      {
        "id": "organe-stoffwechsel",
        "title": "Organe & Stoffwechsel",
        "moduleIds": [
          "wissen-pruefung-blutstillung-round4-2026",
          "wissen-pruefung-vogelniere-salz-round4-2026",
          "wissen-pruefung-leber-galle-round3-2026",
          "wissen-ausbau-koerperfunktion-kreislauf-2026",
          "wissen-ausbau-koerperfunktion-niere-2026",
          "wissen-ausbau-biologie-wiederkaeuer-2026",
          "wissen-ausbau-biologie-verdauungsvergleich-2026",
          "wissen-pruefung-schilddruese-round5-2026"
        ]
      },
      {
        "id": "fortpflanzung-vererbung",
        "title": "Fortpflanzung & Vererbung",
        "moduleIds": [
          "wissen-pruefung-milchbildung-round4-2026",
          "wissen-pruefung-keimdruesen-zyklus-round3-2026",
          "wissen-pruefung-vogelembryo-schlupf-2026",
          "wissen-ausbau-koerperfunktion-genetik-2026",
          "wissen-ausbau-biologie-fortpflanzung-2026",
          "wissen-ausbau-wildtiergenetik-2026"
        ]
      },
      {
        "id": "bestaende-beobachtung",
        "title": "Bestände & Beobachtung",
        "moduleIds": [
          "wissen-ausbau-jungtiere-beobachten",
          "wissen-vertiefung-populationsoekologie"
        ]
      }
    ]
  },
  {
    "categorySlug": "waffen-sicherheit",
    "groups": [
      {
        "id": "sicherheitsgrundlagen",
        "title": "Sicherheitsgrundlagen",
        "moduleIds": [
          "wissen-waffensicherheit",
          "wissen-kugelfang",
          "wissen-ausbau-sicherheitskommunikation"
        ]
      },
      {
        "id": "training-aufsicht",
        "title": "Training & Aufsicht",
        "moduleIds": [
          "wissen-ausbau-schiessstandtraining",
          "wissen-vertiefung-sicherheitsroutine-stand"
        ]
      },
      {
        "id": "pflege-kennzeichnung",
        "title": "Pflege, Verwahrung & Kennzeichnung",
        "moduleIds": [
          "wissen-ausbau-waffenorganisation",
          "wissen-ausbau-revierpraxis-beschuss-kennzeichnung-2026",
          "wissen-ausbau-anwendung-sicherheitszeichen-2026"
        ]
      },
      {
        "id": "persoenlicher-schutz",
        "title": "Augen- & Gehörschutz",
        "moduleIds": [
          "wissen-ausbau-augenschutz-2026",
          "wissen-vertiefung-gehoerschutz-passform-2026"
        ]
      },
      {
        "id": "optik-beobachtungsgrenzen",
        "title": "Optik & Beobachtungsgrenzen",
        "moduleIds": [
          "wissen-optik"
        ]
      }
    ]
  },
  {
    "categorySlug": "jagdpraxis",
    "groups": [
      {
        "id": "ansitz-pirsch",
        "title": "Ansitz & Pirsch",
        "moduleIds": [
          "wissen-ansitzplanung",
          "wissen-ausbau-pirschbeobachtung",
          "wissen-vertiefung-ansitz-entscheidungsprotokoll"
        ]
      },
      {
        "id": "jagdorganisation",
        "title": "Jagdorganisation",
        "moduleIds": [
          "wissen-gesellschaftsjagd",
          "wissen-ausbau-rollenabsprachen"
        ]
      },
      {
        "id": "meldung-nachsuche-notruf",
        "title": "Nachsuche, Meldung & Notruf",
        "moduleIds": [
          "wissen-ausbau-anschussmeldung",
          "wissen-ausbau-notruf-revier-2026"
        ]
      },
      {
        "id": "gelaende-wetter-orientierung",
        "title": "Gelände, Wetter & Orientierung",
        "moduleIds": [
          "wissen-vertiefung-luftfeuchte-taupunkt-round3-2026",
          "wissen-vertiefung-kompass-nordrichtungen-2026",
          "wissen-ausbau-anwendung-kartenprofile-2026"
        ]
      },
      {
        "id": "ansitzeinrichtungen",
        "title": "Ansitzeinrichtungen",
        "moduleIds": [
          "wissen-ausbau-revierpraxis-ansitzeinrichtungen-2026"
        ]
      },
      {
        "id": "sehen-beobachten",
        "title": "Sehen & Beobachtungen auswerten",
        "moduleIds": [
          "wissen-ausbau-daemmerungssehen-2026",
          "wissen-vertiefung-kamerastichprobe-2026"
        ]
      }
    ]
  },
  {
    "categorySlug": "natur-revier",
    "groups": [
      {
        "id": "spuren-beobachtung",
        "title": "Spuren & Naturbeobachtung",
        "moduleIds": [
          "wissen-spuren-systematisch",
          "wissen-ausbau-monitoring"
        ]
      },
      {
        "id": "biotopverbund-pflege",
        "title": "Biotopverbund & Revierpflege",
        "moduleIds": [
          "wissen-lebensraeume-biotopverbund",
          "wissen-ausbau-biotoppflege",
          "wissen-vertiefung-revier-jahresplanung"
        ]
      },
      {
        "id": "gewaesser-feuchtgebiete",
        "title": "Gewässer & Feuchtgebiete",
        "moduleIds": [
          "wissen-ausbau-gewaesser-feuchtgebiete",
          "wissen-ausbau-habitat-moore-torf-wasser-2026",
          "wissen-ausbau-oekologie-bachlebensgemeinschaft-2026",
          "wissen-ausbau-gewaesser-sauerstoff-2026"
        ]
      },
      {
        "id": "insekten-pflanzenspuren",
        "title": "Insekten & Lebensspuren an Pflanzen",
        "moduleIds": [
          "wissen-ausbau-habitat-insektenentwicklung-2026",
          "wissen-vertiefung-gallen-blattminen-round5-2026"
        ]
      },
      {
        "id": "wald-wild-mikrohabitate",
        "title": "Wald, Wild & kleine Lebensräume",
        "moduleIds": [
          "wissen-wald-wild",
          "wissen-vertiefung-totholz-mikrohabitate-2026"
        ]
      },
      {
        "id": "wetter-orientierung",
        "title": "Wetter & Orientierung im Revier",
        "moduleIds": [
          "wissen-orientierung",
          "wissen-wetter-wind"
        ]
      }
    ]
  },
  {
    "categorySlug": "hundewesen",
    "groups": [
      {
        "id": "rassen-arbeitsgruppen",
        "title": "Rassen & Arbeitsgruppen",
        "moduleIds": [
          "wissen-ausbau-jagdhundewahl",
          "wissen-vertiefung-jagdhunderassen",
          "wissen-vertiefung-hunde-vorstehrassen",
          "wissen-vertiefung-hunde-bracken-nordische",
          "wissen-vertiefung-hunde-retriever-spaniels"
        ]
      },
      {
        "id": "lernen-ausbildung",
        "title": "Lernen & Ausbildung",
        "moduleIds": [
          "wissen-jagdhunde-aufgaben-ausbildung",
          "wissen-ausbau-hundelernen",
          "wissen-vertiefung-hunde-klare-lernsignale",
          "wissen-wachstum-hund-signale-kontext-2026",
          "wissen-vertiefung-hund-belohnungswert-2026"
        ]
      },
      {
        "id": "nasenarbeit-nachsuche",
        "title": "Nasenarbeit & Nachsuche",
        "moduleIds": [
          "wissen-nachsuche",
          "wissen-ausbau-hundeteam",
          "wissen-vertiefung-hunde-nase-spur-laut"
        ]
      },
      {
        "id": "koerper-sinne",
        "title": "Biologie & Körperfunktionen",
        "moduleIds": [
          "wissen-vertiefung-hund-haut-haarkleid-2026",
          "wissen-ausbau-koerperfunktion-hundeimmunitaet-2026",
          "wissen-ausbau-koerperfunktion-hundebewegung-2026",
          "wissen-ausbau-biologie-hundegebiss-2026",
          "wissen-ausbau-biologie-hundesinne-2026",
          "wissen-pruefung-nebennieren-round5-2026"
        ]
      },
      {
        "id": "alltag-wohlbefinden",
        "title": "Alltag, Versorgung & Wohlbefinden",
        "moduleIds": [
          "wissen-vertiefung-hundeteam-belastung",
          "wissen-ausbau-koerperfunktion-hundethermik-2026",
          "wissen-ausbau-hund-koerpersprache-2026",
          "wissen-ausbau-hund-ruhe-schlaf-2026",
          "wissen-ausbau-hund-ration-koerperkondition-2026"
        ]
      }
    ]
  },
  {
    "categorySlug": "wildbret-gesundheit",
    "groups": [
      {
        "id": "hygiene-rueckverfolgbarkeit",
        "title": "Hygienekette & Rückverfolgbarkeit",
        "moduleIds": [
          "wissen-wildbrethygiene",
          "wissen-ausbau-wildbretprozess",
          "wissen-vertiefung-wildbret-hygienekette",
          "wissen-vertiefung-wildbret-kontaktwege-2026"
        ]
      },
      {
        "id": "qualitaet-lagerung",
        "title": "Fleischqualität & Lagerung",
        "moduleIds": [
          "wissen-ausbau-wildbretqualitaet",
          "wissen-ausbau-anwendung-muskelbiologie-2026",
          "wissen-ausbau-gefrieren-auftauen-2026"
        ]
      },
      {
        "id": "erreger-untersuchungen",
        "title": "Lebensmittelerreger & Untersuchungen",
        "moduleIds": [
          "wissen-ausbau-revierpraxis-lebensmittelbakterien-2026",
          "wissen-ausbau-anwendung-trichinellenlabor-2026",
          "wissen-ausbau-hepatitis-e-2026"
        ]
      },
      {
        "id": "wildkrankheiten-biosicherheit",
        "title": "Wildkrankheiten & Biosicherheit",
        "moduleIds": [
          "wissen-tiergesundheit",
          "wissen-ausbau-wildkrankheiten"
        ]
      },
      {
        "id": "lebensmitteleigenschaften-belastungen",
        "title": "Lebensmittelbedingungen & Belastungen",
        "moduleIds": [
          "wissen-vertiefung-wasseraktivitaet-ph-round4-2026",
          "wissen-ausbau-revierpraxis-blei-wildbret-2026"
        ]
      },
      {
        "id": "zecken-vorsorge",
        "title": "Zecken & Vorsorge",
        "moduleIds": [
          "wissen-ausbau-revierpraxis-zecken-menschen-2026"
        ]
      }
    ]
  },
  {
    "categorySlug": "jagdrecht",
    "groups": [
      {
        "id": "berechtigung-dach",
        "title": "Jagdberechtigung in DACH",
        "moduleIds": [
          "wissen-jagdrecht-de",
          "wissen-jagdrecht-at",
          "wissen-jagdrecht-ch",
          "wissen-ausbau-rechtsquellen"
        ]
      },
      {
        "id": "rechtsquellen-fallpruefung",
        "title": "Rechtsquellen & Fallprüfung",
        "moduleIds": [
          "wissen-vertiefung-recht-pruefmethode",
          "wissen-vertiefung-rechtsfassung-pruefen-2026"
        ]
      },
      {
        "id": "arten-schutzgebiete",
        "title": "Artenschutz & Schutzgebiete",
        "moduleIds": [
          "wissen-ausbau-artenschutz",
          "wissen-ausbau-schutzgebietspruefung-2026"
        ]
      },
      {
        "id": "verantwortung-datenschutz",
        "title": "Verantwortung & Datenschutz",
        "moduleIds": [
          "wissen-ausbau-jagdverantwortung",
          "wissen-ausbau-anwendung-wildkamera-datenschutz-2026"
        ]
      }
    ]
  },
  {
    "categorySlug": "pruefung-sprache",
    "groups": [
      {
        "id": "jaegersprache",
        "title": "Jägersprache",
        "moduleIds": [
          "wissen-jaegersprache",
          "wissen-ausbau-jaegersprache"
        ]
      },
      {
        "id": "lernmethoden-wiederholung",
        "title": "Lernmethoden & Wiederholung",
        "moduleIds": [
          "wissen-pruefungslernen",
          "wissen-ausbau-lernmethoden",
          "wissen-vertiefung-pruefung-lernwerkstatt",
          "wissen-vertiefung-antwortsicherheit-feedback-2026"
        ]
      },
      {
        "id": "pruefungsfaelle",
        "title": "Prüfungsfälle begründen",
        "moduleIds": [
          "wissen-ausbau-pruefungsfaelle"
        ]
      },
      {
        "id": "grundwissen-rechnen",
        "title": "Grundbegriffe, Zahlen & Einheiten",
        "moduleIds": [
          "wissen-ausbau-revierpraxis-groessen-einheiten-2026",
          "wissen-ausbau-anwendung-biologische-ebenen-2026",
          "wissen-ausbau-zahlen-diagramme-pruefung-2026"
        ]
      }
    ]
  },
  {
    "categorySlug": "wald-pflanzen",
    "groups": [
      {
        "id": "baeume-straeucher",
        "title": "Bäume & Sträucher erkennen",
        "moduleIds": [
          "wissen-ausbau-baumarten-waldaufbau",
          "wissen-ausbau-straeucher-jahreslauf",
          "wissen-pruefung-winterknospen-2026"
        ]
      },
      {
        "id": "blaetter-pflanzenfamilien",
        "title": "Blätter, Gräser & Pflanzenfamilien",
        "moduleIds": [
          "wissen-vertiefung-laubblatt-merkmale-round4-2026",
          "wissen-vertiefung-pflanzenfamilien-vier-round4-2026",
          "wissen-vertiefung-graeser-bau-2026"
        ]
      },
      {
        "id": "pflanzenbau-vermehrung",
        "title": "Pflanzenkörper & Vermehrung",
        "moduleIds": [
          "wissen-ausbau-habitat-bluete-samen-frucht-2026",
          "wissen-ausbau-oekologie-holzaufbau-2026",
          "wissen-ausbau-oekologie-blattfunktion-2026",
          "wissen-vertiefung-samenruhe-keimung-round5-2026"
        ]
      },
      {
        "id": "moose-farne-pilze-flechten",
        "title": "Moose, Farne, Pilze & Flechten",
        "moduleIds": [
          "wissen-vertiefung-laubmoose-2026",
          "wissen-vertiefung-farnbau-2026",
          "wissen-ausbau-habitat-flechtenbiologie-2026",
          "wissen-ausbau-pilze-lebensweisen-2026"
        ]
      },
      {
        "id": "waldentwicklung-jahreslauf",
        "title": "Waldentwicklung & Jahreslauf",
        "moduleIds": [
          "wissen-ausbau-waldverjuengung-verbiss",
          "wissen-vertiefung-waldstruktur-standort",
          "wissen-vertiefung-wald-phaenologie-2026"
        ]
      }
    ]
  },
  {
    "categorySlug": "landwirtschaft-lebensraeume",
    "groups": [
      {
        "id": "feldfruechte-pflanzenentwicklung",
        "title": "Feldfrüchte & Pflanzenentwicklung",
        "moduleIds": [
          "wissen-ausbau-agrarjahr",
          "wissen-vertiefung-krautpflanzen-lebensdauer-round4-2026",
          "wissen-ausbau-oekologie-leguminosen-stickstoff-2026"
        ]
      },
      {
        "id": "boden-wasserhaushalt",
        "title": "Böden & Wasserhaushalt",
        "moduleIds": [
          "wissen-pruefung-bodenwasser-wurzelraum-2026",
          "wissen-ausbau-habitat-bodenentwicklung-2026",
          "wissen-ausbau-bodenporen-verdichtung-2026"
        ]
      },
      {
        "id": "hecken-feldraine-bluehflaechen",
        "title": "Hecken, Feldraine & Blühflächen",
        "moduleIds": [
          "wissen-ausbau-feldraine-hecken",
          "wissen-vertiefung-feldflur-bluehkette-2026"
        ]
      },
      {
        "id": "bewirtschaftung-wildtierrettung",
        "title": "Bewirtschaftung & Wildtierrettung",
        "moduleIds": [
          "wissen-ausbau-mahd-wildtierrettung",
          "wissen-vertiefung-feldlandschaft-koordination"
        ]
      },
      {
        "id": "flussbett-sedimente",
        "title": "Flussbett & Sedimente",
        "moduleIds": [
          "wissen-vertiefung-flussbett-sediment-2026"
        ]
      }
    ]
  },
  {
    "categorySlug": "ausruestung-technik",
    "groups": [
      {
        "id": "karten-gps-orientierung",
        "title": "Karten, GPS & Orientierung",
        "moduleIds": [
          "wissen-ausbau-karten-gps",
          "wissen-wachstum-gps-wald-2026",
          "wissen-vertiefung-gnss-hoehenbezug-2026"
        ]
      },
      {
        "id": "bekleidung-einsatzreserven",
        "title": "Bekleidung & Einsatzreserven",
        "moduleIds": [
          "wissen-ausbau-ausruestungsplanung",
          "wissen-vertiefung-outdoor-reserven"
        ]
      },
      {
        "id": "wildkameras-daten",
        "title": "Wildkameras & Daten",
        "moduleIds": [
          "wissen-ausbau-wildkameras"
        ]
      },
      {
        "id": "optik-licht-schall",
        "title": "Optik, Licht & Schall",
        "moduleIds": [
          "wissen-vertiefung-lichtmessgroessen-round4-2026",
          "wissen-vertiefung-schall-pegel-ausbreitung-round3-2026",
          "wissen-ausbau-oekologie-optikphysik-2026"
        ]
      },
      {
        "id": "wetterdaten",
        "title": "Wetterdaten verstehen",
        "moduleIds": [
          "wissen-ausbau-wetterdaten-verstehen-2026"
        ]
      },
      {
        "id": "energie-material",
        "title": "Energie & Material",
        "moduleIds": [
          "wissen-ausbau-habitat-mobile-energie-2026",
          "wissen-vertiefung-korrosion-metalle-round4-2026"
        ]
      }
    ]
  },
  {
    "categorySlug": "tierschutz-verantwortung",
    "groups": [
      {
        "id": "entscheidungen-dialog",
        "title": "Entscheidungen & Dialog",
        "moduleIds": [
          "wissen-ausbau-verantwortungsentscheidungen",
          "wissen-ausbau-naturdialog"
        ]
      },
      {
        "id": "fundtiere-wildunfaelle",
        "title": "Fundtiere & Wildunfälle",
        "moduleIds": [
          "wissen-ausbau-wildunfall-fundtiere",
          "wissen-vertiefung-verantwortung-fundtiere"
        ]
      },
      {
        "id": "tierbewegungen-verbindungen",
        "title": "Tierbewegungen & Verbindungen",
        "moduleIds": [
          "wissen-vertiefung-wildtierquerungen-erfolgskontrolle-2026",
          "wissen-ausbau-oekologie-tierbewegungen-2026"
        ]
      },
      {
        "id": "nacht-vogelschutz",
        "title": "Nachtlebensräume & Vogelschutz",
        "moduleIds": [
          "wissen-ausbau-nachtlebensraum-licht-2026",
          "wissen-vertiefung-vogelglas-praevention-2026"
        ]
      }
    ]
  }
];

const locationByModule = new Map();
for (const branch of learningTopicTree) {
  const category = getLearningCategory(branch.categorySlug);
  if (!category || branch.groups.length < 3 || branch.groups.length > 7) {
    throw new Error(`Ungültige Lernbaum-Kategorie: ${branch.categorySlug}`);
  }
  const groupIds = new Set();
  for (const group of branch.groups) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(group.id) || groupIds.has(group.id)
      || !group.title?.trim() || !group.moduleIds.length) {
      throw new Error(`Ungültiger Lernbereich: ${branch.categorySlug}/${group.id}`);
    }
    groupIds.add(group.id);
    for (const moduleId of group.moduleIds) {
      if (locationByModule.has(moduleId)) throw new Error(`Doppelte Lernbaum-Zuordnung: ${moduleId}`);
      locationByModule.set(moduleId, {
        categorySlug: branch.categorySlug,
        groupId: group.id,
        groupTitle: group.title,
      });
    }
    Object.freeze(group.moduleIds);
    Object.freeze(group);
  }
  Object.freeze(branch.groups);
  Object.freeze(branch);
}
Object.freeze(learningTopicTree);

// Safe to import in a client breadcrumb: no curriculum, lessons or answer keys.
export function getLearningTopicLocation(moduleId) {
  const location = locationByModule.get(moduleId);
  return location ? { ...location } : null;
}

function suppliedModuleIds(modules) {
  if (!Array.isArray(modules)) throw new TypeError("Lernkurse müssen als Liste übergeben werden.");
  const ids = new Set();
  for (const module of modules) {
    if (!module || typeof module.id !== "string" || ids.has(module.id)) {
      throw new Error(`Ungültiger oder doppelter Lernkurs: ${module?.id || ""}`);
    }
    const location = locationByModule.get(module.id);
    if (!location) throw new Error(`Lernkurs ohne Themenbereich: ${module.id}`);
    if (module.category !== undefined && module.category !== getLearningCategory(location.categorySlug)?.title) {
      throw new Error(`Lernkurs in falscher Kategorie: ${module.id}`);
    }
    ids.add(module.id);
  }
  return ids;
}

// Accept the full catalog or a category's existing lightweight course summaries.
// Keep the explicit tree order, omit absent reservations, and never invent links.
export function getLearningTopicGroups(categorySlug, modules) {
  const branch = learningTopicTree.find(item => item.categorySlug === categorySlug);
  if (!branch) return [];
  const ids = suppliedModuleIds(modules);
  return branch.groups.map(group => ({
    id: group.id,
    title: group.title,
    moduleIds: group.moduleIds.filter(moduleId => ids.has(moduleId)),
  })).filter(group => group.moduleIds.length > 0);
}

// Full-catalog build/test guard. Partial category lists use the helper above.
// Removed or renamed courses require an explicit taxonomy change; only the four
// declared author reservations may be absent while their content is prepared.
export function validateLearningTopicTree(modules, { allowReserved = true } = {}) {
  const ids = suppliedModuleIds(modules);
  const reserved = allowReserved ? new Set(reservedLearningTopicModuleIds) : new Set();
  for (const moduleId of locationByModule.keys()) {
    if (!ids.has(moduleId) && !reserved.has(moduleId)) {
      throw new Error(`Lernbaum verweist auf fehlenden Kurs: ${moduleId}`);
    }
  }
  return true;
}
