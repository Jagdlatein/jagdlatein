// Real photographs from the existing Wildkunde image collection.
// Width and height were checked against the original JPEG files.
// General modules keep their category cover; these arrays only name species
// that are explicitly discussed in the corresponding course.
const wildlifePhoto = (slug, name, width, height, alt) => ({
  src: `/wildkunde/${slug}.jpg`,
  name,
  width,
  height,
  alt,
  caption: `${name} als Bildbeispiel. Vergleiche mehrere sichtbare Merkmale mit der Beschreibung im Lerntext.`,
  credit: "Foto aus dem bestehenden Wildkunde-Bildbestand von Jagdlatein.",
});

export const learningWildlifePhotos = {
  "wissen-rehwild-jahreslauf": [
    wildlifePhoto("rehwild", "Rehwild", 360, 240, "Rehbock und weibliches Reh auf einer Wiese"),
  ],
  "wissen-rotwild-sozialverhalten": [
    wildlifePhoto("hirsch", "Rotwild", 1140, 760, "Rotwildgruppe mit einem geweihtragenden Hirsch am Waldrand"),
  ],
  "wissen-schwarzwild-lebensweise": [
    wildlifePhoto("schwarzwild", "Schwarzwild", 600, 399, "Eine Gruppe Wildschweine mit unterschiedlich großen Tieren im Wald"),
  ],
  "wissen-gams-steinbock": [
    wildlifePhoto("gamswild", "Gämse", 600, 461, "Mehrere Gämsen auf felsigem Gelände im Gebirge"),
    wildlifePhoto("steinwild", "Alpensteinbock", 2016, 1344, "Eine Gruppe Alpensteinböcke an einem felsigen Berghang"),
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
    wildlifePhoto("fuchs", "Rotfuchs", 849, 566, "Rotfuchs mit buschigem Schwanz im Schnee"),
    wildlifePhoto("dachs", "Dachs", 1440, 1440, "Dachs mit schwarz-weiß gestreiftem Kopf auf Waldboden"),
    wildlifePhoto("baummarder", "Baummarder", 250, 312, "Baummarder mit hellem Kehlfleck zwischen Ästen eines Baumes"),
  ],
};
