import { learningCategoryDetails } from "./learning-categories";

const allCategories = learningCategoryDetails.map(category => category.slug);
const allCountries = ["DE", "AT", "CH"];

// The same catalog drives the visible shortcuts and the shared learning search.
export const learningTools = [
  { href: "/kurse", icon: "courses", title: "Kurse", description: "Alle Kurse und kompakte Wissenschecks.", categories: allCategories },
  { href: "/quiz-app", icon: "quiz", title: "Quiz", description: "Dein Wissen nach Thema prüfen. Rechtsfragen haben eine eigene Länderwahl.", categories: allCategories, countries: allCountries },
  { href: "/tagesquiz", icon: "daily", title: "Tagesquiz", description: "Jeden Tag eine neue Herausforderung aus dem gemeinsamen Jagdwissen.", categories: allCategories },
  { href: "/jagdpraxis", icon: "practice", title: "Praxis & Simulatoren", description: "Ansprechen, Sicherheit und Entscheidungen üben.", categories: ["jagdpraxis", "wildkunde", "waffen-sicherheit", "natur-revier", "wildbret-gesundheit", "hundewesen", "ausruestung-technik", "tierschutz-verantwortung"] },
  { href: "/glossar", icon: "glossary", title: "Glossar", description: "Jagdsprache und Fachbegriffe nachschlagen.", categories: ["pruefung-sprache"] },
  { href: "/ebook", icon: "ebook", title: "E-Book", aliases: ["Ebook", "E Book", "PDF"], description: "Jagdwissen in Ruhe lesen und vertiefen.", categories: allCategories },
  { href: "/wildkunde", icon: "deer", title: "Wildarten bestimmen", description: "Die Artenübersicht mit Merkmalen und Lebensweisen.", categories: ["wildkunde"] },
  { href: "/jagdrecht", icon: "law", title: "Recht nach Land", description: "Gesetze und regionale Regelungen für Deutschland, Österreich und die Schweiz.", categories: ["jagdrecht"], countries: allCountries },
];

export const legalLearningHubs = [
  { href: "/jagdrecht/de", icon: "flag-DE", title: "Deutsches Jagdrecht", description: "Bundesjagdgesetz, Verordnungen und Landesjagdgesetze für Deutschland.", categories: ["jagdrecht"], countries: ["DE"] },
  { href: "/jagdrecht/at", icon: "flag-AT", title: "Österreichisches Jagdrecht", description: "Landesjagdgesetze, Verordnungen und Jagdkarten der österreichischen Bundesländer.", categories: ["jagdrecht"], countries: ["AT"] },
  { href: "/jagdrecht/ch", icon: "flag-CH", title: "Schweizer Jagdrecht", description: "JSG, JSV, Kantone und Jagdsysteme in der Schweiz.", categories: ["jagdrecht"], countries: ["CH"] },
];

export const learningToolCatalog = [...learningTools, ...legalLearningHubs];
