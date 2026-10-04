import { wildlifePhotographs } from "./wildlife-photographs";
// Identified real photographs; provenance is tied to the exact published bytes.
// General modules keep their category cover; these arrays only name species
// that are explicitly discussed in the corresponding course.
const wildlifePhoto = (slug, name, width, height, alt) => ({
  ...wildlifePhotographs[slug === "hirsch" ? "rotwild" : slug],
  name,
  alt,
  caption: `${name} als Bildbeispiel. Vergleiche mehrere sichtbare Merkmale mit der Beschreibung im Lerntext.`,
});

export const learningWildlifePhotos = {
  "wissen-rehwild-jahreslauf": [
    wildlifePhoto("rehwild", "Rehwild", 360, 240, "Ein Rehbock auf einer Wiese"),
  ],
  "wissen-rotwild-sozialverhalten": [
    wildlifePhoto("hirsch", "Rotwild", 1140, 760, "Ein geweihtragender Rothirsch zwischen Bäumen"),
  ],
  "wissen-schwarzwild-lebensweise": [
    wildlifePhoto("schwarzwild", "Schwarzwild", 600, 399, "Ein Wildschwein mit Frischlingen in einem Wildpark"),
  ],
  "wissen-gams-steinbock": [
    wildlifePhoto("gamswild", "Gämse", 600, 461, "Eine Gämse im Schweizer Naturpark Chasseral"),
    wildlifePhoto("steinwild", "Alpensteinbock", 2016, 1344, "Ein Alpensteinbock im Schnee am Creux du Van"),
  ],
  "wissen-federwild-beobachtung": [
    wildlifePhoto("stockente", "Stockente", 330, 455, "Männliche und weibliche Stockente in zwei übereinander dargestellten Aufnahmen"),
    wildlifePhoto("fasan", "Fasan", 330, 220, "Fasanenhahn mit roter Gesichtspartie und gemustertem Gefieder"),
  ],
  "wissen-ausbau-hasenartige": [
    wildlifePhoto("feldhase", "Feldhase", 330, 247, "Feldhase mit langen Ohren auf einer Wiese"),
    wildlifePhoto("wildkaninchen", "Wildkaninchen", 330, 413, "Wildkaninchen im Gras mit im Vergleich zum Feldhasen kürzeren Ohren"),
  ],
  "wissen-ausbau-raubwildoekologie": [
    wildlifePhoto("fuchs", "Rotfuchs", 849, 566, "Rotfuchs mit buschigem Schwanz auf einer Wiese"),
    wildlifePhoto("dachs", "Dachs", 1440, 1440, "Dachs mit schwarz-weiß gestreiftem Kopf"),
    wildlifePhoto("baummarder", "Baummarder", 250, 312, "Baummarder mit hellem Kehlfleck auf einem Baumstumpf"),
  ],
};
