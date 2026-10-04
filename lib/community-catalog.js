import { learningCategoryDetails } from "./learning-categories";

export const communityCategories = [
  { slug: "allgemein", title: "Gemeinsam lernen", description: "Lernideen, Erfahrungen und Austausch unter Lernenden.", icon: "book" },
  ...learningCategoryDetails.map(category => ({ slug: category.slug, title: category.title, description: category.description, icon: category.slug })),
];
export const communityRules = [
  { title: "Respektvoll miteinander lernen", text: "Frage freundlich, erkläre nachvollziehbar und bleibe sachlich. Keine Beleidigungen, Werbung oder politischen Auseinandersetzungen." },
  { title: "Wissen mit Quellen begründen", text: "Nenne bei fachlichen Aussagen eine verlässliche Quelle. Kennzeichne persönliche Erfahrungen und Unsicherheit. Beiträge anderer Lernender sind keine redaktionell geprüften Lerninhalte." },
  { title: "Privatsphäre schützen", text: "Nutze einen Lernnamen. Veröffentliche keine E-Mail-Adressen, Telefonnummern, Klarnamen anderer Personen, genauen Revierorte oder sensible Wildtierstandorte." },
  { title: "Beim Lernen bleiben", text: "Teile Fragen zu Jagdwissen, Wissenschaft, Natur und Prüfungsvorbereitung. Länderbezogene Rechtsfragen brauchen die zuständige Region und eine aktuelle amtliche Quelle." },
  { title: "Verantwortung übernehmen", text: "Beachte Sicherheit, Tierwohl und geltendes Recht. Melde problematische Beiträge; Moderatoren können sie ausblenden. Eine als geklärt markierte Frage ist keine fachliche Freigabe." },
];
export const communityRulesVersion = "2026-10-04";
export const communityPostTypes = [{ id: "question", title: "Frage" }, { id: "discussion", title: "Austausch" }];
