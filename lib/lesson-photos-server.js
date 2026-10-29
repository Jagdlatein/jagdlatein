// Server-only projection. Course pages receive just their own audited pictures;
// neither the full species catalogue nor unrelated photographs enter that payload.
import { wildlifePhotographs } from "./wildlife-photographs";
import { plantPhotos } from "./nature-photos";
import { categoryPhotographs } from "./learning-category-photos";
import { breedPictures } from "./learning-media";

const placements = {
  "wissen-gams-steinbock": { "berg-merkmale": [
    ["wildlife", "gamswild", "Gämse: Die schlanken Hörner enden in deutlich nach hinten gebogenen Spitzen. Auch die helle und dunkle Gesichtszeichnung ist sichtbar.", "Einzelaufnahme; daraus folgen weder ein genaues Alter noch ein bestimmter Monat."],
    ["wildlife", "steinwild", "Alpensteinbock: Kräftige, nach hinten gebogene Hörner mit auffälligen Wülsten stehen dem Gams-Beispiel gegenüber.", "Die beiden Aufnahmen haben keinen gemeinsamen Maßstab. Hornform vergleichen, keine Körpergrößen aus den Bildern berechnen."],
  ] },
  "wissen-ausbau-hasenartige": { "merkmale": [
    ["wildlife", "feldhase", "Am Feldhasen sind lange Ohren mit dunklen Spitzen sichtbar. Beschreibe die Form mehrerer Merkmale zusammen.", "Andere Aufnahmeposition als beim Kaninchen; kein direkter Größenmaßstab und kein Altersnachweis."],
    ["wildlife", "wildkaninchen", "Wildkaninchen im Porträt: Betrachte Ohren, Kopf und den sichtbaren Körperausschnitt neben dem Feldhasen.", "Aufnahme aus Tasmanien als Merkmalsbeispiel; sie zeigt weder einen Bau noch Jungtierentwicklung und belegt keinen DACH-Lebensraum."],
  ] },
  "wissen-vertiefung-wild-hirsche-vergleichen": { "jahresmerkmale": [
    ["wildlife", "damwild", "Am dokumentierten Damhirsch sind helle Deckenflecken und verbreiterte Geweihschaufeln gleichzeitig sichtbar.", "Flecken und Kopfschmuck getrennt beschreiben. Das Foto allein liefert keine genaue Altersangabe oder verlässliche Aufnahmezeit."],
  ] },
  "wissen-vertiefung-wild-kleine-beutegreifer": { "wiesel": [
    ["wildlife", "hermelin", "Am Hermelin ist die schwarze Schwanzspitze trotz brauner Oberseite und heller Unterseite deutlich zu erkennen.", "Die Aufnahme belegt die sichtbare Schwanzzeichnung, weder eine Jagdhandlung noch eine jahreszeitliche Umfärbung."],
  ] },
  "wissen-ausbau-baumarten-waldaufbau": { "nadelmerkmale": [
    ["plant", "fichte", "Am dokumentierten Fichtenzweig sitzen Nadeln an verschiedenen Seiten der Zweigachse. Beschreibe zunächst ihre Anordnung.", "Die Nadelunterseite wird hier nicht gesondert gezeigt. Für den Vergleich mit der Weißtanne weitere Merkmale aus dem Text hinzunehmen."],
  ] },
  "wissen-vertiefung-laubblatt-merkmale-round4-2026": {
    "nervatur": [["plant", "rotbuche", "Am Rotbuchenblatt ist eine längs verlaufende Hauptader mit seitlich abzweigenden Adern sichtbar. Die Spreite bleibt ein zusammenhängendes Blatt.", "Einzelnes Blattbeispiel; Nervatur nicht mit Blattstellung am Zweig oder mit der Zahl von Blättchen verwechseln."]],
    "umriss-rand": [["plant", "haengebirke", "Die Birkenblätter zeigen spitze Randzähne. Notiere den gesägten Rand getrennt von Umriss und Blattgliederung.", "Sichtbarer Blattrand als Beispiel; das Foto ersetzt keine Bestimmung anhand mehrerer Merkmale."]],
  },
  "wissen-vertiefung-jagdhunderassen": { "kurzhaar-drahthaar": [
    ["breed", "deutsch-drahthaar", "Dokumentiertes Drahthaar-Beispiel mit längerer Behaarung am Fang und über den Augen.", "Ausbildungsstand, Gesundheit und individuelle Eignung bleiben auf dem Foto offen."],
  ] },
  "wissen-vertiefung-waldstruktur-standort": { "schichten": [
    ["landscape", "wald-pflanzen", "Laubbedeckter Boden, Stämme und belaubte Kronen besetzen unterschiedliche Höhenbereiche. Vergleiche sie mit den im Text beschriebenen Waldschichten.", "Aus der Stammstärke folgt hier keine sichere Altersangabe; eine Einzelaufnahme belegt keine Bestandsentwicklung."],
  ] },
  "wissen-lebensraeume-biotopverbund": { "biotop-funktion": [
    ["landscape", "natur-revier", "Offene Wiese und dichter Gehölzrand liegen unmittelbar nebeneinander. Beschreibe zuerst diese sichtbaren Strukturen.", "Die tatsächliche Nutzung durch einzelne Tierarten und eine Vernetzungswirkung bleiben im Standbild offen."],
  ] },
};

function photoRecord(kind, key) {
  if (kind === "wildlife") return wildlifePhotographs[key];
  if (kind === "plant") return plantPhotos[key];
  if (kind === "landscape") return categoryPhotographs[key];
  if (kind === "breed") return { ...breedPictures.find(photo => photo.src === `/lernen/${key}.jpg`), width: 2048, height: 1536 };
  return null;
}

export function getCourseLessonPhotos(course) {
  if (!course || !Object.hasOwn(placements, course.id)) return {};
  const output = {};
  for (const [lessonId, items] of Object.entries(placements[course.id])) {
    const lesson = course.lessons.find(lesson => lesson.id === lessonId);
    if (!lesson?.paragraphs?.length) throw new Error(`Missing audited photo lesson: ${course.id}/${lessonId}`);
    output[lessonId] = items.map(([kind, key, caption, limit]) => {
      const photo = photoRecord(kind, key);
      if (!photo?.src || !photo.author || !photo.license || !photo.licenseUrl || !photo.width || !photo.height) throw new Error(`Missing photo provenance: ${kind}/${key}`);
      let modifications = photo.modifications || "Vorhandene Originalaufnahme; hier proportional und ohne weiteren Bildausschnitt angezeigt.";
      if (kind === "landscape") modifications = `Proportional auf ${photo.width} × ${photo.height} Pixel verkleinert und als JPEG gespeichert. Hier vollständig ohne weiteren Ausschnitt angezeigt; keine generative Bearbeitung.`;
      if (kind === "wildlife" && key === "damwild") modifications = `Originalausschnitt von Ellicrum. ${modifications} Hier kein weiterer Ausschnitt.`;
      const author = photo.author === "Giles Laurent" ? "© Giles Laurent · gileslaurent.com"
        : kind === "wildlife" && key === "hermelin" ? "James Lindsey at Ecology of Commanster" : photo.author;
      return {
        id: `${kind}-${key}`, src: photo.src, width: photo.width, height: photo.height,
        alt: caption, caption, limit, afterParagraph: 0,
        author,
        license: photo.license, licenseUrl: photo.licenseUrl,
        sourceUrl: photo.sourceUrl || photo.sourcePage || photo.creditUrl || photo.url,
        modifications,
      };
    });
  }
  return output;
}
