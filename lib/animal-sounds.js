// Genuine field recordings. Local files are original MP3 recordings or full
// Wikimedia transcodes, with no trimming, synthesis or processing by Jagdlatein.
import { additionalBirdSounds } from "./animal-sounds-birds";
import { additionalMammalSounds } from "./animal-sounds-mammals";
import { additionalGamsSounds } from "./animal-sounds-gams";
const originalAnimalSounds = [
  {
    id: "rothirsch", name: "Rothirsch", scientificName: "Cervus elaphus", group: "Säugetiere",
    src: "/lernen/stimmen/aufnahme-01.mp3", duration: 7.1,
    call: "Röhren", cue: "Ein tiefer, rauer und lang gezogener Laut.",
    explanation: "Hier röhrt ein Rothirsch. Achte auf den tiefen, rauen Klang und die Länge des Lautes. Das Röhren männlicher Hirsche gehört zum Brunftverhalten; ein kurzer bellender Laut wäre kein gleichwertiges Erkennungsmerkmal.",
    context: "In der Brunft kommunizieren männliche Rothirsche auch durch Röhren. Zeitpunkt und Intensität variieren; die Aufnahme belegt keinen bestimmten Zustand eines Hirsches im eigenen Revier.",
    confusion: "Rehwild kann bellen. Aus einem einzelnen unbekannten Laut lässt sich außerdem weder Alter noch jagdliche Freigabe ableiten.",
    author: "Jugrü", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Hirsch_roehrt.ogg",
    recording: "Eigenaufnahme des Urhebers; als Rothirsch-Röhren dokumentiert. Ortsangabe fehlt.",
    modifications: "Vollständige MP3-Transcodierung durch Wikimedia; von Jagdlatein unverändert übernommen.",
    factsUrl: "https://www.deutschewildtierstiftung.de/wildtiere/rothirsch", factsTitle: "Deutsche Wildtier Stiftung: Rothirsch",
    lessonUrl: "/kurse/wissen-rotwild-sozialverhalten",
    options: ["waldkauz", "rothirsch", "rabenkrähe", "stockente"],
  },
  {
    id: "fasan", name: "Fasan", scientificName: "Phasianus colchicus", group: "Vögel",
    src: "/lernen/stimmen/aufnahme-02.mp3", duration: 2.3,
    call: "Ruf", cue: "Ein kurzer, rauer, deutlich abgesetzter Ruf.",
    explanation: "Diese kurze Aufnahme zeigt den Ruf eines Fasans. Er klingt rau und abrupt, ganz anders als die melodischen Strophen der Amsel oder das weiche Gurren der Ringeltaube. Höre den kurzen Ausschnitt ruhig mehrmals.",
    context: "Fasane leben unter anderem in strukturreichen Feldlandschaften mit Deckung. Ihre kurzen Rufe sind von längeren Vogelgesängen zu unterscheiden.",
    confusion: "Ein rauer Klang allein trennt einen Fasan noch nicht sicher von anderen Arten. Rufabfolge, Umgebung und eine Sichtbeobachtung helfen bei einer Bestimmung.",
    author: "Jonathon Jongsma", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Phasianus_colchicus_-_Common_Pheasant_-_XC83152.ogg",
    recording: "USA, 7. Juli 2011; Originalfeldaufnahme XC83152.",
    modifications: "Vollständige MP3-Transcodierung durch Wikimedia; von Jagdlatein unverändert übernommen.",
    factsUrl: "https://www.lbv.de/ratgeber/naturwissen/artenportraits/detail/fasan/", factsTitle: "LBV: Fasan",
    lessonUrl: "/kurse/wissen-federwild-beobachtung",
    options: ["amsel", "ringeltaube", "fasan", "kuckuck"],
  },
  {
    id: "stockente", name: "Stockente", scientificName: "Anas platyrhynchos", group: "Vögel",
    src: "/lernen/stimmen/aufnahme-03.mp3", duration: 3.5,
    call: "Quaken", cue: "Mehrere kurze, quakende Laute in einer Folge.",
    explanation: "Zu hören ist eine Stockente. Die quakende Rufreihe unterscheidet sich vom Gurren der Ringeltaube und vom zweisilbigen Kuckucksruf. Diese Aufnahme ist ein Beispiel für das Rufrepertoire, kein Muster für jeden Laut einer Stockente.",
    context: "Stockenten nutzen Gewässer und deren Umgebung. Weibchen und Männchen haben unterschiedliche Stimmen; das bekannte kräftige Quaken wird besonders mit dem Weibchen verbunden.",
    confusion: "Auch andere Entenarten geben ähnliche Laute ab. Geschlecht, Gefieder, Verhalten und Lebensraum bleiben wichtige zusätzliche Merkmale.",
    author: "Jonathon Jongsma", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Anas_platyrhynchos_-_Mallard_-_XC62258.ogg",
    recording: "Powderhorn Park, Minneapolis, USA, 14. September 2010; Originalfeldaufnahme XC62258.",
    modifications: "Vollständige MP3-Transcodierung durch Wikimedia; von Jagdlatein unverändert übernommen.",
    factsUrl: "https://www.wildtierportal.bayern.de/wildtiere_bayern/101065/index.php", factsTitle: "Wildtierportal Bayern: Stockente",
    lessonUrl: "/kurse/wissen-federwild-beobachtung",
    options: ["stockente", "fasan", "waldkauz", "ringeltaube"],
  },
  {
    id: "ringeltaube", name: "Ringeltaube", scientificName: "Columba palumbus", group: "Vögel",
    src: "/lernen/stimmen/aufnahme-04.mp3", duration: 11.6,
    call: "Gurren", cue: "Dumpfes, weiches Gurren mit wiederkehrendem Rhythmus.",
    explanation: "Im Vordergrund gurrt eine Ringeltaube. Achte auf die weichen, tiefen Töne und die wiederkehrende Rufgruppe. In dieser echten Außenaufnahme ist auch eine Elster im Hintergrund zu hören; gefragt ist die Ringeltaube im Vordergrund.",
    context: "Ringeltauben nutzen Gehölze, Parks und offene Flächen. Ihr rhythmisches Gurren ist oft zu hören, während der Vogel selbst im Baum verborgen bleibt.",
    confusion: "Weitere Taubenarten gurren ebenfalls. Vergleiche die ganze Rufgruppe und ihre Betonung; ein einzelnes tiefes „hu“ genügt nicht.",
    author: "Oona Räisänen (Mysid)", license: "Gemeinfrei", licenseUrl: "https://commons.wikimedia.org/wiki/File:Columba_palumbus_birdsong.ogg#Licensing",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Columba_palumbus_birdsong.ogg",
    recording: "Südfinnland, 20. April 2008; Feldaufnahme mit Elster im Hintergrund.",
    modifications: "Vollständige MP3-Transcodierung durch Wikimedia; von Jagdlatein unverändert übernommen.",
    factsUrl: "https://www.lbv.de/ratgeber/naturwissen/artenportraits/detail/ringeltaube/", factsTitle: "LBV: Ringeltaube",
    lessonUrl: "/kurse/wissen-federwild-beobachtung",
    options: ["rabenkrähe", "kuckuck", "stockente", "ringeltaube"],
  },
  {
    id: "waldkauz", name: "Waldkauz", scientificName: "Strix aluco", group: "Vögel",
    src: "/lernen/stimmen/aufnahme-05.mp3", duration: 61.9,
    call: "Revierruf", cue: "Ein lang gezogener, hohler Ruf mit anschließender Lautfolge.",
    explanation: "Hier hörst du den Revierruf eines Waldkauzes. Die hohlen, lang gezogenen Töne und die anschließende Folge sind anders aufgebaut als das regelmäßige Gurren der Ringeltaube. Waldkäuze besitzen auch scharfe „kuit“-Rufe; diese Aufnahme zeigt nicht ihr gesamtes Repertoire.",
    context: "Der Waldkauz lebt unter anderem in Wäldern, Parks und alten Baumbeständen. Rufe können bei der Revierabgrenzung und bei der Kommunikation zwischen Partnern eine Rolle spielen.",
    confusion: "Nicht jeder nächtliche Ruf stammt vom Waldkauz. Andere Eulenarten und weitere Tiere sind ebenfalls nachts hörbar; die Tageszeit allein bestimmt keine Art.",
    author: "Aubrey John Williams · © The British Library Board", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Tawny_Owl_(Strix_aluco)_(W1CDR0001519_BD8).ogg",
    recording: "Edgeworth, Gloucestershire, England, 18. Januar 1978; British Library W1CDR0001519 BD8.",
    modifications: "Vollständige MP3-Transcodierung durch Wikimedia; von Jagdlatein unverändert übernommen.",
    factsUrl: "https://egeeulen.de/eulenarten/der-waldkauz-strix-aluco/", factsTitle: "EGE: Waldkauz",
    lessonUrl: "/kurse/wissen-federwild-beobachtung",
    options: ["ringeltaube", "waldkauz", "rothirsch", "rabenkrähe"],
  },
  {
    id: "amsel", name: "Amsel", scientificName: "Turdus merula", group: "Vögel",
    src: "/lernen/stimmen/aufnahme-06.mp3", duration: 24.8,
    call: "Gesang", cue: "Melodische, flötende Strophen mit Pausen.",
    explanation: "Diese Aufnahme zeigt den Gesang einer Amsel. Die wechselnden flötenden Strophen mit Pausen unterscheiden sich vom wiederholten kurzen Kuckucksruf und vom rauen Krähenruf. Amselgesang variiert zwischen Individuen; Alarmrufe klingen deutlich anders.",
    context: "Amseln singen häufig von erhöhten Plätzen, etwa aus Baumkronen. Wälder, Parks und Gärten sind typische Beobachtungsorte.",
    confusion: "Andere Drosseln und weitere Singvögel können melodisch singen. Vergleiche mehrere Strophen, den Rhythmus und zusätzliche Beobachtungen.",
    author: "Oona Räisänen (Mysid)", license: "Gemeinfrei", licenseUrl: "https://commons.wikimedia.org/wiki/File:Turdus_merula_2.ogg#Licensing",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Turdus_merula_2.ogg",
    recording: "Wald in Südfinnland, 21. Mai 2007. Der Urheber hat Autogeräusche in der Originalveröffentlichung reduziert.",
    modifications: "Vollständige MP3-Transcodierung durch Wikimedia; von Jagdlatein unverändert übernommen. Vorbearbeitung der Quelle: Autogeräusche reduziert.",
    factsUrl: "https://www.lbv.de/ratgeber/naturwissen/artenportraits/detail/amsel/", factsTitle: "LBV: Amsel",
    lessonUrl: "/kurse/wissen-federwild-beobachtung",
    options: ["fasan", "amsel", "rabenkrähe", "kuckuck"],
  },
  {
    id: "kuckuck", name: "Kuckuck", scientificName: "Cuculus canorus", group: "Vögel",
    src: "/lernen/stimmen/aufnahme-07.mp3", duration: 18.5,
    call: "Ruf", cue: "Eine wiederholte, gut erkennbare zweisilbige Rufgruppe.",
    explanation: "Die wiederholte zweisilbige Rufgruppe gehört hier zum Kuckuck. Sie unterscheidet sich von den wechselnden Strophen der Amsel und der längeren Gurrgruppe der Ringeltaube. Der bekannte „ku-kuck“-Ruf ist der Ruf des Männchens; Weibchen rufen anders.",
    context: "Der Kuckuck ist ein Zugvogel. In Mitteleuropa ist sein bekannter Ruf vor allem im Frühjahr und Frühsommer zu hören; im Winter ist diese Beobachtung kein Normalfall.",
    confusion: "Zwei Silben allein sind kein sicherer Nachweis. Achte auf Klang und Wiederholung; manche Vogelarten können fremde Laute nachahmen.",
    author: "Vladimir Yu. Arkhipov (Arkhivov)", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Cuculus_canorus.ogg",
    recording: "Region Kaluga, Russland, 5. Mai 2009; Eigenaufnahme des Urhebers.",
    modifications: "Vollständige MP3-Transcodierung durch Wikimedia; von Jagdlatein unverändert übernommen.",
    factsUrl: "https://nabu-naturgucker.de/meldeportal/naturbeobachtungen-melden/kuckuck/", factsTitle: "NABU-naturgucker: Kuckuck",
    lessonUrl: "/kurse/wissen-federwild-beobachtung",
    options: ["stockente", "ringeltaube", "kuckuck", "amsel"],
  },
  {
    id: "rabenkrähe", name: "Rabenkrähe", scientificName: "Corvus corone", group: "Vögel",
    src: "/lernen/stimmen/aufnahme-08.mp3", duration: 24.9,
    call: "Krächzen", cue: "Raue, krächzende Rufe mit deutlichen Pausen.",
    explanation: "Diese dokumentierte Feldaufnahme stammt von einer Rabenkrähe. Achte auf die rauen, krächzenden Einzelrufe und die Pausen. Sie unterscheiden sich klar von dem flötenden Amselgesang in unserer Bibliothek; gegenüber anderen Krähenarten reicht „krächzend“ allein nicht aus.",
    context: "Rabenkrähen nutzen verschiedene Lebensräume, auch Gärten, Siedlungen und offene Kulturlandschaften. Die Aufnahme entstand in einem Garten in England.",
    confusion: "Saatkrähen, Nebelkrähen und Kolkraben haben teilweise ähnliche Stimmen. Für eine sichere Bestimmung sind weitere Merkmale und Beobachtungen nötig.",
    author: "Lawrence Shove · © The British Library Board", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Carrion_Crow_(Corvus_corone)_(W1CDR0001425_BD18).ogg",
    recording: "Garten in Culver bei Exeter, Devon, England, 2. April 1961; British Library W1CDR0001425 BD18.",
    modifications: "Vollständige MP3-Transcodierung durch Wikimedia; von Jagdlatein unverändert übernommen.",
    factsUrl: "https://vogeltrainer.nabu.de/vogel/rabenkraehe/", factsTitle: "NABU: Rabenkrähe",
    lessonUrl: "/kurse/wissen-federwild-beobachtung",
    options: ["rabenkrähe", "fasan", "rothirsch", "amsel"],
  },
];

