export const learningCategoryDetails = [
  { slug: "wildkunde", title: "Wildkunde", icon: "🦌", description: "Wildarten, Verhalten, Jahreslauf und sichere Beobachtung.", focus: ["Schalenwild", "Federwild", "Raubwild", "Spuren und Jungtiere"] },
  { slug: "waffen-sicherheit", title: "Waffen & Sicherheit", icon: "🎯", description: "Verantwortliche Handhabung, Schießstand und sichere Abläufe.", focus: ["Sicherheitsregeln", "Kugelfang", "Training", "Pflege und Transport"] },
  { slug: "jagdpraxis", title: "Jagdpraxis", icon: "👣", description: "Ansitz, Pirsch, Jagdorganisation und Zusammenarbeit im Revier.", focus: ["Vorbereitung", "Jagdarten", "Anschuss", "Nachsuche organisieren"] },
  { slug: "natur-revier", title: "Natur & Revier", icon: "🌿", description: "Lebensräume verstehen, pflegen und ihre Entwicklung beobachten.", focus: ["Biotopverbund", "Gewässer", "Revierpflege", "Monitoring"] },
  { slug: "hundewesen", title: "Hundewesen", icon: "🐕", description: "Jagdhunde von der Auswahl über den Alltag bis zur Zusammenarbeit.", focus: ["Hundetypen und Aufgaben", "Welpen und Lernverhalten", "Ausbildung und Prüfungen", "Gesundheitsbeobachtung"] },
  { slug: "wildbret-gesundheit", title: "Wildbret & Gesundheit", icon: "🥩", description: "Hygiene, Qualität, Rückverfolgbarkeit und Tiergesundheit.", focus: ["Prozesshygiene", "Wildkrankheiten", "Kühlkette", "Qualität beurteilen"] },
  { slug: "jagdrecht", title: "Jagdrecht", icon: "⚖️", description: "Rechtsquellen und Zuständigkeiten in Deutschland, Österreich und der Schweiz.", focus: ["Berechtigung", "Regionale Vorschriften", "Artenschutz", "Nachweise"] },
  { slug: "pruefung-sprache", title: "Prüfung & Sprache", icon: "📖", description: "Fachbegriffe sicher verwenden und Prüfungsfälle begründet lösen.", focus: ["Jägersprache", "Fallfragen", "Wiederholung", "Fehleranalyse"] },
  { slug: "wald-pflanzen", title: "Wald & Pflanzen", icon: "🌲", description: "Baumarten, Waldaufbau, Nahrungspflanzen und Waldverjüngung.", focus: ["Bäume", "Sträucher", "Waldentwicklung", "Verbissbewertung"] },
  { slug: "landwirtschaft-lebensraeume", title: "Landwirtschaft & Lebensräume", icon: "🌾", description: "Agrarjahr, Grünland, Wildtierrettung und Vielfalt in der Feldflur.", focus: ["Kulturen", "Mahd und Abstimmung", "Hecken und Feldraine", "Agrarbiotope"] },
  { slug: "ausruestung-technik", title: "Ausrüstung & Technik", icon: "🧭", description: "Ausrüstung passend planen und digitale Hilfsmittel bewusst einsetzen.", focus: ["Bekleidung und Schuhe", "Karten und GPS", "Beobachtungstechnik", "Datenschutz"] },
  { slug: "tierschutz-verantwortung", title: "Tierschutz & Verantwortung", icon: "🤝", description: "Gute Entscheidungen, Hilfe für Wildtiere und respektvolle Zusammenarbeit.", focus: ["Waidgerechtigkeit", "Verzicht", "Wildunfälle und Fundtiere", "Revierkommunikation"] },
];

export const learningCategories = learningCategoryDetails.map(category => category.title);
export const getLearningCategory = slug => learningCategoryDetails.find(category => category.slug === slug);
export const getLearningCategoryByTitle = title => learningCategoryDetails.find(category => category.title === title);
