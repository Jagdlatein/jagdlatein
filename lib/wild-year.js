// Monthly windows are editorial orientation bands, not observations of every individual.
// Each claim names the organizations actually checked for that biological statement.
import { wildYearCatalog } from "./wild-year-catalog";
import { wildYearMammalSources, wildYearMammalSpecies } from "./wild-year-mammals-2026-10-27";
import { wildYearBirdSources, wildYearBirdSpecies } from "./wild-year-birds-2026-10-27";
export const wildYearReviewedOn = "2026-10-12";
export const smallGameYearReviewedOn = "2026-10-13";
export const wildYearMonths = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const source = (label, url, organization) => ({ label, url, organization });
export const wildYearSources = {
  ...wildYearMammalSources,
  ...wildYearBirdSources,
  rehBayern: source("Wildtierportal Bayern · Rehwild", "https://www.wildtierportal.bayern.de/wildtiere_bayern/084667/index.php", "stmelf-bayern"),
  rehDJV: source("Deutscher Jagdverband · Reh", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/reh-capreolus-capreolus", "djv"),
  rehStiftung: source("Deutsche Wildtier Stiftung · Reh", "https://www.deutschewildtierstiftung.de/wildtiere/reh", "deutsche-wildtier-stiftung"),
  rotBayern: source("Wildtierportal Bayern · Rotwild", "https://www.wildtierportal.bayern.de/wildtiere_bayern/087879/index.php", "stmelf-bayern"),
  rotDJV: source("Deutscher Jagdverband · Rothirsch", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/rothirsch-cervus-elaphus", "djv"),
  rotStiftung: source("Deutsche Wildtier Stiftung · Rothirsch im Jahreslauf", "https://www.deutschewildtierstiftung.de/Naturschutz/Tier-des-Jahres", "deutsche-wildtier-stiftung"),
  damBayern: source("Wildtierportal Bayern · Damwild", "https://www.wildtierportal.bayern.de/wildtiere_bayern/083840/index.php", "stmelf-bayern"),
  damDJV: source("Deutscher Jagdverband · Damwild", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/damwild-dama-dama", "djv"),
  damZoo: source("Zootier-Lexikon · Europäischer Damhirsch", "https://www.zootier-lexikon.org/saeugetiere-mammalia/paarzeher/hirsche-hirschferkel-und-moschustiere-cervidae-tragulidae-moschidae/europaeischer-damhirsch-dama-dama", "zoo-office-bern"),
  sikaBayern: source("Wildtierportal Bayern · Sikawild", "https://www.wildtierportal.bayern.de/wildtiere_bayern/118649/index.php", "stmelf-bayern"),
  sikaBW: source("Wildforschungsstelle Baden-Württemberg · Sikahirsch", "https://www.wildtierportal-bw.de/de/frontend/product/detail?productId=13", "lazbw"),
  sikaMuseum: source("Museum für Naturkunde Chemnitz · Sikahirsch", "https://museum.naturkundemuseum-chemnitz.de/de/sikahirsch.html", "museum-chemnitz"),
  sikaGoldau: source("Natur- und Tierpark Goldau · Beobachtete Fegezeit", "https://www.tierpark.ch/die-fegezeit-hat-begonnen/", "tierpark-goldau"),
  sikaGoldauFell: source("Natur- und Tierpark Goldau · Streifzüge 143, S. 4–5", "https://www.tierpark.ch/wp/wp-content/uploads/2023/02/20230117_streifzuege_143_web_Links.pdf", "tierpark-goldau"),
  sikaGoldauArt: source("Natur- und Tierpark Goldau · Sikahirsch, Sommer- und Winterfell", "https://www.tierpark.ch/tierarten/sikahirsch-2/", "tierpark-goldau"),
  sauBayern: source("Wildtierportal Bayern · Schwarzwild", "https://www.wildtierportal.bayern.de/wildtiere_bayern/084682/index.php", "stmelf-bayern"),
  sauStiftung: source("Deutsche Wildtier Stiftung · Wildschwein", "https://www.deutschewildtierstiftung.de/wildtiere/wildschwein", "deutsche-wildtier-stiftung"),
  sauDJV: source("Deutscher Jagdverband · Wildschwein", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/wildschwein-sus-scrofa", "djv"),
  sauGoldau: source("Natur- und Tierpark Goldau · Wildschwein", "https://www.tierpark.ch/tierarten/wildschwein/", "tierpark-goldau"),
  muffBayern: source("Wildtierportal Bayern · Muffelwild", "https://www.wildtierportal.bayern.de/wildtiere_bayern/096779/index.php", "stmelf-bayern"),
  muffDJV: source("Deutscher Jagdverband · Mufflon", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/mufflon-ovis-ammon-musimon", "djv"),
  muffGoldau: source("Natur- und Tierpark Goldau · Mufflon", "https://www.tierpark.ch/tierarten/mufflon-2/", "tierpark-goldau"),
  muffGoldauFell: source("Natur- und Tierpark Goldau · Dokumentierter Fellwechsel", "https://www.tierpark.ch/wp/wp-content/uploads/2018/06/MM_Mufflon_NTPG_170518.pdf", "tierpark-goldau"),
  muffNieder: source("Tierpark Niederfischbach · Das Mufflon, Fell S. 12–13", "https://www.tierpark-niederfischbach.de/wp-content/uploads/DAS-MUFFLON.pdf", "tierpark-niederfischbach"),
  gamsBayern: source("Wildtierportal Bayern · Gamswild", "https://www.wildtierportal.bayern.de/wildtiere_bayern/085402/index.php", "stmelf-bayern"),
  gamsDJV: source("Deutscher Jagdverband · Gämse", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/gaemse-rupicapra-rupicapra", "djv"),
  gamsPark: source("Schweizerischer Nationalpark · Gämse", "https://nationalpark.ch/flora-und-fauna/gaemse/", "schweizerischer-nationalpark"),
  steinBayern: source("Wildtierportal Bayern · Steinwild", "https://www.wildtierportal.bayern.de/wildtiere_bayern/143521/index.php", "stmelf-bayern"),
  steinPark: source("Schweizerischer Nationalpark · Steinbock", "https://nationalpark.ch/flora-und-fauna/steinbock/", "schweizerischer-nationalpark"),
  steinFocus: source("Schweizerischer Nationalpark / SCNAT · FOCUS Steinbock", "https://nationalpark.ch/wp-content/uploads/2023/10/Focus_Steinbock.pdf", "schweizerischer-nationalpark"),
  steinSAC: source("Schweizer Alpen-Club · Tiere der Alpen, Fellwechsel im Frühling", "https://www.sac-cas.ch/assets_shop/files/8/f/8f8f23e8b2c0f84ae4b67b91f32b0a44.pdf", "schweizer-alpen-club"),
  haseDJV: source("Deutscher Jagdverband · Feldhase", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/feldhase-lepus-europaeus", "djv"),
  haseStiftung: source("Deutsche Wildtier Stiftung · Feldhase", "https://www.deutschewildtierstiftung.de/wildtiere/feldhase", "deutsche-wildtier-stiftung"),
  haseLfL: source("Bayerische Landesanstalt für Landwirtschaft · Feldhase", "https://www.lfl.bayern.de/iab/kulturlandschaft/299133/index.php", "stmelf-bayern"),
  haseBayern: source("Wildtierportal Bayern · Feldhase", "https://www.wildtierportal.bayern.de/wildtiere_bayern/102456/index.php", "stmelf-bayern"),
  haseWFS: source("Wildforschungsstelle Baden-Württemberg · Feldhase und Wildkaninchen, S. 2 und 5", "https://www.wildtierportal-bw.de/filefly/api?action=stream&path=%2Fwildarten%2Fpdfs%2F2023-wfs-hase-kaninchen.pdf", "lazbw"),
  dachsDJV: source("Deutscher Jagdverband · Dachs", "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/dachs-meles-meles", "djv"),
  dachsStiftung: source("Deutsche Wildtier Stiftung · Dachs", "https://www.deutschewildtierstiftung.de/wildtiere/dachs", "deutsche-wildtier-stiftung"),
  dachsBayern: source("Wildtierportal Bayern · Dachs", "https://www.wildtierportal.bayern.de/wildtiere_bayern/101575/index.php", "stmelf-bayern"),
  dachsWinterStiftung: source("Deutsche Wildtier Stiftung · Winterruhe und Winterschlaf", "https://www.deutschewildtierstiftung.de/aktuelles/artikel/was-ist-eigentlich-winterschlaf", "deutsche-wildtier-stiftung"),
};
const allMonths = Array.from({ length: 12 }, (_, index) => index + 1);
const phase = (id, months, title, text, sourceIds) => ({ id, months, title, text, sourceIds });
const yearRound = (id, title, text, sourceIds) => [phase(id, allMonths, title, text, sourceIds)];
const coat = (id, texts, sourceIds) => [
  phase(`${id}-winter`, [11,12,1,2,3], "Winterkleid typisch", texts[0], sourceIds),
  phase(`${id}-fruehling`, [4,5], "Frühjahrsübergang", texts[1], sourceIds),
  phase(`${id}-sommer`, [6,7,8], "Sommerkleid typisch", texts[2], sourceIds),
  phase(`${id}-herbst`, [9,10], "Herbstübergang", texts[3], sourceIds),
];
export const wildYearSpecies = [
  {
    slug: "rehwild", name: "Reh", crownLabel: "Geweih", reviewedOn: wildYearReviewedOn,
    coat: coat("reh-fell", ["Meist graubraunes Winterfell.", "Wechsel zum rötlichen Sommerfell; die Übergänge verlaufen individuell.", "Das Fell ist gewöhnlich rötlichbraun.", "Der Wechsel zum graubraunen Winterfell beginnt im Frühherbst."], ["rehDJV","rehStiftung"]),
    crown: [
      phase("reh-bast", [12,1,2,3], "Neubildung im Bast", "Nach dem Herbstabwurf wächst das neue Bockgeweih unter nährender Basthaut.", ["rehBayern","rehStiftung"]),
      phase("reh-fegen", [4,5], "Fegen im Frühjahr", "Am fertigen Geweih wird die abgestorbene Basthaut an Gehölzen abgerieben.", ["rehDJV","rehStiftung"]),
      phase("reh-fest", [6,7,8,9], "Fertiges Bockgeweih", "Das Geweih dient unter anderem bei Auseinandersetzungen um das Territorium.", ["rehDJV","rehStiftung"]),
      phase("reh-abwurf", [10,11], "Herbstlicher Abwurf", "Der Abwurf liegt etwa zwischen Oktober und Dezember; unmittelbar danach beginnt der nächste Zyklus.", ["rehBayern","rehStiftung"]),
    ],
    reproduction: [
      phase("reh-traechtig", [1,2,3,4], "Entwicklung nach der Keimruhe", "Nach der verzögerten frühen Entwicklung wächst der Nachwuchs bis zur Geburt im Mai/Juni heran.", ["rehBayern","rehStiftung"]),
      phase("reh-setzen", [5,6], "Kitze werden gesetzt", "Die typische Geburtszeit liegt im Mai und Juni, häufig mit zwei Kitzen.", ["rehBayern","rehDJV"]),
      phase("reh-brunft", [7,8], "Sommerbrunft", "Die Paarungszeit liegt im Juli/August; danach folgt die verzögerte Embryonalentwicklung, die Keimruhe.", ["rehBayern","rehStiftung"]),
      phase("reh-keimruhe", [9,10,11,12], "Keimruhe und Übergang", "Die frühe Embryonalentwicklung bleibt verzögert; im Dezember/Jahreswechsel geht sie in die weitere Entwicklung über.", ["rehBayern","rehStiftung"]),
    ],
    behavior: [
      phase("reh-sprung", [10,11,12,1,2], "Winterliche Sprünge", "Rehe schließen sich häufiger zu Gruppen zusammen; in offener Landschaft können diese größer sein.", ["rehDJV","rehStiftung"]),
      phase("reh-revier", [3,4,5,6,7,8,9], "Territorien und Mutterfamilien", "Böcke verhalten sich territorial; Ricken leben mit ihren Jungen in Mutterfamilien.", ["rehBayern","rehStiftung"]),
    ],
    uncertainty: "Abwurf und Fegen unterscheiden sich nach Alter und Individuum. Ein Monatswechsel ist keine biologische Grenze.",
  },
  {
    slug: "rotwild", name: "Rothirsch", crownLabel: "Geweih", reviewedOn: wildYearReviewedOn,
    coat: coat("rot-fell", ["Graubraunes, dichteres Winterkleid.", "Übergang vom Winterkleid zum rotbraunen Sommerkleid.", "Das Sommerfell ist typischerweise rotbraun.", "Das Winterkleid wird dichter und graubrauner."], ["rotDJV","rotStiftung"]),
    crown: [
      phase("rot-alt", [9,10,11,12,1], "Hartes Geweih", "Das fertig ausgebildete Geweih wird bis zum nächsten Abwurf getragen.", ["rotBayern","rotDJV"]),
      phase("rot-abwurf", [2,3,4], "Abwurf und Neubeginn", "Spätwinter und Frühjahr sind die typische Abwurfphase; neues Geweih wächst anschließend im Bast.", ["rotBayern","rotDJV"]),
      phase("rot-wachstum", [5,6,7,8], "Wachstum, Verknöcherung, Fegen", "Das Geweih wird neu aufgebaut; bis zur Herbstbrunft ist der Bast gewöhnlich abgefegt.", ["rotBayern","rotDJV"]),
    ],
    reproduction: [
      phase("rot-tragen", [11,12,1,2,3,4], "Trächtigkeit", "Auf die Herbstpaarung folgen etwa achteinhalb bis neun Monate bis zur Geburt.", ["rotBayern","rotDJV"]),
      phase("rot-kaelber", [5,6,7,8], "Geburt und Aufzucht", "Kälber kommen meist im Mai/Juni zur Welt und werden anschließend von der Mutter gesäugt.", ["rotBayern","rotStiftung"]),
      phase("rot-brunft", [9,10], "Herbstbrunft", "September/Oktober: Hirsche imponieren, röhren und konkurrieren um den Zugang zu weiblichen Tieren.", ["rotBayern","rotDJV"]),
    ],
    behavior: yearRound("rot-rudel", "Rudel mit saisonalem Wechsel", "Außerhalb der Brunft leben weibliche Tiere mit Nachwuchs und männliche Hirsche überwiegend in getrennten Gruppen.", ["rotBayern","rotStiftung"]),
    uncertainty: "Quellen nennen für Abwurf und Fegen unterschiedliche Zeitfenster. Deshalb zeigt der Kalender breite Phasen. Wanderungen sind vom jeweiligen Lebensraum abhängig.",
  },
  {
    slug: "damwild", name: "Damhirsch", crownLabel: "Geweih", reviewedOn: wildYearReviewedOn,
    coat: coat("dam-fell", ["Bei wildfarbenen Tieren ist das Fell graubrauner; weiße Flecken sind weniger deutlich.", "Übergang zum Sommerkleid; außerdem kommen helle und dunkle Farbvarianten vor.", "Bei wildfarbenen Tieren fallen die weißen Flecken auf rotbraunem Grund auf.", "Im Übergang zum Winterkleid werden die Flecken gewöhnlich unauffälliger."], ["damDJV","damZoo"]),
    crown: [
      phase("dam-fest", [9,10,11,12,1,2], "Fertiges Schaufelgeweih", "Ausgewachsene Hirsche tragen typischerweise ein schaufelförmiges Geweih; weibliche Tiere keines.", ["damBayern","damZoo"]),
      phase("dam-abwurf", [3,4], "Frühjahrsabwurf", "Das alte Geweih fällt im Frühjahr; die Quellen nennen März/April bis Anfang Mai.", ["damBayern","damDJV","damZoo"]),
      phase("dam-bast", [5,6,7,8], "Neubildung bis zum Spätsommer", "Das Geweih wächst neu und ist gegen Ende des Sommers fertig ausgebildet.", ["damBayern","damDJV"]),
    ],
    reproduction: [
      phase("dam-tragen", [12,1,2,3,4], "Trächtigkeit", "Nach der Herbstpaarung dauert die Trächtigkeit ungefähr 230 Tage.", ["damBayern","damDJV"]),
      phase("dam-kaelber", [5,6,7,8,9], "Geburt und Aufzucht", "Die typische Geburtszeit liegt Ende Mai/Juni; meist wird ein Kalb gesetzt.", ["damBayern","damDJV"]),
      phase("dam-brunft", [10,11], "Spätere Herbstbrunft", "Die Hauptpaarungszeit liegt im Oktober und November, später als beim Rotwild.", ["damBayern","damDJV"]),
    ],
    behavior: yearRound("dam-gruppen", "Gesellige Lebensweise", "Weibliche Tiere mit Nachwuchs und männliche Hirsche können eigene Gruppen bilden; während der Brunft verändert sich die Zusammensetzung.", ["damBayern","damDJV"]),
    uncertainty: "Die Monate sind grobe Fenster. Fellfarbe und Flecken erlauben keine sichere Altersbestimmung; Farbvarianten können erheblich abweichen.",
  },
  {
    slug: "sikawild", name: "Sikahirsch", crownLabel: "Geweih", reviewedOn: wildYearReviewedOn,
    coat: coat("sika-fell", ["Die Sommerflecken sind im Winterkleid weniger auffällig.", "Übergang zum deutlicher gefleckten Sommerkleid.", "Auch erwachsene Sikahirsche zeigen ein geflecktes Sommerfell.", "Beim Übergang zum Winterkleid wird das Fleckenmuster weniger deutlich."], ["sikaMuseum","sikaGoldauArt"]),
    crown: [
      phase("sika-fest", [10,11,12,1,2,3], "Fertiges Hirschgeweih", "Die Hirsche tragen ihr fertiges Geweih bis zum Abwurf im folgenden Frühjahr.", ["sikaBayern","sikaGoldau"]),
      phase("sika-abwurf", [4,5], "Abwurf und Neubildung", "Im April/Mai wird das alte Geweih abgeworfen und das neue unter Bast aufgebaut.", ["sikaBayern","sikaGoldau"]),
      phase("sika-bast", [6,7], "Wachsendes Bastgeweih", "Das neue Geweih wächst während des Sommers unter der lebenden Basthaut.", ["sikaBayern","sikaGoldau"]),
      phase("sika-fegen", [8,9], "Spätsommerlicher Übergang", "Fertigbildung und Fegen fallen etwa in August/September, vor der Herbstbrunft.", ["sikaBayern","sikaGoldau"]),
    ],
    reproduction: [
      phase("sika-tragen", [12,1,2,3,4], "Trächtigkeit", "Auf die Herbstbrunft folgen etwa siebeneinhalb Monate bis zur Geburt.", ["sikaBayern","sikaBW"]),
      phase("sika-kaelber", [5,6,7,8], "Geburt und Aufzucht", "Kälber werden gewöhnlich zwischen Mai und Juli geboren; meist ist es ein einzelnes Kalb.", ["sikaBayern","sikaBW"]),
      phase("sika-brunft", [9,10,11], "Herbstbrunft", "Die Paarungsphase reicht regional von September bis November, häufig mit Schwerpunkt im Oktober.", ["sikaBayern","sikaBW"]),
    ],
    behavior: yearRound("sika-verbaende", "Kleine Verbände, ältere Hirsche allein", "Weibliche Tiere und Nachwuchs leben oft in kleinen Gruppen; ältere Hirsche sind häufiger allein unterwegs.", ["sikaBayern","sikaBW"]),
    uncertainty: "Bayern nennt August als Fegezeit, Goldau dokumentiert September. Gehegebeobachtungen belegen keinen festen Termin für alle freilebenden Tiere.",
  },
  {
    slug: "schwarzwild", name: "Wildschwein", crownLabel: "Gebiss statt Kopfschmuck", reviewedOn: wildYearReviewedOn,
    coat: coat("sau-fell", ["Längere Borsten und Unterwolle bilden das Winterkleid.", "Das Winterhaarkleid weicht dem kürzeren Sommerhaarkleid.", "Kürzere Borsten; junge Frischlinge tragen zunächst helle Längsstreifen.", "Borsten und Unterwolle werden für das Winterkleid aufgebaut."], ["sauBayern","sauStiftung"]),
    crown: yearRound("sau-eckzaehne", "Kein Geweihzyklus", "Auffällige Hauer sind Eckzähne. Sie sind keine Hörner und gehören nicht zu einem jährlichen Geweihabwurf.", ["sauBayern","sauStiftung"]),
    reproduction: [
      phase("sau-frischen", [2,3,4,5], "Häufige Geburtsphase", "Viele Würfe fallen ins Frühjahr. Geburten sind jedoch auch außerhalb dieses Fensters möglich.", ["sauBayern","sauStiftung"]),
      phase("sau-flexibel", [6,7,8,9], "Fortpflanzung bleibt flexibel", "Nahrung und Entwicklungszustand beeinflussen die Fortpflanzung; es gibt keine ausschließlich auf den Winter begrenzte Paarungszeit.", ["sauBayern","sauStiftung"]),
      phase("sau-rausche", [10,11,12,1], "Häufige Paarungsphase", "Herbst und Winter sind häufige Paarungsmonate; nach ungefähr vier Monaten können Frischlinge geboren werden.", ["sauBayern","sauStiftung"]),
    ],
    behavior: yearRound("sau-rotte", "Familienrotten", "Bachen und Jungtiere bilden Rotten. Ältere Keiler leben außerhalb der Paarungsphase häufig allein.", ["sauDJV","sauGoldau"]),
    uncertainty: "Beim Wildschwein überlappen Paarung, Geburt und Aufzucht stärker als bei den Hirscharten. Frischlingsstreifen bezeichnen eine Jugendphase, keinen Kalendermonat.",
  },
  {
    slug: "muffelwild", name: "Mufflon", crownLabel: "Hörner", reviewedOn: wildYearReviewedOn,
    coat: [
      phase("muff-winter", [11,12,1,2,3], "Winterkleid typisch", "Die Widderdecke ist dunkler als im Sommer; der helle Sattelfleck fällt bei Widdern besonders auf.", ["muffDJV","muffNieder"]),
      phase("muff-fruehling", [4,5], "Frühjahrswechsel", "Das Winterhaarkleid weicht dem Sommerhaarkleid. Goldau dokumentierte diesen Vorgang im Mai; das Datum dieser Beobachtung ist kein fester Termin für alle Tiere.", ["muffGoldauFell","muffNieder"]),
      phase("muff-sommer", [6,7,8], "Sommerkleid typisch", "Widder sind oft rot- bis braun gefärbt; weibliche Tiere zeigen eine schlichtere Färbung.", ["muffDJV","muffNieder"]),
      phase("muff-herbst", [9,10], "Herbstlicher Haarwechsel", "Die sommerliche Färbung verändert sich in Richtung der dunkleren Winterdecke.", ["muffDJV","muffNieder"]),
    ],
    crown: yearRound("muff-horn", "Bleibende Hornschnecken", "Die gewundenen Widderhörner werden nicht jährlich abgeworfen. Weibliche Tiere sind oft hornlos oder tragen kurze Hörner.", ["muffBayern","muffDJV"]),
    reproduction: [
      phase("muff-tragen", [1,2,3], "Trächtigkeit", "Auf die Herbstbrunft folgt eine Trächtigkeit von ungefähr fünf bis sechs Monaten.", ["muffBayern","muffDJV"]),
      phase("muff-laemmer", [4,5,6,7,8,9], "Lämmer und Aufzucht", "Lämmer kommen überwiegend im Frühjahr zur Welt; meist wird ein einzelnes Jungtier geboren.", ["muffBayern","muffDJV"]),
      phase("muff-brunft", [10,11,12], "Herbstliche Paarung", "Im Herbst bis Frühwinter suchen Widder die weiblichen Tiere auf und konkurrieren durch Imponieren und Hornkämpfe.", ["muffDJV","muffGoldau"]),
    ],
    behavior: yearRound("muff-gruppen", "Schafe, Lämmer und Widdergruppen", "Weibliche Tiere und Jungtiere leben gesellig. Widder können sich außerhalb der Brunft absondern oder eigene Gruppen bilden.", ["muffBayern","muffGoldau"]),
    uncertainty: "Die Quellen weichen beim Ende des Hornwachstums voneinander ab. Sicher ist: kein jährlicher Abwurf; Hornlänge ist keine verlässliche Altersuhr.",
  },
  {
    slug: "gamswild", name: "Gämse / Gams", crownLabel: "Hörner", reviewedOn: wildYearReviewedOn,
    coat: coat("gams-fell", ["Dunkles Winterfell, bei Böcken mit auffällig langen Rückenhaaren.", "Übergang vom dunklen Winterkleid zum helleren Sommerkleid.", "Das Sommerkleid ist gewöhnlich gelblich- bis braun gefärbt.", "Das Winterkleid wird dunkler; die jahreszeitliche Veränderung betrifft beide Geschlechter."], ["gamsBayern","gamsDJV"]),
    crown: [
      phase("gams-hornwinter", [11,12,1,2,3], "Bleibende Krucken", "Beide Geschlechter behalten ihre Hörner; das Wachstum ist im Winter vermindert beziehungsweise unterbrochen.", ["gamsBayern","gamsDJV"]),
      phase("gams-hornsommer", [4,5,6,7,8,9,10], "Neue Hornabschnitte", "Neue Hornsubstanz entsteht an der Basis. Die gehakten Hörner werden nicht jährlich abgeworfen.", ["gamsBayern","gamsDJV"]),
    ],
    reproduction: [
      phase("gams-tragen", [1,2,3,4], "Trächtigkeit", "Die Brunft im Spätherbst/Frühwinter liegt etwa sechs Monate vor der Geburt.", ["gamsBayern","gamsDJV"]),
      phase("gams-kitze", [5,6,7,8,9,10], "Kitze und Geißrudel", "Die Geburten liegen meist im Mai/Juni. Geißen schließen sich mit ihren Kitzen wieder zu Rudeln zusammen.", ["gamsBayern","gamsDJV"]),
      phase("gams-brunft", [11,12], "Brunft zum Winterbeginn", "Böcke konkurrieren um Geißen; die häufige Hauptphase liegt im November und reicht in den Dezember.", ["gamsBayern","gamsDJV"]),
    ],
    behavior: [
      phase("gams-winterhang", [11,12,1,2,3], "Schneearme Nahrungsplätze", "Hangrichtung und Schneelage bestimmen zugängliche Nahrung; Wald und höhere Lagen können beide genutzt werden.", ["gamsBayern","gamsPark"]),
      phase("gams-sommergruppen", [4,5,6,7,8,9,10], "Geißen mit Nachwuchs", "Geißen und Jungtiere leben in Gruppen; ältere Böcke sind oft allein unterwegs.", ["gamsDJV","gamsPark"]),
    ],
    uncertainty: "Quellen reichen bei der Brunft von Ende Oktober bis Dezember. Schneelage und Exposition zählen mehr als eine starre Höhenregel.",
  },
  {
    slug: "steinwild", name: "Alpensteinbock", crownLabel: "Hörner", reviewedOn: wildYearReviewedOn,
    coat: [
      phase("stein-fell-winter", [11,12,1,2,3], "Winterkleid typisch", "Das dichte Winterkleid isoliert gegen Kälte.", ["steinBayern","steinFocus"]),
      phase("stein-fell-fruehling", [4,5], "Frühjahrsübergang", "Der jährliche Fellwechsel findet im Frühjahr statt; sein Verlauf ist individuell.", ["steinBayern","steinSAC"]),
      phase("stein-fell-sommer", [6,7,8], "Sommerkleid typisch", "Das Sommerkleid ist weniger dicht als das Winterkleid.", ["steinBayern","steinFocus"]),
      phase("stein-fell-herbst", [9,10], "Herbstübergang", "Die Behaarung wird dichter; die Färbung kann nach Alter und Geschlecht abweichen.", ["steinBayern","steinFocus"]),
    ],
    crown: yearRound("stein-horn", "Hörner bei Bock und Geiß", "Beide Geschlechter behalten ihre Hörner. Die kräftig gebogenen Bockhörner sind gewöhnlich größer als die der Geißen.", ["steinBayern","steinPark"]),
    reproduction: [
      phase("stein-tragen", [2,3,4,5], "Trächtigkeit", "Nach der Winterpaarung dauert die Trächtigkeit ungefähr fünfeinhalb Monate.", ["steinBayern","steinFocus"]),
      phase("stein-kitze", [6,7,8,9,10], "Geburt und Aufzucht", "Die typische Geburtsphase liegt im Juni. Meist kommt ein Kitz zur Welt.", ["steinBayern","steinPark"]),
      phase("stein-brunft", [11,12,1], "Winterbrunft", "Die Paarung liegt überwiegend im Dezember, mit Übergängen von Ende November bis Anfang Januar.", ["steinBayern","steinFocus"]),
    ],
    behavior: yearRound("stein-rudel", "Getrennte Rudel, Zusammentreffen zur Brunft", "Böcke und Geißen leben außerhalb der Paarungsphase überwiegend in getrennten Rudeln; zur Brunft suchen Böcke die Geißen auf.", ["steinBayern","steinFocus"]),
    uncertainty: "Die November-/Januaranzeige meint Randbereiche der Brunft, keine durchgehende Paarungsaktivität. Regionaler Schnee verschiebt Raumnutzung und Fellübergänge.",
  },
  {
    slug: "feldhase", name: "Feldhase", coatLabel: "Fell", secondaryLabel: "Nahrung", reviewedOn: smallGameYearReviewedOn,
    coat: [
      phase("hase-winterfell", [11,12,1,2,3], "Oft hellere Winterfärbung", "Das brauntonige Fell wirkt im Winter häufig heller und grauer. Die langen Ohren und Hinterläufe bleiben wichtige Artmerkmale.", ["haseDJV","haseStiftung","haseWFS"]),
      phase("hase-sommerfell", [4,5,6,7,8,9,10], "Braunes Tarnkleid", "Typisch ist eine braune Oberseite mit heller Bauchseite. Die Färbung allein trennt weder Geschlecht noch Lebensalter sicher.", ["haseDJV","haseStiftung","haseWFS"]),
    ],
    crown: [
      phase("hase-winternahrung", [11,12,1,2,3], "Pflanzennahrung auch im Winter", "Erreichbare Pflanzen bleiben die Nahrung. Zum Angebot gehören auch Knospen, Triebe und Rinde; bewachsene Säume bieten Nahrung und Deckung.", ["haseDJV","haseStiftung","haseLfL"]),
      phase("hase-gruennahrung", [4,5,6,7,8,9,10], "Kräuter, Gräser und Kulturpflanzen", "Feldhasen nutzen vielfältige Pflanzen. Ernte und Vegetationsentwicklung verändern das erreichbare Angebot; verbleibende Ränder und Brachen sind deshalb bedeutsam.", ["haseBayern","haseLfL","haseWFS"]),
    ],
    reproduction: [
      phase("hase-rammelbeginn", [11,12,1,2], "Saisonwechsel und früher Beginn", "Nach dem Ausklingen der Nachwuchssaison können neue Paarungen bereits im Winter beginnen. DJV und Wildforschungsstelle nennen Dezember/Januar; die Landesanstalt beschreibt die Fortpflanzung ab Februar.", ["haseDJV","haseWFS","haseLfL"]),
      phase("hase-junge", [3,4,5,6,7,8], "Mehrere Würfe möglich", "Nach ungefähr sechs Wochen Tragzeit werden behaarte, sehende Junge geboren. Häsinnen können in einer Saison mehrfach Nachwuchs bekommen; Junghasen brauchen weiterhin Muttermilch.", ["haseDJV","haseLfL","haseWFS"]),
      phase("hase-spaete-junge", [9,10], "Späte Aufzucht, unterschiedliche Grenzen", "Paarungs- und Geburtszeit sind zu trennen: Auf späte Paarungen folgen erst Wochen später Junge. Die Landesanstalt beschreibt eine Fortpflanzungssaison bis Oktober, DJV und Wildforschungsstelle Paarungen bis August.", ["haseDJV","haseWFS","haseLfL"]),
    ],
    behavior: [
      phase("hase-fruehjahrgruppen", [2,3,4,5], "Rammelgruppen werden sichtbar", "Zur Paarungszeit kommen Hasen in losen Gruppen zusammen. Verfolgungen und Boxbewegungen können dann auch tagsüber beobachtet werden.", ["haseDJV","haseBayern","haseWFS"]),
      phase("hase-sasse", [6,7,8,9,10,11,12,1], "Ruhe in der Sasse", "Eine flache oberirdische Mulde dient als Ruheplatz. Nahrungssuche liegt häufig in Dämmerung und Nacht; Feldhasen graben keine Kaninchenbaue.", ["haseDJV","haseLfL","haseWFS"]),
    ],
    uncertainty: "Die Monatsbänder fassen typische Phasen zusammen, nicht jeden Wurf. Paarung, Geburt und Aufzucht überlappen. Quellen verwenden „Fortpflanzungszeit“ teils für Paarungen, teils für die längere Nachwuchssaison; daraus folgt kein fester letzter Geburtstag.",
  },
  {
    slug: "dachs", name: "Dachs", coatLabel: "Aussehen", secondaryLabel: "Nahrung", reviewedOn: smallGameYearReviewedOn,
    coat: yearRound("dachs-maske", "Maske und grauer Rücken", "Schwarze Längsstreifen auf hellem Kopf, grauer Rücken und dunkle kurze Beine kennzeichnen den Dachs. Ein einzelnes Foto beweist weder Geschlecht noch Alter.", ["dachsDJV","dachsStiftung"]),
    crown: [
      phase("dachs-winterausfluege", [12,1,2], "Winterruhe mit Unterbrechungen", "Die Winterruhe schließt zeitweilige Aktivität und Nahrungssuche nicht aus. Das unterscheidet den Dachs vom echten Winterschlaf des Murmeltiers.", ["dachsBayern","dachsWinterStiftung"]),
      phase("dachs-mischkost", [3,4,5,6,7,8], "Tierische und pflanzliche Kost", "Regenwürmer und Insekten gehören ebenso zum Nahrungsspektrum wie Früchte und andere Pflanzenteile. Der Anteil hängt vom erreichbaren Angebot ab.", ["dachsDJV","dachsStiftung","dachsBayern"]),
      phase("dachs-herbstangebot", [9,10,11], "Fallobst und andere Nahrung", "Fallobst, Früchte und Mais können das Angebot ergänzen. Der Dachs bleibt ein Allesfresser; eine einzelne Fraßstelle zeigt nicht seinen gesamten Speiseplan.", ["dachsDJV","dachsStiftung"]),
    ],
    reproduction: [
      phase("dachs-winterentwicklung", [11,12,1], "Entwicklung nach der Keimruhe", "Die verzögerte frühe Entwicklung endet im Winter; danach wachsen die Embryonen weiter. Keimruhe betrifft die Fortpflanzung und ist kein Schlafzustand der Mutter.", ["dachsDJV","dachsStiftung"]),
      phase("dachs-junge", [2,3,4], "Jungdachse im Bau", "Die Geburtsphase liegt im Spätwinter und frühen Frühjahr. Junge bleiben zunächst im Bau; erst nach mehreren Wochen erkunden sie dessen Umgebung.", ["dachsDJV","dachsStiftung","dachsBayern"]),
      phase("dachs-keimruhe", [5,6,7,8,9,10], "Paarung und Keimruhe", "Paarungen sind über einen langen Zeitraum möglich, nicht nur im Juli/August. Die Keimruhe verschiebt die weitere Embryonalentwicklung bis zum Winter.", ["dachsDJV","dachsStiftung"]),
    ],
    behavior: [
      phase("dachs-winterruhe", [11,12,1,2], "Mehr Zeit im Bau", "Dachse halten Winterruhe, können den Bau jedoch zwischenzeitlich verlassen. Eine winterliche Sichtung widerspricht dieser Strategie nicht.", ["dachsDJV","dachsBayern","dachsWinterStiftung"]),
      phase("dachs-clan", [3,4,5,6,7,8,9,10], "Bau und Familiengruppe", "Dachse können in Familiengruppen leben und größere Bauanlagen nutzen. Viele Zugänge bedeuten nicht automatisch ebenso viele Tiere.", ["dachsDJV","dachsBayern","dachsStiftung"]),
    ],
    uncertainty: "Geburtsangaben reichen von Januar–März (Wildtier Stiftung) bis Ende Februar–Anfang April (DJV); Bayern nennt Februar/März. Auch Aussagen zur Stoffwechselabsenkung weichen ab. Hier wird deshalb nur die übereinstimmend belegte Winterruhe mit möglichen Aktivitätsunterbrechungen erklärt.",
  },
  ...wildYearMammalSpecies,
  ...wildYearBirdSpecies,
];

export function getWildYearProfile(slug = "gamswild", month = 1) {
  const species = wildYearSpecies.find(item => item.slug === slug) || wildYearSpecies.find(item => item.slug === "gamswild");
  const numericMonth = Number(month);
  const normalizedMonth = Number.isInteger(numericMonth) && numericMonth >= 1 && numericMonth <= 12 ? numericMonth : 1;
  const sections = [
    { key: "coat", label: species.coatLabel || "Fell" }, { key: "crown", label: species.secondaryLabel || species.crownLabel },
    { key: "reproduction", label: "Fortpflanzung" }, { key: "behavior", label: "Verhalten" },
  ].map(section => ({ ...section, claim: species[section.key].find(item => item.months.includes(normalizedMonth)) }));
  return { species, month: normalizedMonth, monthName: wildYearMonths[normalizedMonth - 1], sections };
}

export const wildYearSearchEntries = wildYearCatalog.map(entry => {
  const item = wildYearSpecies.find(species => species.slug === entry.slug) || entry;
  const monthly = wildYearSpecies.some(species => species.slug === entry.slug);
  return ({
  id: `wildjahr-${item.slug}`, title: `${item.name} im Wildjahr`, category: "Wildkunde", type: "Werkzeug",
  href: `/lernen/wildjahr?art=${item.slug}`, imageKey: "wildkunde", speciesSlug: item.slug,
  description: monthly ? `Monat wählen: ${item.coatLabel || "Fell"}, ${item.secondaryLabel || item.crownLabel}, Fortpflanzung und Verhalten direkt vergleichen.` : "Bestehendes Artenwissen und belegte Jahreslauftexte direkt lesen. Für diesen Eintrag ist noch kein vollständiger Monatskalender hinterlegt.",
  keywords: monthly ? [item.name, item.slug, "Wildjahr", "Monat", item.secondaryLabel || item.crownLabel, "Jahreslauf", ...(item.slug === "feldhase" ? ["Rammelzeit", "Sasse", "Hasenjunge", "Winterfell"] : item.slug === "dachs" ? ["Grimbart", "Ranz", "Winterruhe", "Keimruhe", "Jungdachs"] : item.coatLabel === "Gefieder" ? ["Gefieder", "Fortpflanzung", "Verhalten"] : ["Brunft", "Setzzeit", "Fellwechsel"])] : [item.name, item.slug, "Wildjahr", "Jahresüberblick", "Artenwissen", "Jahreslauf"],
  });
});