const originalSpecies = { rothirsch: "rotwild", fasan: "fasan", stockente: "stockente", ringeltaube: "ringeltaube", waldkauz: "waldkauz", amsel: "amsel", kuckuck: "kuckuck", "rabenkrähe": "rabenkraehe" };
export const animalSounds = [...originalAnimalSounds.map(sound => ({ ...sound, speciesSlug: originalSpecies[sound.id] || null })), ...additionalBirdSounds, ...additionalMammalSounds, ...additionalGamsSounds];
export const animalSoundById = Object.fromEntries(animalSounds.map(sound => [sound.id, sound]));
export const animalSoundPaths = animalSounds.map(sound => sound.src);

export function shuffledSoundIds(sounds = animalSounds, random = Math.random) {
  const ids = sounds.map(sound => typeof sound === "string" ? sound : sound.id);
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [ids[index], ids[other]] = [ids[other], ids[index]];
  }
  return ids;
}

export function soundFeedback(sound, selectedId) {
  if (selectedId === sound.id) return sound.explanation;
  if (!selectedId) return `Diese Aufnahme gehört zu ${sound.name}. ${sound.explanation}`;
  const selected = animalSoundById[selectedId];
  return `${sound.explanation}${selected ? ` Zum Vergleich – ${selected.name}: ${selected.cue}` : ""}`;
}
