// Server-only projection. Course pages receive just their own audited pictures;
// neither the full species catalogue nor unrelated photographs enter that payload.
import { wildlifePhotographs } from "./wildlife-photographs";
import { plantPhotos } from "./nature-photos";
import { categoryPhotographs } from "./learning-category-photos";
import { breedPictures } from "./learning-media";
import { wildDetailPhotos } from "./wild-detail-atlas";

const placements = {
  "wissen-ausbau-raubwildoekologie": { "vielfalt": [
    ["wildlife", "fuchs", "Am dokumentierten Rotfuchs sind eine rostbraune Oberseite, dunkle Läufe, aufgerichtete Ohren und ein buschiger Schwanz sichtbar.", "Die Einzelaufnahme zeigt weder einen Beutefang noch den tatsächlichen Speiseplan. Mit dem Dachsfoto besteht kein gemeinsamer Größenmaßstab."],
    ["wildlife", "dachs", "Beim Dachs treten die dunklen Streifen über den Augen zwischen hellen Kopfbereichen deutlich hervor. Daneben ist der gedrungene Körperausschnitt zu sehen.", "Nahaufnahme aus anderer Perspektive als beim Fuchs. Sie belegt weder Baunutzung noch Nahrungssuche oder eine Tierzahl."],
  ] },
  "wissen-federwild-beobachtung": { "vogel-merkmale": [
    ["wildlife", "stockente", "Die Bildtafel zeigt oben den grünköpfigen Stockerpel und unten das braun gemusterte Weibchen. In beiden Ansichten ist ein dunkler blauer Flügelbereich mit heller Begrenzung sichtbar.", "Zusammenstellung zweier Aufnahmen, kein Nachweis eines gemeinsamen Paares. Kein gemeinsamer Größenmaßstab und kein Vergleich verschiedener Jahreskleider."],
    ["wildlife", "fasan", "Das Fasanenporträt zeigt eine rote Gesichtspartie, dunkel schillernde Halsfedern, einen hellen Halsring und deutlich gemusterte Körperfedern.", "Der lange Schwanz ist hier nicht vollständig abgebildet. Das Porträt allein zeigt weder Flugverhalten noch einen Vergleich mit einer Henne.", 1],
  ] },
  "wissen-vertiefung-wild-huehner-nachwuchs": { "feldhuehner": [
    ["wildlife", "rebhuhn", "Am Rebhuhn sind die orangebräunliche Gesichtszeichnung, eine graue Vorderseite und die kontrastreich gezeichneten Flanken sichtbar.", "Ein einzelnes Körperbild belegt weder Kükenpflege noch Familienstruktur. Daraus kein genaues Alter, Geschlecht oder Aufnahmedatum ableiten.", 2],
  ] },
  "wissen-vertiefung-kiefernzapfen-round6-2026": { "zapfenschuppen": [
    ["plant", "waldkiefer", "Am Kiefernzweig sind braune verholzte Zapfen mit teils abstehenden Schuppen zu sehen. Vergleiche diese sichtbaren Schuppen mit der Beschreibung im Text.", "Samenanlagen sind auf dieser Aufnahme nicht sichtbar. Ein Standbild belegt weder feuchteabhängige Bewegung noch die Keimfähigkeit von Samen."],
  ] },
  "wissen-ausbau-federaufbau-funktion-2026": { "feinbau": [
    ["detail", "mallardFeather", "Die Stockentenfeder zeigt einen zentralen Schaft, seitliche Fahnenflächen und viele schräg abzweigende Federäste. Verfolge einen Ast vom Schaft zum Rand.", "Der untere Federkiel liegt außerhalb des Bildes. Mikroskopische Häkchen sind hier nicht einzeln erkennbar; der Text erklärt diese zusätzliche Verzweigungsstufe."],
  ] },
  "wissen-vertiefung-geweih-horn-gewebe-2026": { "gewebe": [
    ["detail", "rehSkull", "Die Seitenansicht des Rehbock-Schädels aus dem Museum Wiesbaden zeigt verzweigte Geweihstangen und ihren Ansatz am Schädel oberhalb der Augenhöhle.", "Das Präparat zeigt keine Basthaut und keinen lebenden Wachstumszustand. Die Zahl der sichtbaren Geweihenden ergibt kein genaues Lebensalter."],
  ] },
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
  "wissen-vertiefung-wild-kleine-beutegreifer": { "marder": [
    ["wildlife", "baummarder", "Beim dokumentierten Baummarder sind der gelbliche Kehlfleck, die dunkle Nase und die hellen Ohrenränder von vorn sichtbar.", "Ein fotografiertes Beispiel unter bestimmten Lichtbedingungen. Für unbekannte Tiere mehrere Merkmale prüfen; der Baumstamm allein bestimmt keine Art."],
    ["wildlife", "steinmarder", "Das Steinmarderbild zeigt einen weiß wirkenden Kehlbereich in seitlicher Ansicht. Vergleiche die sichtbare Zeichnung mit dem Baummarderbeispiel.", "Die vollständige Fleckform ist seitlich nicht zu erkennen. Die veröffentlichte Aufnahme wurde durch Focus-Stacking aus mehreren Fotografien zusammengesetzt."],
  ], "wiesel": [
    ["wildlife", "hermelin", "Am Hermelin ist die schwarze Schwanzspitze trotz brauner Oberseite und heller Unterseite deutlich zu erkennen.", "Die Aufnahme belegt die sichtbare Schwanzzeichnung, weder eine Jagdhandlung noch eine jahreszeitliche Umfärbung."],
  ] },
  "wissen-ausbau-baumarten-waldaufbau": { "nadelmerkmale": [
    ["plant", "fichte", "Am dokumentierten Fichtenzweig sitzen Nadeln an verschiedenen Seiten der Zweigachse. Beschreibe zunächst ihre Anordnung.", "Die Nadelunterseite wird hier nicht gesondert gezeigt. Für den Vergleich mit der Weißtanne weitere Merkmale aus dem Text hinzunehmen."],
  ], "laubmerkmale": [
    ["plant", "stieleiche", "Das Stieleichenfoto zeigt gelappte Blätter und zwei grüne Eicheln mit schuppigen Fruchtbechern an einem gemeinsamen längeren Fruchtstiel.", "Diese Aufnahme zeigt Eicheln, keine Blattgallen. Für die Unterscheidung ähnlicher Eichenarten mehrere Blätter und zugehörige Früchte gemeinsam betrachten."],
  ] },
  "wissen-vertiefung-laubblatt-merkmale-round4-2026": {
    "blatt-oder-blaettchen": [["plant", "eberesche", "Eberesche: Am vorderen Blatt stehen einzelne Blättchen entlang einer gemeinsamen Blattspindel. Vergleiche diese Gliederung mit dem einfachen Rotbuchenblatt.", "Blattansatz und Achselknospe sind nicht klar sichtbar. Aus den roten Früchten folgen hier weder eine Reifebewertung noch eine Aussage zur Verzehrbarkeit.", 1]],
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
  if (kind === "detail") return wildDetailPhotos[key];
  if (kind === "breed") return { ...breedPictures.find(photo => photo.src === `/lernen/${key}.jpg`), width: 2048, height: 1536 };
  return null;
}

export function getCourseLessonPhotos(course) {
  if (!course || !Object.hasOwn(placements, course.id)) return {};
  const output = {};
  for (const [lessonId, items] of Object.entries(placements[course.id])) {
    const lesson = course.lessons.find(lesson => lesson.id === lessonId);
    if (!lesson?.paragraphs?.length) throw new Error(`Missing audited photo lesson: ${course.id}/${lessonId}`);
    output[lessonId] = items.map(([kind, key, caption, limit, afterParagraph = 0]) => {
      const photo = photoRecord(kind, key);
      if (!photo?.src || !photo.author || !photo.license || !photo.licenseUrl || !photo.width || !photo.height) throw new Error(`Missing photo provenance: ${kind}/${key}`);
      let modifications = photo.modifications || "Vorhandene Originalaufnahme; hier proportional und ohne weiteren Bildausschnitt angezeigt.";
      if (kind === "landscape") modifications = `Proportional auf ${photo.width} × ${photo.height} Pixel verkleinert und als JPEG gespeichert. Hier vollständig ohne weiteren Ausschnitt angezeigt; keine generative Bearbeitung.`;
      if (kind === "detail") modifications = "Vorhandene Originalaufnahme proportional verkleinert. Hier ohne die separaten Markierungen des Detailatlas und ohne weiteren Ausschnitt angezeigt; keine generative Bearbeitung.";
      if (kind === "wildlife" && key === "damwild") modifications = `Originalausschnitt von Ellicrum. ${modifications} Hier kein weiterer Ausschnitt.`;
      const author = photo.author === "Giles Laurent" ? "© Giles Laurent · gileslaurent.com"
        : kind === "wildlife" && key === "hermelin" ? "James Lindsey at Ecology of Commanster" : photo.author;
      return {
        id: `${kind}-${key}`, src: photo.src, width: photo.width, height: photo.height,
        alt: caption, caption, limit, afterParagraph,
        author,
        license: photo.license, licenseUrl: photo.licenseUrl,
        sourceUrl: photo.sourceUrl || photo.sourcePage || photo.creditUrl || photo.url,
        modifications,
      };
    });
  }
  return output;
}
