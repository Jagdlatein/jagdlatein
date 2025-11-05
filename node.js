import * as XLSX from "xlsx";
import fs from "fs";

const data = [
  {
    text: "Welche Feder trägt der Fasan an der Schwanzspitze?",
    a: "Steuerfeder",
    b: "Schwungfeder",
    c: "Deckfeder",
    d: "Daunenfeder",
    correct: 0,
    topic: "Federkunde",
  },
  {
    text: "Welches Stück ist das männliche Reh?",
    a: "Bock",
    b: "Geiß",
    c: "Kitz",
    d: "Schmalreh",
    correct: 0,
    topic: "Rehwild",
  },
  {
    text: "Wie nennt man die Paarungszeit beim Rotwild?",
    a: "Brunft",
    b: "Ranz",
    c: "Rauschzeit",
    d: "Röhren",
    correct: 0,
    topic: "Rotwild",
  },
  {
    text: "Was beschreibt der Begriff 'Lauf' beim Schalenwild?",
    a: "Vorderbein",
    b: "Hinterbein",
    c: "Unterarm",
    d: "Fußwurzel",
    correct: 1,
    topic: "Anatomie",
  },
  {
    text: "Welche Kaliberangabe ist metrisch?",
    a: ".308 Win",
    b: "7x64",
    c: ".30-06",
    d: ".270 Win",
    correct: 1,
    topic: "Waffenkunde",
  },
];

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "QuizImport");
XLSX.writeFile(wb, "quiz_import_template.xlsx");
console.log("📄 XLSX-Datei erstellt: quiz_import_template.xlsx");
