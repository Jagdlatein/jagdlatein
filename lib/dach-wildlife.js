// Eigene Lernzusammenfassungen; bestehende überprüfte Artenporträts bleiben erhalten.
const legacyRecords = [
  {
    "name": "Rotwild",
    "slug": "rotwild",
    "scientificName": "Cervus elaphus",
    "group": "Schalenwild",
    "identification": "Sommerdecke rotbraun, Winterdecke graubraun · Nur Hirsche tragen normalerweise ein Geweih · Hirsche werfen ihr Geweih im späten Winter oder Frühjahr ab",
    "habitat": "Lebensräume reichen von der Küste bis ins Gebirge; heute häufig große Waldgebiete.",
    "biology": [
      "Große Hirschart; Hirsche sind meist schwerer als weibliche Tiere",
      "Lebensräume reichen von der Küste bis ins Gebirge; heute häufig große Waldgebiete",
      "Wiederkäuer: Gräser, Kräuter, Triebe und Rinde",
      "Meist getrennte Hirsch- und Kahlwildrudel; zum Kahlwild gehören weibliche Tiere und Jungtiere",
      "Sommerdecke rotbraun, Winterdecke graubraun",
      "Nur Hirsche tragen normalerweise ein Geweih",
      "Grandeln sind die zurückgebildeten oberen Eckzähne",
      "Hauptbrunft im September und Oktober"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/087879/index.php"
      },
      {
        "title": "DJV: Rothirsch",
        "url": "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/rothirsch-cervus-elaphus"
      },
      {
        "title": "Kierdorf et al.: Rothirschgebiss",
        "url": "https://www.researchgate.net/publication/225782588_Supernumerary_incisiform_tooth_in_a_red_deer_Cervus_elaphus_L"
      }
    ]
  },
  {
    "name": "Damwild",
    "slug": "damwild",
    "scientificName": "Dama dama",
    "group": "Schalenwild",
    "identification": "Fellfarben variieren von hell bis sehr dunkel · Helle Flecken sind besonders im rotbraunen Sommerfell sichtbar · Ältere Hirsche tragen ein charakteristisches Schaufelgeweih; die Entwicklung ist individuell unterschiedlich",
    "habitat": "Bevorzugt lichte Wälder im Wechsel mit Offenland.",
    "biology": [
      "Mittelgroße Hirschart; Hirsche können etwa 100 kg, weibliche Tiere etwa 60 kg erreichen",
      "Bevorzugt lichte Wälder im Wechsel mit Offenland",
      "Lebt meist in getrennten Hirsch- und Kahlwildrudeln",
      "Wiederkäuer mit Gräsern, Kräutern, Trieben und Baumfrüchten im Nahrungsspektrum",
      "Fellfarben variieren von hell bis sehr dunkel",
      "Helle Flecken sind besonders im rotbraunen Sommerfell sichtbar",
      "Ältere Hirsche tragen ein charakteristisches Schaufelgeweih; die Entwicklung ist individuell unterschiedlich",
      "Hauptbrunft im Oktober und November"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/083840/index.php"
      }
    ]
  },
  {
    "name": "Rehwild",
    "slug": "rehwild",
    "scientificName": "Capreolus capreolus",
    "group": "Schalenwild",
    "identification": "Kleine heimische Hirschart mit schmalem Vorderkörper und kräftigen Hinterläufen · Der Bock trägt ein jährlich erneuertes Gehörn; Endenzahl und Stärke sind keine sichere Altersuhr · Gehörn wird im Herbst abgeworfen und anschließend neu gebildet",
    "habitat": "Besiedelt Wald-Feld-Mosaike, unterholzreiche Wälder und auch offene Agrarlandschaften.",
    "biology": [
      "Kleine heimische Hirschart mit schmalem Vorderkörper und kräftigen Hinterläufen",
      "Besiedelt Wald-Feld-Mosaike, unterholzreiche Wälder und auch offene Agrarlandschaften",
      "Wiederkäuer; wählt bevorzugt leicht verdauliche Kräuter, Blätter, Knospen und junge Triebe",
      "Böcke verhalten sich im Sommer territorial",
      "Im Herbst und Winter häufig Gruppen, die Sprünge heißen",
      "Der Bock trägt ein jährlich erneuertes Gehörn; Endenzahl und Stärke sind keine sichere Altersuhr",
      "Schrecken klingt wie kurzes Bellen und kann von beiden Geschlechtern stammen",
      "Brunft im Juli und August"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/084667/index.php"
      },
      {
        "title": "DJV: Reh",
        "url": "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/reh-capreolus-capreolus"
      }
    ]
  },
  {
    "name": "Schwarzwild",
    "slug": "schwarzwild",
    "scientificName": "Sus scrofa",
    "group": "Schalenwild",
    "identification": "Suhlen dienen unter anderem der Abkühlung und Körperpflege",
    "habitat": "Wildschwein: anpassungsfähiger Allesfresser in Wald, Feldflur und weiteren Lebensräumen. Wühlschäden können Wiesen und landwirtschaftliche Kulturen betreffen.",
    "biology": [
      "Wildschwein: anpassungsfähiger Allesfresser in Wald, Feldflur und weiteren Lebensräumen",
      "Nahrung überwiegend pflanzlich, ergänzt durch Wirbellose, kleine Wirbeltiere und Aas",
      "Vorwiegend dämmerungs- und nachtaktiv, abhängig von Störungen auch tagsüber",
      "Frischlinge haben in den ersten Monaten gelblich-braune Längsstreifen",
      "Bachen und Jungtiere leben in Rotten; erwachsene Keiler häufig einzeln",
      "Keiler: Haderer im Oberkiefer; Gewehre (Hauer) im Unterkiefer",
      "Gute Geruchs- und Gehörleistung",
      "Wühlschäden können Wiesen und landwirtschaftliche Kulturen betreffen"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/084682/index.php"
      },
      {
        "title": "Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)",
        "url": "https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf"
      }
    ]
  },
  {
    "name": "Muffelwild",
    "slug": "muffelwild",
    "scientificName": "Ovis musimon",
    "group": "Schalenwild",
    "identification": "Wildschaf; mitteleuropäische Vorkommen gehen auf Einbürgerungen zurück",
    "habitat": "Bevorzugt trockene, übersichtliche Lebensräume mit lichten Wäldern und felsigen Rückzugsbereichen.",
    "biology": [
      "Wildschaf; mitteleuropäische Vorkommen gehen auf Einbürgerungen zurück",
      "Bevorzugt trockene, übersichtliche Lebensräume mit lichten Wäldern und felsigen Rückzugsbereichen",
      "Widder und Schafe leben außerhalb der Brunft meist in getrennten Rudeln",
      "Widder tragen gedrehte Hörner, die Schnecken heißen",
      "Schafe haben kleine Hörner oder sind hornlos",
      "Hörner werden nicht jährlich abgeworfen",
      "Typisch beim Widder ist der helle Sattelfleck, auch Schabracke genannt",
      "Weiche Böden können mangelnden Schalenabrieb und schmerzhafte Klauenprobleme begünstigen"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/096779/index.php"
      },
      {
        "title": "Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)",
        "url": "https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf"
      }
    ]
  },
  {
    "name": "Gamswild",
    "slug": "gamswild",
    "scientificName": "Rupicapra rupicapra",
    "group": "Schalenwild",
    "identification": "Sommerfell heller, Winterfell überwiegend dunkel",
    "habitat": "Ziegenverwandter Hornträger in europäischen Gebirgen. Nutzt alpine Matten, Fels- und Krummholzbereiche sowie Bergwälder.",
    "biology": [
      "Ziegenverwandter Hornträger in europäischen Gebirgen",
      "Nutzt alpine Matten, Fels- und Krummholzbereiche sowie Bergwälder",
      "Überwiegend tagaktiv und sehr trittsicher",
      "Nahrung: Gräser, Kräuter, Knospen und Zwergsträucher",
      "Geißen und Kitze leben in Rudeln; Böcke häufig einzeln oder in kleinen Gruppen",
      "Beide Geschlechter tragen Hörner, die Krucken heißen",
      "Krucken sind nach hinten gehakelt und werden nicht jährlich abgeworfen",
      "Sommerfell heller, Winterfell überwiegend dunkel"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/085402/index.php"
      },
      {
        "title": "Nationalpark: Gämse",
        "url": "https://nationalpark.ch/flora-und-fauna/gaemse/"
      },
      {
        "title": "Nationalpark: Fokus Gämse (Tragzeit)",
        "url": "https://nationalpark.ch/wp-content/uploads/2023/10/Focus_Gaemse.pdf"
      },
      {
        "title": "Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)",
        "url": "https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf"
      }
    ]
  },
  {
    "name": "Steinwild",
    "slug": "steinwild",
    "scientificName": "Capra ibex",
    "group": "Schalenwild",
    "identification": "Alpensteinbock: Hornträger und Spezialist felsiger Hochgebirgslebensräume",
    "habitat": "Alpensteinbock: Hornträger und Spezialist felsiger Hochgebirgslebensräume.",
    "biology": [
      "Alpensteinbock: Hornträger und Spezialist felsiger Hochgebirgslebensräume",
      "Nutzt alpine Matten, felsige Hänge und saisonal unterschiedliche Höhenlagen",
      "Sehr guter Kletterer",
      "Nahrung: Gräser und Kräuter; im Winter auch weitere verfügbare Pflanzenteile",
      "Böcke sind erheblich massiger als Geißen",
      "Bockhörner können etwa einen Meter lang werden",
      "Beide Geschlechter tragen Hörner; jene der Geißen sind deutlich kleiner",
      "Böcke und Geißen mit Jungtieren leben überwiegend in getrennten Rudeln"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Schweizerischer Nationalpark: Artprofil",
        "url": "https://nationalpark.ch/flora-und-fauna/steinbock/"
      },
      {
        "title": "Wildtierportal Bayern: Steinwild",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/143521/index.php"
      },
      {
        "title": "Nationalpark: Fokus Steinbock",
        "url": "https://nationalpark.ch/wp-content/uploads/2023/10/Focus_Steinbock.pdf"
      },
      {
        "title": "Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)",
        "url": "https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf"
      }
    ]
  },
  {
    "name": "Sikawild",
    "slug": "sikawild",
    "scientificName": "Cervus nippon",
    "group": "Schalenwild",
    "identification": "Größe variiert; Körpergewicht kann ungefähr 90 kg und Schulterhöhe etwa 100 cm erreichen · Sommerfell rotbraun mit hellen Flecken, Winterfell dunkler mit wenig sichtbaren Flecken · Weißer Spiegel häufig schwarz umrandet",
    "habitat": "Bevorzugt deckungsreiche Wälder; nutzt auch Feuchtgebiete und Offenland.",
    "biology": [
      "Hirschart mit ursprünglichem Verbreitungsgebiet in Ostasien",
      "Bevorzugt deckungsreiche Wälder; nutzt auch Feuchtgebiete und Offenland",
      "Größe variiert; Körpergewicht kann ungefähr 90 kg und Schulterhöhe etwa 100 cm erreichen",
      "Nahrung: Gräser, Kräuter, Knospen, Zwergsträucher und Rinde",
      "Lebt oft in kleinen Verbänden; ältere Hirsche häufig einzeln",
      "Sommerfell rotbraun mit hellen Flecken, Winterfell dunkler mit wenig sichtbaren Flecken",
      "Weißer Spiegel häufig schwarz umrandet",
      "Nur männliche Tiere tragen normalerweise ein Geweih"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/118649/index.php"
      }
    ]
  },
  {
    "name": "Fuchs",
    "slug": "fuchs",
    "scientificName": "Vulpes vulpes",
    "group": "Raubtiere",
    "identification": "Rötliche Oberseite und helle Unterseite; Fellfarbe variiert · Buschiger Schwanz heißt Lunte; eine helle Schwanzspitze wird Blume genannt",
    "habitat": "Hundeartiger Beutegreifer mit sehr breitem Lebensraumspektrum. Kommt in Wald, offener Kulturlandschaft und Siedlungen vor.",
    "biology": [
      "Hundeartiger Beutegreifer mit sehr breitem Lebensraumspektrum",
      "Kommt in Wald, offener Kulturlandschaft und Siedlungen vor",
      "Überwiegend dämmerungs- und nachtaktiv",
      "Allesfresser: Mäuse, weitere Kleintiere, Wirbellose, Aas und Früchte",
      "Rötliche Oberseite und helle Unterseite; Fellfarbe variiert",
      "Buschiger Schwanz heißt Lunte; eine helle Schwanzspitze wird Blume genannt",
      "Gräbt eigene Baue und nutzt auch Dachsbaue",
      "Geruchs- und Gehörsinn sind sehr gut entwickelt"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/085227/index.php"
      },
      {
        "title": "RKI: Tollwut",
        "url": "https://www.rki.de/SharedDocs/FAQs/DE/Tollwut/FAQ_Liste.html?nn=16907352"
      },
      {
        "title": "Südtiroler Jagdverband: Fuchsmerkmale",
        "url": "https://jagdverband.it/fuchs-2/"
      },
      {
        "title": "SWILD/INFOX: Fuchslosung erkennen",
        "url": "https://fuchsratgeber.ch/u6.html"
      },
      {
        "title": "FLI: Tollwut in Deutschland, 20. Februar 2026",
        "url": "https://www.fli.de/de/aktuelles/kurznachrichten/neues-einzelansicht/aktuelles-zur-tollwut-in-deutschland/"
      },
      {
        "title": "RKI: Tollwut, Epidemiologisches Bulletin 27/2026",
        "url": "https://www.rki.de/DE/Aktuelles/Publikationen/Epidemiologisches-Bulletin/2026/27_26.pdf?__blob=publicationFile&amp;v=3"
      },
      {
        "title": "Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)",
        "url": "https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf"
      }
    ]
  },
  {
    "name": "Dachs",
    "slug": "dachs",
    "scientificName": "Meles meles",
    "group": "Raubtiere",
    "identification": "Marderartiger Allesfresser mit schwarz-weißer Gesichtszeichnung · Gedrungener Körper, kurze kräftige Beine und kurze Rute · Kopf-Rumpf-Länge ungefähr 60 bis 90 cm; Gewicht schwankt saisonal",
    "habitat": "Nutzt Wälder, Feldgehölze und strukturreiche Landschaften. Lebt je nach Lebensraum und Nahrungsangebot in sozialen Gruppen.",
    "biology": [
      "Marderartiger Allesfresser mit schwarz-weißer Gesichtszeichnung",
      "Gedrungener Körper, kurze kräftige Beine und kurze Rute",
      "Kopf-Rumpf-Länge ungefähr 60 bis 90 cm; Gewicht schwankt saisonal",
      "Nutzt Wälder, Feldgehölze und strukturreiche Landschaften",
      "Nahrung unter anderem Regenwürmer, Insekten, Früchte, Getreide und Kleinsäuger",
      "Baue besitzen Röhren und Wohnkammern, die Kessel heißen",
      "Lebt je nach Lebensraum und Nahrungsangebot in sozialen Gruppen",
      "Überwiegend dämmerungs- und nachtaktiv"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/101575/index.php"
      },
      {
        "title": "University of Michigan: Dachsbiologie und Gebiss",
        "url": "https://animaldiversity.org/accounts/Meles_meles/"
      },
      {
        "title": "Bayerische Staatsforsten: Waldjagd und Fachbegriffe",
        "url": "https://www.baysf.de/fileadmin/user_upload/news/BaySF_Magazin10_Waldjagd.pdf"
      }
    ]
  },
  {
    "name": "Waschbär",
    "slug": "waschbaer",
    "scientificName": "Procyon lotor",
    "group": "Raubtiere",
    "identification": "Schwarze Gesichtsmaske und geringelter Schwanz",
    "habitat": "Besiedelt strukturreiche Wälder und Siedlungen.",
    "biology": [
      "Kleinbär mit ursprünglichem Verbreitungsgebiet in Nordamerika",
      "In Europa durch Freisetzungen und entkommene Tiere etabliert",
      "Schwarze Gesichtsmaske und geringelter Schwanz",
      "Sehr bewegliche Vorderpfoten mit gutem Tastsinn",
      "Guter Kletterer; nutzt Baumhöhlen und auch Gebäude als Ruheplätze",
      "Überwiegend dämmerungs- und nachtaktiv",
      "Besiedelt strukturreiche Wälder und Siedlungen",
      "Allesfresser: Früchte, Wirbellose, kleine Wirbeltiere, Eier und weitere verfügbare Nahrung"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/176023/index.php"
      },
      {
        "title": "Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)",
        "url": "https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf"
      }
    ]
  },
  {
    "name": "Marderhund",
    "slug": "marderhund",
    "scientificName": "Nyctereutes procyonoides",
    "group": "Raubtiere",
    "identification": "Kopf-Rumpf-Länge ungefähr 50 bis 70 cm · Langhaariges Fell und dunkle Gesichtszeichnung; Rute ohne Waschbär-Ringelung",
    "habitat": "Bevorzugt feuchte, deckungsreiche und strukturreiche Landschaften.",
    "biology": [
      "Hundeartiger mit ursprünglichem Verbreitungsgebiet in Ostasien",
      "Europäische Bestände gehen unter anderem auf Aussetzungen zur Pelznutzung in Osteuropa zurück",
      "Kopf-Rumpf-Länge ungefähr 50 bis 70 cm",
      "Gewicht schwankt saisonal, häufig etwa 3 bis 12 kg",
      "Langhaariges Fell und dunkle Gesichtszeichnung; Rute ohne Waschbär-Ringelung",
      "Bevorzugt feuchte, deckungsreiche und strukturreiche Landschaften",
      "Überwiegend nachtaktiv",
      "Allesfresser mit tierischer und pflanzlicher Nahrung sowie Aas"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/223538/index.php"
      },
      {
        "title": "Anatomische Studie: Marderhundgebiss (2023)",
        "url": "https://www.mdpi.com/2076-2615/13/15/2437"
      }
    ]
  },
  {
    "name": "Steinmarder",
    "slug": "steinmarder",
    "scientificName": "Martes foina",
    "group": "Raubtiere",
    "identification": "Graubraunes Fell mit buschigem Schwanz",
    "habitat": "Nutzt Siedlungen, Dachböden, Schuppen und strukturreiche offene Landschaften.",
    "biology": [
      "Marderartiger Kulturfolger, auch Hausmarder genannt",
      "Nutzt Siedlungen, Dachböden, Schuppen und strukturreiche offene Landschaften",
      "Überwiegend dämmerungs- und nachtaktiver Einzelgänger",
      "Graubraunes Fell mit buschigem Schwanz",
      "Kehlfleck meist weißlich und häufig zu den Vorderläufen gegabelt",
      "Nasenspitze typischerweise heller beziehungsweise rosafarben",
      "Guter Kletterer",
      "Nahrung: Kleinsäuger, Insekten, Vögel, Eier, Aas, Früchte und Beeren"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/100869/index.php"
      },
      {
        "title": "DJV: Steinmarder",
        "url": "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/steinmarder-martes-foina"
      },
      {
        "title": "Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)",
        "url": "https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf"
      }
    ]
  },
  {
    "name": "Baummarder",
    "slug": "baummarder",
    "scientificName": "Martes martes",
    "group": "Raubtiere",
    "identification": "Kastanien- bis dunkelbraunes Fell und buschiger Schwanz",
    "habitat": "Bevorzugt strukturreiche Wälder und ältere Baumbestände.",
    "biology": [
      "Marderartiger, auch Edelmarder genannt",
      "Bevorzugt strukturreiche Wälder und ältere Baumbestände",
      "Überwiegend dämmerungs- und nachtaktiver Einzelgänger",
      "Guter Kletterer; nutzt Baumhöhlen, Kobel und andere geschützte Ruheplätze",
      "Kastanien- bis dunkelbraunes Fell und buschiger Schwanz",
      "Kehlfleck meist gelblich; Form und Farbe können variieren",
      "Dunkle Nase ist ein weiteres Merkmal gegenüber dem Steinmarder",
      "Nahrung: Kleinsäuger, Insekten, Vögel, Eier, Aas und Früchte"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/100914/index.php"
      },
      {
        "title": "DJV: Baummarder",
        "url": "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/baummarder-martes-martes"
      },
      {
        "title": "Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)",
        "url": "https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf"
      }
    ]
  },
  {
    "name": "Iltis",
    "slug": "iltis",
    "scientificName": "Mustela putorius",
    "group": "Raubtiere",
    "identification": "Marderartiger mit dunklem Fell und kontrastreicher heller Gesichtszeichnung · Kopf-Rumpf-Länge häufig ungefähr 35 bis 45 cm · Gesichtsmaske ist ein Hinweis gegenüber dem Mink; Farbe oder Geruch allein beweisen die Art nicht",
    "habitat": "Nutzt strukturreiche Waldränder, Hecken, Feldfluren und bewachsene Gewässerufer. Nahrung vor allem Amphibien und Kleinsäuger; Zusammensetzung hängt vom Lebensraum ab.",
    "biology": [
      "Marderartiger mit dunklem Fell und kontrastreicher heller Gesichtszeichnung",
      "Gelbliche Unterwolle scheint durch die dunklen Deckhaare",
      "Kopf-Rumpf-Länge häufig ungefähr 35 bis 45 cm",
      "Nutzt strukturreiche Waldränder, Hecken, Feldfluren und bewachsene Gewässerufer",
      "Überwiegend dämmerungs- und nachtaktiv",
      "Nahrung vor allem Amphibien und Kleinsäuger; Zusammensetzung hängt vom Lebensraum ab",
      "Stark riechendes Sekret aus Analdrüsen dient unter anderem der Abwehr und Markierung",
      "Geschützte Tagesverstecke beispielsweise in Holz- oder Reisighaufen"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/101494/index.php"
      },
      {
        "title": "Anatomische Studie zum Iltisgebiss (2020)",
        "url": "https://www.sciencedirect.com/science/article/abs/pii/S0021997520300190"
      }
    ]
  },
  {
    "name": "Hermelin",
    "slug": "hermelin",
    "scientificName": "Mustela erminea",
    "group": "Raubtiere",
    "identification": "Schlanker Körper mit kurzen Beinen · Schwarze Schwanzspitze ist ein wichtiger Unterschied zum Mauswiesel · Sommerfell braun auf der Oberseite und weißlich an der Unterseite",
    "habitat": "Besiedelt strukturreiche Wiesenlandschaften, Hecken, Waldränder und weitere Deckungsbereiche.",
    "biology": [
      "Marderartiger, auch Großes Wiesel genannt",
      "Schlanker Körper mit kurzen Beinen",
      "Schwarze Schwanzspitze ist ein wichtiger Unterschied zum Mauswiesel",
      "Sommerfell braun auf der Oberseite und weißlich an der Unterseite",
      "Winterfell kann weiß werden; in milden Regionen bleiben Tiere teilweise braun",
      "Besiedelt strukturreiche Wiesenlandschaften, Hecken, Waldränder und weitere Deckungsbereiche",
      "Jagt vor allem kleine Säugetiere und kann auch größere Beute überwältigen",
      "Tag- und Nachtaktivität variieren jahreszeitlich"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/101466/index.php"
      },
      {
        "title": "MNHN/SFEPM: Hermelin",
        "url": "https://observatoire-mammiferes.fr/espece/60686"
      }
    ]
  },
  {
    "name": "Mauswiesel",
    "slug": "mauswiesel",
    "scientificName": "Mustela nivalis",
    "group": "Raubtiere",
    "identification": "Kopf-Rumpf-Länge häufig etwa 15 bis 25 cm; Größe variiert regional und zwischen Geschlechtern · Langgestreckter Körper erlaubt die Jagd in engen Nagergängen · Winterfärbung ist regional verschieden; in nördlichen und manchen Gebirgspopulationen weiß",
    "habitat": "Nutzt strukturreiche Feld- und Wiesenlandschaften, Hecken, Steinhaufen und Nagerbaue.",
    "biology": [
      "Kleinster heimischer Vertreter der Raubtiere",
      "Kopf-Rumpf-Länge häufig etwa 15 bis 25 cm; Größe variiert regional und zwischen Geschlechtern",
      "Langgestreckter Körper erlaubt die Jagd in engen Nagergängen",
      "Kurze Rute ohne schwarze Endquaste, im Unterschied zum Hermelin",
      "Oberseite meist braun, Unterseite weißlich",
      "Winterfärbung ist regional verschieden; in nördlichen und manchen Gebirgspopulationen weiß",
      "Nutzt strukturreiche Feld- und Wiesenlandschaften, Hecken, Steinhaufen und Nagerbaue",
      "Hauptbeute sind kleine Nagetiere"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/101647/index.php"
      },
      {
        "title": "Oregon State University: Mustela nivalis",
        "url": "https://courses.ecampus.oregonstate.edu/wildlife/species.php?id=358"
      }
    ]
  },
  {
    "name": "Wildkatze",
    "slug": "wildkatze",
    "scientificName": "Felis silvestris",
    "group": "Raubtiere",
    "identification": "Buschiger Schwanz mit abgesetzten Ringen und stumpfem dunklem Ende ist ein Hinweis · Fellzeichnung, Größe und einzelne Spuren sind kein sicherer Zugehörigkeitsnachweis",
    "habitat": "Europäische Wildkatze: scheue Katzenart strukturreicher Landschaften. Nutzt Wälder mit Deckung und Totholz; jagt auch an Waldrändern, Lichtungen und Wiesen.",
    "biology": [
      "Europäische Wildkatze: scheue Katzenart strukturreicher Landschaften",
      "Nutzt Wälder mit Deckung und Totholz; jagt auch an Waldrändern, Lichtungen und Wiesen",
      "Außerhalb der Paarungszeit meist einzeln",
      "Hauptnahrung sind kleine Säugetiere, besonders Mäuse",
      "Buschiger Schwanz mit abgesetzten Ringen und stumpfem dunklem Ende ist ein Hinweis",
      "Getigerte Hauskatzen können sehr ähnlich aussehen",
      "Fellzeichnung, Größe und einzelne Spuren sind kein sicherer Zugehörigkeitsnachweis",
      "Monitoring kann genetische Untersuchung von Haaren einschließen"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/102627/index.php"
      },
      {
        "title": "BfN: Wildkatze und Schutzstatus",
        "url": "https://www.bfn.de/artenportraits/felis-silvestris"
      },
      {
        "title": "Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)",
        "url": "https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf"
      }
    ]
  },
  {
    "name": "Luchs",
    "slug": "luchs",
    "scientificName": "Lynx lynx",
    "group": "Raubtiere",
    "identification": "Fellzeichnung und Fleckung variieren zwischen Individuen · Das Fleckenmuster ist individuell und kann in der Forschung zur Wiedererkennung dienen",
    "habitat": "Nutzt Waldlandschaften und strukturreiche Kulturlandschaften.",
    "biology": [
      "Große heimische Katzenart mit Ohrpinseln, Backenbart und kurzer Rute mit schwarzem Ende",
      "Fellzeichnung und Fleckung variieren zwischen Individuen",
      "Lebt überwiegend einzeln mit großen Streifgebieten",
      "Nutzt Waldlandschaften und strukturreiche Kulturlandschaften",
      "Vor allem dämmerungs- und nachtaktiv",
      "Beute in Mitteleuropa häufig Rehwild; regionale Nahrungsspektren unterscheiden sich",
      "Pirscht sich an und erbeutet Wild auf kurze Distanz",
      "Kehrt wiederholt zu einem Riss zurück"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/102683/index.php"
      },
      {
        "title": "KORA: Nachweise im Feld",
        "url": "https://www.kora.ch/de/arten/luchs/nachweise-im-feld"
      },
      {
        "title": "LIFE Lynx: Biologie",
        "url": "https://www.lifelynx.eu/biology/"
      },
      {
        "title": "Bundesamt für Naturschutz: Luchs und Schutzstatus",
        "url": "https://www.bfn.de/artenportraits/lynx-lynx"
      }
    ]
  },
  {
    "name": "Feldhase",
    "slug": "feldhase",
    "scientificName": "Lepus europaeus",
    "group": "Hasenartige und Nagetiere",
    "identification": "Kopf-Rumpf-Länge etwa 50 bis 70 cm; Gewicht variiert nach Region und Alter · Lange Ohren, Löffel genannt, mit dunklen Spitzen · Häsin und Rammler sind die Geschlechtsbezeichnungen",
    "habitat": "Lebt besonders in offener, strukturreicher Agrarlandschaft; kommt auch in anderen Landschaften vor.",
    "biology": [
      "Hasenartiger, kein Nagetier",
      "Kopf-Rumpf-Länge etwa 50 bis 70 cm; Gewicht variiert nach Region und Alter",
      "Lange Ohren, Löffel genannt, mit dunklen Spitzen",
      "Kräftige Hinterläufe ermöglichen schnelle Flucht mit Hakenschlagen",
      "Lebt besonders in offener, strukturreicher Agrarlandschaft; kommt auch in anderen Landschaften vor",
      "Nahrung: Kräuter, Gräser, Kulturpflanzen, Knospen und Triebe",
      "Ruht in einer flachen Erdmulde, der Sasse",
      "Bei Gefahr zunächst oft regungslos geduckt, dann schnelle Flucht"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/102456/index.php"
      },
      {
        "title": "DJV: Feldhase",
        "url": "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/feldhase-lepus-europaeus"
      },
      {
        "title": "Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)",
        "url": "https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf"
      }
    ]
  },
  {
    "name": "Schneehase",
    "slug": "schneehase",
    "scientificName": "Lepus timidus",
    "group": "Hasenartige und Nagetiere",
    "identification": "Kleiner und gedrungener als der Feldhase, mit kürzeren Ohren · Sommerfell überwiegend graubraun · Alpenschneehasen tragen im Winter ein weißes Fell mit schwarzen Ohrspitzen",
    "habitat": "Im deutschsprachigen Alpenraum vor allem in Gebirgslagen. Frisst Gräser, Kräuter, Zwergsträucher, Knospen, Zweige und Rinde.",
    "biology": [
      "Hasenartiger kalter Regionen; im deutschsprachigen Alpenraum vor allem in Gebirgslagen",
      "Kleiner und gedrungener als der Feldhase, mit kürzeren Ohren",
      "Sommerfell überwiegend graubraun",
      "Alpenschneehasen tragen im Winter ein weißes Fell mit schwarzen Ohrspitzen",
      "Weiße Schwanzoberseite ist ein weiterer Hinweis gegenüber dem Feldhasen",
      "Besonders spreizbare, behaarte Hinterpfoten helfen im Schnee",
      "Nahrung: Gräser, Kräuter, Zwergsträucher, Knospen, Zweige und Rinde",
      "Alpenschneehasen leben eher einzeln und sind vor allem dämmerungs- und nachtaktiv"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/126311/index.php"
      },
      {
        "title": "Nationalpark: Schneehase",
        "url": "https://nationalpark.ch/flora-und-fauna/schneehase/"
      },
      {
        "title": "Südtiroler Jagdverband: Schneehase",
        "url": "https://jagdverband.it/schneehase-2/"
      }
    ]
  },
  {
    "name": "Wildkaninchen",
    "slug": "wildkaninchen",
    "scientificName": "Oryctolagus cuniculus",
    "group": "Hasenartige und Nagetiere",
    "identification": "Hasenartiger mit kurzen Ohren und gedrungenerer Gestalt als der Feldhase · Kopf-Rumpf-Länge etwa 35 bis 45 cm; Gewicht häufig ungefähr 1,3 bis 2,2 kg",
    "habitat": "Bevorzugt grabfähige, eher trockene Böden in strukturreichen Landschaften, Parks und Siedlungsbereichen. Meidet dauerhaft nasse Böden und große geschlossene Waldgebiete.",
    "biology": [
      "Hasenartiger mit kurzen Ohren und gedrungenerer Gestalt als der Feldhase",
      "Kopf-Rumpf-Länge etwa 35 bis 45 cm; Gewicht häufig ungefähr 1,3 bis 2,2 kg",
      "Lebt gesellig in Kolonien mit unterirdischen Bauen",
      "Bevorzugt grabfähige, eher trockene Böden in strukturreichen Landschaften, Parks und Siedlungsbereichen",
      "Meidet dauerhaft nasse Böden und große geschlossene Waldgebiete",
      "Vorwiegend dämmerungsaktiv; an störungsarmen Orten auch tagsüber",
      "Nahrung: Gräser, Kräuter, Feldfrüchte, Knospen, Triebe und Rinde",
      "Warnt andere Kaninchen durch Klopfen mit den Hinterläufen"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/140874/index.php"
      },
      {
        "title": "DJV: Wildkaninchen",
        "url": "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/wildkaninchen-oryctolagus-cuniculus"
      },
      {
        "title": "Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)",
        "url": "https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf"
      }
    ]
  },
  {
    "name": "Nutria",
    "slug": "nutria",
    "scientificName": "Myocastor coypus",
    "group": "Hasenartige und Nagetiere",
    "identification": "Runder, beschuppter und wenig behaarter Schwanz, im Unterschied zur Biberkelle",
    "habitat": "Nutzt stehende und langsam fließende Gewässer mit vegetationsreichen Ufern. Gräbt Erdbauten in Uferböschungen.",
    "biology": [
      "Nagetiere mit ursprünglichem Verbreitungsgebiet in Südamerika",
      "Europäische Bestände gehen unter anderem auf entlaufene oder freigelassene Pelztiere zurück",
      "Runder, beschuppter und wenig behaarter Schwanz, im Unterschied zur Biberkelle",
      "Orange Schneidezähne und auffällige helle Barthaare",
      "Schwimmhäute an den Hinterfüßen",
      "Nutzt stehende und langsam fließende Gewässer mit vegetationsreichen Ufern",
      "Gräbt Erdbauten in Uferböschungen",
      "Ernährt sich überwiegend von Wasser- und Uferpflanzen; nutzt auch Feldfrüchte"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/218365/index.php"
      },
      {
        "title": "Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)",
        "url": "https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf"
      }
    ]
  },
  {
    "name": "Bisam",
    "slug": "bisam",
    "scientificName": "Ondatra zibethicus",
    "group": "Hasenartige und Nagetiere",
    "identification": "Kopf-Rumpf-Länge bis etwa 40 cm; Gewicht bis ungefähr 2 kg · Nackter, seitlich abgeplatteter Schwanz von ungefähr 20 bis 25 cm · Gedrungener Körper mit kurzem Kopf",
    "habitat": "Nahrung vor allem Wasser- und Uferpflanzen, zeitweise auch Muscheln, Krebse und Amphibien. Besiedelt geeignete Gewässerufer und Feuchtgebiete.",
    "biology": [
      "Große Wühlmaus mit ursprünglichem Verbreitungsgebiet in Nordamerika",
      "Kopf-Rumpf-Länge bis etwa 40 cm; Gewicht bis ungefähr 2 kg",
      "Nackter, seitlich abgeplatteter Schwanz von ungefähr 20 bis 25 cm",
      "Gedrungener Körper mit kurzem Kopf",
      "Fellfarbe variiert von dunkel bis zu helleren Brauntönen",
      "Schwimmborsten an den Zehen unterstützen die Fortbewegung im Wasser",
      "Kleiner als Biber und Nutria",
      "Nahrung vor allem Wasser- und Uferpflanzen, zeitweise auch Muscheln, Krebse und Amphibien"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Landesamt für Umwelt Brandenburg",
        "url": "https://lfu.brandenburg.de/lfu/de/aufgaben/natur/artenschutz/invasive-arten/steckbriefe/bisam/"
      },
      {
        "title": "BfN: Bisam, Management- und Maßnahmenblatt",
        "url": "https://www.bfn.de/sites/default/files/2025-07/EU-VO-Art-19_MMB-Ondatra-zibethicus_Version-2019-05.pdf"
      },
      {
        "title": "Landesjagdverband Baden-Württemberg: Fachgebiet Tierarten (Biologie, 2018)",
        "url": "https://www.landesjagdverband.de/fileadmin/Medien/LJV/Dokumente/5__Aus-_und_Fortbildung/Pr%C3%BCfungsfragen/Gesamtkatalog_mit_Lsg/Fach_1_Stand_29.03.2018_mit_L%C3%B6sung.pdf"
      }
    ]
  },
  {
    "name": "Biber",
    "slug": "biber",
    "scientificName": "Castor fiber",
    "group": "Hasenartige und Nagetiere",
    "identification": "Breiter, abgeflachter Schwanz heißt Kelle",
    "habitat": "Großes, an Gewässer gebundenes Nagetier. Lebt an stehenden und fließenden Gewässern mit geeigneter Ufervegetation.",
    "biology": [
      "Großes, an Gewässer gebundenes Nagetier",
      "Breiter, abgeflachter Schwanz heißt Kelle",
      "Orangerote Schneidezähne",
      "Lebt an stehenden und fließenden Gewässern mit geeigneter Ufervegetation",
      "Überwiegend dämmerungs- und nachtaktiv",
      "Pflanzenfresser: Kräuter, Blätter, Zweige und Rinde",
      "Gräbt Uferbaue oder errichtet Burgen aus Ästen",
      "Baut dort Dämme, wo dies zur Sicherung des Wasserstands nötig ist; nicht jede Ansiedlung hat einen Damm"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Bundesamt für Naturschutz: Artprofil",
        "url": "https://www.bfn.de/artenportraits/castor-fiber"
      },
      {
        "title": "Naturverwaltung Luxemburg: Europäischer Biber",
        "url": "https://environnement.public.lu/dam-assets/fr/conserv_nature/publications/2022/anf-europaische-biber-web.pdf"
      }
    ]
  },
  {
    "name": "Eichhörnchen",
    "slug": "eichhoernchen",
    "scientificName": "Sciurus vulgaris",
    "group": "Hasenartige und Nagetiere",
    "identification": "Kopf-Rumpf-Länge ungefähr 20 bis 25 cm · Buschiger Schwanz und im Winter oft ausgeprägte Ohrpinsel · Schwanz häufig ungefähr 16 bis 20 cm lang",
    "habitat": "Heimisches Nagetier der Wälder, Feldgehölze und Parks.",
    "biology": [
      "Heimisches Nagetier der Wälder, Feldgehölze und Parks",
      "Kopf-Rumpf-Länge ungefähr 20 bis 25 cm",
      "Oberseite von rot bis schwarzbraun; Unterseite hell",
      "Buschiger Schwanz und im Winter oft ausgeprägte Ohrpinsel",
      "Guter Kletterer",
      "Tagaktiv; kein echter Winterschlaf",
      "Überwiegend einzeln, Kontakt unter anderem zur Paarung",
      "Nahrung: Baumsamen, Nüsse, Knospen, Pilze, Früchte und gelegentlich tierische Kost"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Bayerische Landesanstalt für Wald und Forstwirtschaft",
        "url": "https://lwf.bayern.de/waldschutz/kleinsaeuger/064070/index.php"
      },
      {
        "title": "Mammalian Species: Sciurus vulgaris",
        "url": "https://www.science.smith.edu/departments/Biology/VHAYSSEN/msi/pdf/769_Sciurus_vulgaris.pdf"
      }
    ]
  },
  {
    "name": "Fasan",
    "slug": "fasan",
    "scientificName": "Phasianus colchicus",
    "group": "Hühner und Raufußhühner",
    "identification": "Beide Geschlechter mit langem Schwanz, beim Hahn besonders ausgeprägt",
    "habitat": "Vielfältige Feldfluren mit Hecken, Gehölzen, Schilf und Brachen. Erwachsene nutzen pflanzliche Nahrung und Wirbellose; Küken benötigen besonders viele Insekten.",
    "biology": [
      "Hühnervogel mit ursprünglichem Verbreitungsgebiet in Asien",
      "In Europa seit langer Zeit durch Menschen angesiedelt",
      "Hahn farbenreicher und größer als die braun getarnte Henne",
      "Beide Geschlechter mit langem Schwanz, beim Hahn besonders ausgeprägt",
      "Nutzt vielfältige Feldfluren mit Hecken, Gehölzen, Schilf und Brachen",
      "Ruht auch in Bäumen und Gebüschen",
      "Nahrung: Samen, Körner und weitere Pflanzen sowie Wirbellose",
      "Küken brauchen besonders in den ersten Lebenswochen viele Insekten"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/102449/index.php"
      }
    ]
  },
  {
    "name": "Rebhuhn",
    "slug": "rebhuhn",
    "scientificName": "Perdix perdix",
    "group": "Hühner und Raufußhühner",
    "identification": "Gedrungener Körper, kurzer Schwanz und braungraues Tarngefieder · Körperlänge häufig ungefähr 30 cm",
    "habitat": "Feldhuhn strukturreicher offener Agrarlandschaften. Nutzt Äcker, Wiesen, Hecken, Brachen und Altgrasstreifen.",
    "biology": [
      "Feldhuhn strukturreicher offener Agrarlandschaften",
      "Gedrungener Körper, kurzer Schwanz und braungraues Tarngefieder",
      "Nutzt Äcker, Wiesen, Hecken, Brachen und Altgrasstreifen",
      "Bei Gefahr zunächst oft geduckt, später rasche Flucht",
      "Benötigt Deckung, Nahrung und trockene Bereiche für Staubbäder",
      "Erwachsene fressen überwiegend pflanzliche Kost",
      "Küken sind zunächst stark auf Insekten angewiesen",
      "Familien und Wintergruppen werden Ketten genannt"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/102425/index.php"
      }
    ]
  },
  {
    "name": "Birkhuhn",
    "slug": "birkhuhn",
    "scientificName": "Lyrurus tetrix, Synonym Tetrao tetrix",
    "group": "Hühner und Raufußhühner",
    "identification": "Spielhahn mit dunklem, bläulich glänzendem Gefieder und sichelförmigen äußeren Schwanzfedern · Weiße Unterschwanzdecken sind bei der Balz auffällig · Henne braun gemustert; Brust im Gegensatz zur Auerhenne gebändert",
    "habitat": "Raufußhuhn halboffener Übergangsbereiche von Wald und Offenland. Nutzt unter anderem Moorränder, lichte Bergwälder und alpine Matten.",
    "biology": [
      "Raufußhuhn halboffener Übergangsbereiche von Wald und Offenland",
      "Nutzt unter anderem Moorränder, lichte Bergwälder und alpine Matten",
      "Kleiner als das Auerhuhn",
      "Spielhahn mit dunklem, bläulich glänzendem Gefieder und sichelförmigen äußeren Schwanzfedern",
      "Weiße Unterschwanzdecken sind bei der Balz auffällig",
      "Henne braun gemustert; Brust im Gegensatz zur Auerhenne gebändert",
      "Nahrung: Triebe, Knospen, Blätter und Früchte",
      "Im Winter unter anderem Knospen und Kätzchen von Birken und anderen Gehölzen"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/102436/index.php"
      }
    ]
  },
  {
    "name": "Auerhuhn",
    "slug": "auerhuhn",
    "scientificName": "Tetrao urogallus",
    "group": "Hühner und Raufußhühner",
    "identification": "Hahn mit breiten, fächerartig aufstellbaren Schwanzfedern · Henne mit rostbrauner, weitgehend ungebänderter Brust; Birkhenne dort stärker gebändert",
    "habitat": "Großes Raufußhuhn lichter, strukturreicher Nadel- und Mischwälder.",
    "biology": [
      "Großes Raufußhuhn lichter, strukturreicher Nadel- und Mischwälder",
      "Sehr störungsempfindlich",
      "Auerhahn ist deutlich größer als die braun getarnte Auerhenne",
      "Hahn mit breiten, fächerartig aufstellbaren Schwanzfedern",
      "Rote Hautpartien über den Augen heißen Rosen",
      "Erwachsene Vögel fressen vorwiegend Pflanzen",
      "Im Winter sind Nadelbaum-Nadeln wichtige Nahrung",
      "Beersträucher bieten Blätter, Triebe und Früchte"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/096750/index.php"
      }
    ]
  },
  {
    "name": "Schneehuhn",
    "slug": "schneehuhn",
    "scientificName": "Lagopus muta",
    "group": "Hühner und Raufußhühner",
    "identification": "Wintergefieder überwiegend weiß, Schwanzfedern bleiben dunkel · Sommergefieder überwiegend braun-grau gescheckt · Jahreszeitlicher Gefiederwechsel verbessert Tarnung und Isolation",
    "habitat": "Alpenschneehuhn: Raufußhuhn kalter Hochgebirgs- und nördlicher Lebensräume. Brutbeginn im Gebirge abhängig von Schneelage, meist im späten Frühjahr oder Frühsommer.",
    "biology": [
      "Alpenschneehuhn: Raufußhuhn kalter Hochgebirgs- und nördlicher Lebensräume",
      "Im Alpenraum vorwiegend oberhalb der Baumgrenze",
      "Vorkommen auch in den Hochlagen der bayerischen Alpen",
      "Dicht befiederte Beine und Zehen helfen bei Kälte und Schnee",
      "Wintergefieder überwiegend weiß, Schwanzfedern bleiben dunkel",
      "Sommergefieder überwiegend braun-grau gescheckt",
      "Hahn mit schwarzem Zügelstreifen und roten Rosen",
      "Nahrung im Winter: Triebe, Knospen und weitere Pflanzenteile"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/120348/index.php"
      },
      {
        "title": "LfU Bayern: Alpenschneehuhn",
        "url": "https://www.lfu.bayern.de/natur/sap/arteninformationen/steckbrief/zeige?stbname=Lagopus+muta+helvetica"
      }
    ]
  },
  {
    "name": "Stockente",
    "slug": "stockente",
    "scientificName": "Anas platyrhynchos",
    "group": "Enten",
    "identification": "Erpel im Prachtkleid mit grün schimmerndem Kopf, weißem Halsring und gelbem Schnabel · Blauer, weiß eingefasster Flügelspiegel bei beiden Geschlechtern",
    "habitat": "Nutzt Gewässer verschiedener Größe, auch in Siedlungen. Deckungsreiche, störungsarme Gewässer sind dann besonders wichtig.",
    "biology": [
      "Häufige, anpassungsfähige Gründelente",
      "Nutzt Gewässer verschiedener Größe, auch in Siedlungen",
      "Erpel im Prachtkleid mit grün schimmerndem Kopf, weißem Halsring und gelbem Schnabel",
      "Ente überwiegend braun gemustert",
      "Blauer, weiß eingefasster Flügelspiegel bei beiden Geschlechtern",
      "Erpel im Schlichtkleid unauffälliger und leichter mit Enten zu verwechseln",
      "Frisst pflanzliche Nahrung sowie kleine wirbellose Tiere",
      "Nahrungssuche an der Oberfläche und durch Gründeln"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/101065/index.php"
      }
    ]
  },
  {
    "name": "Krickente",
    "slug": "krickente",
    "scientificName": "Anas crecca",
    "group": "Enten",
    "identification": "Erpel im Prachtkleid mit kastanienbraunem Kopf und grünem Augenstreifen · Grüner Flügelspiegel bei beiden Geschlechtern",
    "habitat": "Gründelente kleiner, flacher Gewässer mit Deckung.",
    "biology": [
      "Kleinste europäische Ente",
      "Gründelente kleiner, flacher Gewässer mit Deckung",
      "Erpel im Prachtkleid mit kastanienbraunem Kopf und grünem Augenstreifen",
      "Ente braun gemustert und unauffälliger",
      "Grüner Flügelspiegel bei beiden Geschlechtern",
      "Kann fast senkrecht von der Wasseroberfläche starten",
      "Nahrung: Samen und kleine wirbellose Tiere, jahreszeitlich unterschiedlich",
      "In Mitteleuropa Brutvogel, Durchzügler und Wintergast"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/213492/index.php"
      }
    ]
  },
  {
    "name": "Pfeifente",
    "slug": "pfeifente",
    "scientificName": "Mareca penelope",
    "group": "Enten",
    "identification": "Erpel im Prachtkleid mit kastanienbraunem Kopf und heller Stirn · Rosa-bräunliche Brust und überwiegend graue Körperpartien beim Erpel · Beide Geschlechter haben einen blau-grauen Schnabel mit dunkler Spitze",
    "habitat": "Nutzt flache Gewässer, Lagunen, Küstenfeuchtgebiete und überschwemmte Wiesen.",
    "biology": [
      "Mittelgroße Gründelente",
      "Erpel im Prachtkleid mit kastanienbraunem Kopf und heller Stirn",
      "Rosa-bräunliche Brust und überwiegend graue Körperpartien beim Erpel",
      "Ente überwiegend braun und unauffälliger",
      "Männchen mit charakteristischem pfeifendem Ruf",
      "Brutgebiete vor allem im Norden Eurasiens",
      "In Mitteleuropa vor allem Durchzügler und Wintergast",
      "Nutzt flache Gewässer, Lagunen, Küstenfeuchtgebiete und überschwemmte Wiesen"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Fachquelle zur Art",
        "url": "https://ffh-arten.naturschutzinformationen.nrw.de/ffh-arten/de/arten/vogelarten/kurzbeschreibung/102962"
      },
      {
        "title": "University of Michigan: Pfeifente (Biologie)",
        "url": "https://animaldiversity.org/accounts/Anas_penelope/"
      }
    ]
  },
  {
    "name": "Spießente",
    "slug": "spiessente",
    "scientificName": "Anas acuta",
    "group": "Enten",
    "identification": "Erpel im Prachtkleid mit langen spießartigen Schwanzfedern · Brauner Kopf und weißer Hals- und Brustbereich beim Erpel · Spieß bezeichnet die verlängerten mittleren Schwanzfedern des Erpels",
    "habitat": "Nutzt flache Binnengewässer, Feuchtgebiete und Überschwemmungsflächen.",
    "biology": [
      "Schlanke Gründelente mit langem Hals",
      "Erpel im Prachtkleid mit langen spießartigen Schwanzfedern",
      "Brauner Kopf und weißer Hals- und Brustbereich beim Erpel",
      "Ente überwiegend hellbraun und unauffälliger",
      "Nutzt flache Binnengewässer, Feuchtgebiete und Überschwemmungsflächen",
      "In Mitteleuropa vor allem Durchzügler und Wintergast; seltene Bruten möglich",
      "Nahrungsspektrum pflanzlich und tierisch, abhängig von Jahreszeit und Angebot",
      "Nahrungssuche überwiegend durch Gründeln"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/236141/index.php"
      }
    ]
  },
  {
    "name": "Tafelente",
    "slug": "tafelente",
    "scientificName": "Aythya ferina",
    "group": "Enten",
    "identification": "Erpel im Prachtkleid mit rotbraunem Kopf, schwarzer Brust und grauem Körper · Schnabel dunkel mit grauem Querband",
    "habitat": "Nutzt nährstoffreiche Gewässer mit offener Wasserfläche und geeigneter Ufervegetation. Nest in geschützter Ufervegetation oder auf geeigneten Inseln und Pflanzenunterlagen.",
    "biology": [
      "Mittelgroße Tauchente",
      "Erpel im Prachtkleid mit rotbraunem Kopf, schwarzer Brust und grauem Körper",
      "Ente überwiegend braun gefärbt",
      "Schnabel dunkel mit grauem Querband",
      "Nutzt nährstoffreiche Gewässer mit offener Wasserfläche und geeigneter Ufervegetation",
      "Tauchende Nahrungssuche mit tierischen und pflanzlichen Bestandteilen",
      "In Mitteleuropa Brutvogel sowie Zug- und Wintergast",
      "Nicht alle Populationen zeigen dasselbe Zugverhalten"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/236312/index.php"
      }
    ]
  },
  {
    "name": "Reiherente",
    "slug": "reiherente",
    "scientificName": "Aythya fuligula",
    "group": "Enten",
    "identification": "Erpel im Prachtkleid mit dunklem Kopf und Rücken sowie hellen Flanken · Federschopf am Hinterkopf, beim Erpel ausgeprägter",
    "habitat": "Tauchente geeigneter Seen, Weiher und weiterer Binnengewässer. Nest am Boden in Ufernähe und dichter Vegetation.",
    "biology": [
      "Tauchente geeigneter Seen, Weiher und weiterer Binnengewässer",
      "Erpel im Prachtkleid mit dunklem Kopf und Rücken sowie hellen Flanken",
      "Federschopf am Hinterkopf, beim Erpel ausgeprägter",
      "Leuchtend gelbe Augen bei erwachsenen Tieren",
      "Ente überwiegend dunkelbraun mit helleren Flanken",
      "Weißer Flügelstreifen bei beiden Geschlechtern",
      "Nahrung überwiegend Muscheln, Schnecken, Krebse und Insektenlarven; auch Samen",
      "Sucht Nahrung tauchend"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/101081/index.php"
      }
    ]
  },
  {
    "name": "Graugans",
    "slug": "graugans",
    "scientificName": "Anser anser",
    "group": "Gänse und Schwäne",
    "identification": "Große Gans mit graubraunem Gefieder und kräftigem Schnabel · Schnabel rosarot bis orange, Beine rosafarben",
    "habitat": "Lebt an Seen, Teichen und anderen geeigneten Gewässern mit offenen Nahrungsflächen. Deckungsreiche Gewässer sind während Aufzucht und Mauser besonders wichtig.",
    "biology": [
      "Große Gans mit graubraunem Gefieder und kräftigem Schnabel",
      "Schnabel rosarot bis orange, Beine rosafarben",
      "Geschlechter ähnlich gefärbt",
      "Lebt an Seen, Teichen und anderen geeigneten Gewässern mit offenen Nahrungsflächen",
      "Nahrung überwiegend Gräser, Kräuter, Wasserpflanzen und Kulturpflanzen",
      "Häufig gesellig in Familien und größeren Gruppen",
      "Lautes, mehrsilbiges Gänserufen",
      "Längere Strecken oft in V- oder Keilformation"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/085417/index.php"
      },
      {
        "title": "BirdLife Österreich: Graugans",
        "url": "https://www.birdlife.at/voegel/graugans/"
      },
      {
        "title": "Deutscher Jagdverband: Graugans",
        "url": "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/graugans-anser-anser"
      }
    ]
  },
  {
    "name": "Kanadagans",
    "slug": "kanadagans",
    "scientificName": "Branta canadensis",
    "group": "Gänse und Schwäne",
    "identification": "Schwarzer Kopf und Hals mit weißem Kinnband · Schnabel und Füße schwarz, Körper überwiegend braun-grau",
    "habitat": "In Europa durch Ansiedlungen etabliert. Nutzt Gewässer mit offenen Nahrungsflächen, auch Stadtparks.",
    "biology": [
      "Große Gans mit ursprünglichem Verbreitungsgebiet in Nordamerika",
      "In Europa durch Ansiedlungen etabliert",
      "Schwarzer Kopf und Hals mit weißem Kinnband",
      "Schnabel und Füße schwarz, Körper überwiegend braun-grau",
      "Geschlechter ähnlich gefärbt",
      "Nutzt Gewässer mit offenen Nahrungsflächen, auch Stadtparks",
      "Nahrung überwiegend Gräser, Kräuter, Wasserpflanzen und Getreide",
      "Fliegt häufig in Keilformation"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/087928/index.php"
      }
    ]
  },
  {
    "name": "Nilgans",
    "slug": "nilgans",
    "scientificName": "Alopochen aegyptiaca",
    "group": "Gänse und Schwäne",
    "identification": "Graubraunes Gefieder und auffälliges weißes Flügelfeld · Rötlicher Schnabel und rosa bis rötliche Beine",
    "habitat": "Nutzt verschiedene Still- und Fließgewässer sowie Park- und Agrarflächen.",
    "biology": [
      "Entenvogel mit ursprünglichem Verbreitungsgebiet in Afrika",
      "In Europa durch Aussetzungen und entkommene Ziervögel etabliert",
      "Charakteristischer brauner Augenfleck",
      "Graubraunes Gefieder und auffälliges weißes Flügelfeld",
      "Rötlicher Schnabel und rosa bis rötliche Beine",
      "Nutzt verschiedene Still- und Fließgewässer sowie Park- und Agrarflächen",
      "Nahrung vorwiegend pflanzlich; weidet häufig an Land",
      "Kann Nahrung und Brutbereich energisch verteidigen"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/087931/index.php"
      }
    ]
  },
  {
    "name": "Rabenkrähe",
    "slug": "rabenkraehe",
    "scientificName": "Corvus corone",
    "group": "Krähen und Tauben",
    "identification": "Rabenvogel mit durchgehend schwarzem Gefieder · Schnabel und Beine ebenfalls dunkel · Im Unterschied zur erwachsenen Saatkrähe ist die Schnabelwurzel befiedert",
    "habitat": "Nutzt halboffene Landschaften und Siedlungen.",
    "biology": [
      "Rabenvogel mit durchgehend schwarzem Gefieder",
      "Schnabel und Beine ebenfalls dunkel",
      "Im Unterschied zur erwachsenen Saatkrähe ist die Schnabelwurzel befiedert",
      "Nutzt halboffene Landschaften und Siedlungen",
      "Raue krächzende Stimme; gehört systematisch zu den Singvögeln",
      "Allesfresser mit pflanzlicher und tierischer Nahrung sowie Aas",
      "Geschlechter ähnlich gefärbt",
      "Verpaarte Tiere verhalten sich territorial; Nichtbrüter bilden häufig Trupps"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/131712/index.php"
      },
      {
        "title": "Poelstra et al. 2014: Krähen-Hybridzone",
        "url": "https://pubmed.ncbi.nlm.nih.gov/24948738/"
      }
    ]
  },
  {
    "name": "Nebelkrähe",
    "slug": "nebelkraehe",
    "scientificName": "Corvus cornix",
    "group": "Krähen und Tauben",
    "identification": "Rabenvogel mit grauem Rumpf und schwarzem Kopf, Brustbereich, Flügeln und Schwanz",
    "habitat": "Nutzt offene Landschaften und Siedlungsbereiche.",
    "biology": [
      "Rabenvogel mit grauem Rumpf und schwarzem Kopf, Brustbereich, Flügeln und Schwanz",
      "Als Corvus cornix geführt; eng mit der Rabenkrähe verwandt",
      "In Kontaktzonen entstehen Hybriden; keine beliebige Farbvariante einzelner Rabenkrähen",
      "Nutzt offene Landschaften und Siedlungsbereiche",
      "Krächzende Rufe ähneln denen der Rabenkrähe",
      "Allesfresser: Wirbellose, kleine Wirbeltiere, Aas, Samen, Früchte und weitere Nahrung",
      "Verpaarte Tiere verteidigen Brutreviere gegen Nichtbrütertrupps",
      "Kann Personen und Fahrzeuge unterscheiden und auf Erfahrungen reagieren"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "BirdLife Österreich: Artprofil",
        "url": "https://www.birdlife.at/voegel/nebelkraehe/"
      },
      {
        "title": "Knief et al. 2019: Krähen-Hybridzone",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC6445362/"
      }
    ]
  },
  {
    "name": "Elster",
    "slug": "elster",
    "scientificName": "Pica pica",
    "group": "Krähen und Tauben",
    "identification": "Rabenvogel mit langem Schwanz und kontrastreichem schwarz-weißem Gefieder · Jungvögel haben zunächst kürzere Schwanzfedern",
    "habitat": "Häufig in halboffenen Landschaften, Dörfern, Parks und Gärten.",
    "biology": [
      "Rabenvogel mit langem Schwanz und kontrastreichem schwarz-weißem Gefieder",
      "Dunkle Federn können blau-grün schillern",
      "Häufig in halboffenen Landschaften, Dörfern, Parks und Gärten",
      "Typischer schackernder Ruf",
      "Kulturfolger mit anpassungsfähigem Verhalten",
      "Allesfresser: Wirbellose, kleine Wirbeltiere, Aas, Samen und Früchte",
      "Auch Vogeleier können zum Nahrungsspektrum gehören; dies beweist keine allgemeine Verdrängung anderer Arten",
      "Geschlechter ähnlich gefärbt"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/213481/index.php"
      }
    ]
  },
  {
    "name": "Eichelhäher",
    "slug": "eichelhaeher",
    "scientificName": "Garrulus glandarius",
    "group": "Krähen und Tauben",
    "identification": "Rabenvogel mit beigebraunem Gefieder · Weißer Bürzel und dunkle Schwanzfedern im Flug sichtbar · Lautes Rätschen kann vor Störungen warnen; daher die Bezeichnung Wächter des Waldes",
    "habitat": "Nutzt verschiedene Wälder, Parkanlagen und Siedlungsbereiche.",
    "biology": [
      "Rabenvogel mit beigebraunem Gefieder",
      "Auffällige blau-schwarz gebänderte Flügelfedern",
      "Weißer Bürzel und dunkle Schwanzfedern im Flug sichtbar",
      "Nutzt verschiedene Wälder, Parkanlagen und Siedlungsbereiche",
      "Lautes Rätschen kann vor Störungen warnen; daher die Bezeichnung Wächter des Waldes",
      "Versteckt besonders Eicheln und andere Baumsamen als Vorräte",
      "Nicht wieder genutzte Samen können keimen und zur Waldverjüngung beitragen",
      "Nahrung: Baumsamen und weitere pflanzliche sowie tierische Bestandteile"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/100839/index.php"
      }
    ]
  },
  {
    "name": "Ringeltaube",
    "slug": "ringeltaube",
    "scientificName": "Columba palumbus",
    "group": "Krähen und Tauben",
    "identification": "Überwiegend graublaues Gefieder mit rötlicher Brust",
    "habitat": "Nutzt Wälder, Feldgehölze, Parks und Siedlungsbereiche.",
    "biology": [
      "Große heimische Wildtaube",
      "Erwachsene mit weißen Halsflecken und weißem Flügelband",
      "Jungvögeln fehlt der deutliche weiße Halsfleck zunächst",
      "Überwiegend graublaues Gefieder mit rötlicher Brust",
      "Nutzt Wälder, Feldgehölze, Parks und Siedlungsbereiche",
      "Nahrung überwiegend Samen, Früchte, Knospen und grüne Pflanzenteile",
      "Außerhalb der Brutzeit gesellig",
      "Zugverhalten variiert; viele mitteleuropäische Vögel sind Teilzieher"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/099167/index.php"
      },
      {
        "title": "Landesforsten Rheinland-Pfalz: Ringeltaube",
        "url": "https://www.wald.rlp.de/wald/voegel/ringeltaube"
      },
      {
        "title": "DJV: Ringeltaube",
        "url": "https://www.jagdverband.de/zahlen-fakten/tiersteckbriefe/ringeltaube-columba-palumbus"
      }
    ]
  },
  {
    "name": "Türkentaube",
    "slug": "tuerkentaube",
    "scientificName": "Streptopelia decaocto",
    "group": "Krähen und Tauben",
    "identification": "Schlanke, beigegraue Taube",
    "habitat": "Dörfer, Gärten und Städte; Kulturfolger. Frisst überwiegend Getreide, andere Samen und weitere Pflanzenteile.",
    "biology": [
      "Schlanke, beigegraue Taube",
      "Erwachsene mit schwarzem, vorne offenem Nackenring",
      "Jungvögeln fehlt der deutliche Ring zunächst",
      "Kleiner als die Ringeltaube",
      "Typischer Kulturfolger in Dörfern, Gärten und Städten",
      "Ausbreitung in Europa verstärkt seit den 1930er Jahren",
      "Nahrung überwiegend Getreide und andere Samen, auch weitere Pflanzenteile",
      "Meist Standvogel"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "BirdLife Österreich: Artprofil",
        "url": "https://www.birdlife.at/voegel/tuerkentaube/"
      },
      {
        "title": "Wildtierportal Bayern: Türkentaube",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/100452/index.php"
      },
      {
        "title": "Landesforsten Rheinland-Pfalz: Taubenbiologie und Kropfmilch",
        "url": "https://www.wald.rlp.de/wald/voegel/ringeltaube"
      }
    ]
  },
  {
    "name": "Hohltaube",
    "slug": "hohltaube",
    "scientificName": "Columba oenas",
    "group": "Krähen und Tauben",
    "identification": "Graublaues Gefieder mit grünlich schimmernden Halsseiten · Dunkle Flügelzeichnungen, aber kein weißes Flügelband wie bei der Ringeltaube",
    "habitat": "Nutzt Wälder mit alten Bäumen, aber auch Parkanlagen und Alleen. Nahrungssuche häufig in offener Landschaft.",
    "biology": [
      "Heimische Wildtaube ohne die weißen Halsflecken erwachsener Ringeltauben",
      "Graublaues Gefieder mit grünlich schimmernden Halsseiten",
      "Kleiner als die Ringeltaube",
      "Benötigt Höhlen für die Brut, häufig alte Schwarzspechthöhlen",
      "Nutzt Wälder mit alten Bäumen, aber auch Parkanlagen und Alleen",
      "Nahrungssuche häufig in offener Landschaft",
      "Frisst Samen, Früchte und weitere Pflanzenteile",
      "In Mitteleuropa überwiegend Zugvogel; Zugverhalten regional verschieden"
    ],
    "confusion": "Mehrere Merkmale gemeinsam prüfen; Alter, Geschlecht, Jahreszeit und Beobachtungsbedingungen berücksichtigen.",
    "voice": "Lautäußerungen hängen von Situation und Jahreszeit ab. Ein Ruf allein sichert die Artbestimmung nicht.",
    "biologySources": [
      {
        "title": "Wildtierportal Bayern: Biologie",
        "url": "https://www.wildtierportal.bayern.de/wildtiere_bayern/099087/index.php"
      },
      {
        "title": "Landesforsten Rheinland-Pfalz: Taubenbiologie und Kropfmilch",
        "url": "https://www.wald.rlp.de/wald/voegel/ringeltaube"
      }
    ]
  }
];

export const wildlifeResearchDate = "2026-10-04";
export const legacyWildlifeSlugs = legacyRecords.map(record => record.slug);

const birdRecords = [
  ["haselhuhn", "Haselhuhn", "Tetrastes bonasia", "Hühner und Raufußhühner", "Kleines, fein gemustertes Waldhuhn; der Hahn hat eine schwarze, hell umrandete Kehle.", "Strukturreiche Wälder mit dichtem Unterwuchs; Nahrung aus Knospen, Blättern und Samen, Jungvögel benötigen auch Insekten.", "Mit Rebhuhn oder jungen Raufußhühnern vergleichen; Kehle, Größe und Waldlebensraum zusammen beurteilen.", "Der Reviergesang ist eine hohe, dünne Pfeifreihe.", "haselhuhn"],
  ["steinhuhn", "Steinhuhn", "Alectoris graeca", "Hühner und Raufußhühner", "Graue Brust, rote Beine und roter Schnabel; ein schwarzes Band begrenzt die helle Kehle.", "Sonnige, felsige Berghänge mit Grasvegetation; frisst überwiegend Pflanzenteile, auch kleine Wirbellose.", "Chukar- und Rothuhn sind ähnliche Arten. Die Kehlzeichnung allein genügt bei ausgesetzten oder hybriden Vögeln nicht.", "Lautes, rhythmisches, sich beschleunigendes Rufen.", "steinhuhn"],
  ["wachtel", "Wachtel", "Coturnix coturnix", "Hühner und Raufußhühner", "Sehr kleines, bräunlich gestreiftes Feldhuhn; oft durch seinen Ruf auffälliger als durch Sichtungen.", "Offene Landschaften mit ausreichend hoher Bodenvegetation, etwa Getreidefelder und Wiesen; Zugvogel.", "Der Wachtelkönig ist eine Ralle und hat einen anderen Ruf. Haushühner und Japanwachteln ersetzen keine Wildartenbestimmung.", "Der dreiteilige Wachtelschlag wird oft mit 'pick-per-wick' beschrieben.", "wachtel"],
  ["schnatterente", "Schnatterente", "Mareca strepera", "Enten", "Der Erpel wirkt grau gemustert mit schwarzem Hinterende; beide Geschlechter zeigen einen weißen Flügelspiegel.", "Flache, pflanzenreiche Gewässer; eine Gründelente, die überwiegend pflanzliche Nahrung nutzt.", "Weibchen ähneln Stockenten. Den weißen Spiegel und die Schnabelzeichnung gemeinsam beachten.", "Der Erpel ruft kurz und knarrend, das Weibchen quakt.", "schnatterente"],
  ["loeffelente", "Löffelente", "Spatula clypeata", "Enten", "Auffällig breiter, löffelförmiger Schnabel; der Erpel im Prachtkleid mit grünem Kopf, weißer Brust und kastanienbraunen Flanken.", "Flache, nährstoffreiche Gewässer; siebt kleine Nahrungspartikel mit dem Schnabel aus dem Wasser.", "Der breite Schnabel hilft auch bei Weibchen und im Schlichtkleid; eine Kopf-Farbe allein ist unsicher.", "Der Erpel ruft leise nasal, das Weibchen quakend.", "loeffelente"],
  ["knaekente", "Knäkente", "Spatula querquedula", "Enten", "Kleine Gründelente; der Erpel im Prachtkleid trägt einen breiten weißen Überaugenstreif.", "Seichte, vegetationsreiche Gewässer; überwintert überwiegend außerhalb Europas.", "Weibchen nicht allein anhand der Größe von Krickenten unterscheiden; Kopfzeichnung und Flügelmerkmale vergleichen.", "Der Erpel gibt ein trockenes, knarrendes Rattern von sich.", "knaekente"],
  ["schellente", "Schellente", "Bucephala clangula", "Enten", "Erpel mit weißem rundem Wangenfleck und dunklem Kopf; Weibchen mit braunem Kopf und gelblicher Schnabelspitze.", "Tauchente an Seen und Flüssen; sucht vor allem tierische Nahrung unter Wasser und brütet in Höhlen.", "Kopfgestalt und Wangenfleck von anderen schwarz-weißen Tauchenten unterscheiden.", "Neben Rufen ist das klingende Flügelgeräusch im Flug charakteristisch; ein Fluggeräusch ist kein Stimmruf.", "schellente"],
  ["bergente", "Bergente", "Aythya marila", "Enten", "Erpel mit dunklem Kopf, fein gemustertem grauem Rücken und hellen Flanken; kein langer Reiherenten-Schopf.", "Brütet überwiegend im Norden; in DACH vor allem Wintergast an großen Gewässern, häufig zwischen anderen Tauchenten.", "Reiherente: Rücken gewöhnlich dunkel. Weibchen beider Arten können am Schnabelansatz weiß zeigen.", "Ruft meist leise; Sichtmerkmale sind oft besser zugänglich.", "bergente"],
  ["eiderente", "Eiderente", "Somateria mollissima", "Enten", "Große Meeresente mit keilförmigem Kopfprofil; Erpel im Prachtkleid schwarz-weiß, Weibchen braun gebändert.", "Vor allem Küsten und Meer; taucht nach Muscheln und anderen Meerestieren, im Binnenland seltener Gast.", "Nicht mit einer beliebigen großen braunen Ente gleichsetzen; Stirn-Schnabel-Profil und Zeichnung prüfen.", "Erpel mit weichen, gurrenden Balzlauten; Weibchen mit raueren Rufen.", "eiderente"],
  ["eisente", "Eisente", "Clangula hyemalis", "Enten", "Kleine Meeresente mit stark wechselndem Jahreskleid; adulte Männchen besitzen lange mittlere Schwanzfedern.", "Nördliche Brutgebiete, im Winter vor allem Meeresküsten; taucht nach kleinen Wassertieren.", "Jungvögel und Weibchen haben keinen langen Schwanz. Das gesamte Kleid und Kopfprofil vergleichen.", "Die Männchen rufen melodisch und mehrsilbig.", "eisente"],
  ["samtente", "Samtente", "Melanitta fusca", "Enten", "Dunkle Meeresente; auffälliges weißes Flügelfeld, beim Erpel zusätzlich heller Fleck unter dem Auge.", "Vorwiegend nördlicher Brutvogel und Küsten-Wintergast; nimmt am Gewässergrund vor allem tierische Nahrung auf.", "Trauerenten haben kein entsprechendes weißes Flügelfeld. Helle Gesichtsflecken bei Weibchen berücksichtigen.", "Meist wenig auffällige Lautäußerungen; Sichtbestimmung ist besonders wichtig.", "samtente"],
  ["trauerente", "Trauerente", "Melanitta nigra", "Enten", "Erpel überwiegend schwarz mit gelbem Schnabelbereich; Weibchen braun mit helleren Wangen, kein weißer Flügelspiegel.", "Überwintert vor allem auf dem Meer, selten an Binnengewässern; taucht nach Muscheln und anderen Wirbellosen.", "Samtente im Flug am weißen Flügelfeld unterscheiden. Eine schwarze Silhouette genügt nicht.", "Der Erpel kann feine, pfeifende Laute äußern.", "trauerente"],
  ["kolbenente", "Kolbenente", "Netta rufina", "Enten", "Erpel im Prachtkleid mit rundem orangebraunem Kopf, rotem Schnabel und schwarzer Brust; Weibchen deutlich unauffälliger.", "Vegetationsreiche Seen; nimmt oft Wasserpflanzen auf, taucht und gründelt.", "Tafelenten-Erpel haben einen anders geformten Kopf und dunklen Schnabel. Weibchen beider Arten sorgfältig vergleichen.", "Meist kurze und wenig auffällige Rufe.", "kolbenente"],
  ["moorente", "Moorente", "Aythya nyroca", "Enten", "Kleine kastanienbraune Tauchente mit weißer Unterschwanzregion; adulte Männchen haben eine helle Iris.", "Deckungsreiche Flachgewässer mit ausgedehnter Vegetation; seltene Brut- und Gastvogelart.", "Junge Tafel- und Reiherenten können ähnlich wirken. Augenfarbe allein genügt bei Weibchen und Jungvögeln nicht.", "Wenig auffällige Rufe; genaue Sichtmerkmale sind entscheidend.", "moorente"],
  ["mandarinente", "Mandarinente", "Aix galericulata", "Enten", "Erpel mit auffälligem buntem Prachtkleid und aufgerichteten orangefarbenen 'Segelfedern'; Weibchen grau mit weißem Augenring und Augenstreif.", "Ursprünglich ostasiatisch; in Europa aus Haltung entstandene Bestände an bewaldeten Gewässern, Höhlenbrüter.", "Weibchen von Brautenten und anderen schlichten Enten über Augenzeichnung und Kopfprofil unterscheiden.", "Feine, kurze Pfeif- und Ruflaute.", "mandarinente"],
  ["blessgans", "Blässgans", "Anser albifrons", "Gänse und Schwäne", "Adulte meist mit weißer Stirnblässe und dunklen Querflecken auf dem Bauch; Jungvögeln fehlen diese Merkmale teilweise.", "Brütet im hohen Norden; rastet im Winter auf offenen Flächen und Gewässern und frisst Pflanzen.", "Zwerggans ist kleiner und besitzt einen auffälligen gelben Augenring. Nicht allein auf eine weiße Stirn verlassen.", "Helle, oft zweisilbige Flugrufe.", "blaessgans"],
  ["saatgans", "Saatgänse – Wald- und Tundrasaatgans", "Anser fabalis / Anser serrirostris", "Gänse und Schwäne", "Graue Gänse mit dunklem Kopf und dunklem Schnabel mit variabler orangefarbener Zeichnung.", "Nördliche Brutgebiete; Wintergäste an Gewässern und auf Feldern. Waldsaatgans und Tundrasaatgans werden als zwei Arten unterschieden.", "Die rechtliche Sammelbezeichnung 'Saatgans' ist nicht automatisch eine Freigabe beider Arten; regionale Artdifferenzierung prüfen.", "Nasale, tiefe Flugrufe, im Verband oft schwer einem Individuum zuzuordnen.", "saatgans"],
  ["kurzschnabelgans", "Kurzschnabelgans", "Anser brachyrhynchus", "Gänse und Schwäne", "Relativ kurzer dunkler Schnabel mit rosa Binde, rosafarbene Beine und grauer Rücken.", "Arktischer Brutvogel; in Mitteleuropa vor allem Durchzügler und Wintergast, nutzt offene Rastlandschaften.", "Saatgänse besitzen meist orangefarbene Beine und eine andere Schnabelfärbung. Licht und Entfernung können Farben verfälschen.", "Höhere, gackernde Flugrufe.", "kurzschnabelgans"],
  ["ringelgans", "Ringelgans", "Branta bernicla", "Gänse und Schwäne", "Kleine dunkle Gans mit schwarzem Kopf und Hals sowie hellem Halsfleck bei Erwachsenen.", "Arktischer Brutvogel; in DACH vor allem an Meeresküsten und Wattengebieten, frisst Pflanzen.", "Von Weißwangengans über den fehlenden großen weißen Wangenfleck unterscheiden; Unterarten und junge Vögel variieren.", "Tiefe, kurze und rollende Rufe.", "ringelgans"],
  ["weisswangengans", "Weißwangengans", "Branta leucopsis", "Gänse und Schwäne", "Weißes Gesicht, schwarze Brust und Hals, grauer gebänderter Rücken; auch Nonnengans genannt.", "Arktische Herkunft und zusätzliche europäische Brutbestände; auf Rastflächen und Weiden meist in Gruppen.", "Kanadagans hat gewöhnlich eine weiße Kinnbinde und einen längeren Hals. Nicht mit einer einzelnen schwarz-weißen Silhouette bestimmen.", "Kurze, bellend wirkende Rufe.", "weisswangengans"],
  ["zwerggans", "Zwerggans", "Anser erythropus", "Gänse und Schwäne", "Kleine graue Gans mit gelbem Augenring und meist weit auf die Stirn reichender weißer Blässe.", "Seltene, gefährdete nordische Gans; rastet in offenen Feuchtgebieten, gelegentlich in Trupps anderer Gänse.", "Besonders gefährliche Verwechslung mit Blässgans. Im Zweifel Abstand halten und die Beobachtung dokumentieren.", "Hohe, recht helle Rufreihen.", "zwerggans"],
  ["rostgans", "Rostgans", "Tadorna ferruginea", "Gänse und Schwäne", "Rostorange Halbgans mit hellerem Kopf und schwarzen Schwingen; Männchen kann einen dunklen Halsring zeigen.", "Natürliche Verbreitung unter anderem in Südosteuropa und Asien; in DACH auch aus Haltung hervorgegangene Bestände.", "Nicht mit Nilgans verwechseln, die einen dunklen Augenfleck und eine andere Körperzeichnung besitzt.", "Laute, nasale Rufe.", "rostgans"],
  ["brandgans", "Brandgans", "Tadorna tadorna", "Gänse und Schwäne", "Kontrastreiche weiß-schwarze Halbgans mit breitem rostbraunem Brustband und rotem Schnabel.", "Vor allem Küsten, auch Binnengewässer; nutzt kleine Wassertiere als Nahrung und brütet häufig in Höhlen.", "Eine helle Ente im Schlichtkleid ist keine sichere Brandgans; Brustband, Größe und Schnabel prüfen.", "Männchen pfeifen, Weibchen rufen nasal.", "brandgans"],
  ["hoeckerschwan", "Höckerschwan", "Cygnus olor", "Gänse und Schwäne", "Großer weißer Schwan mit orangefarbenem Schnabel und schwarzem Schnabelhöcker; Junge grau bis bräunlich.", "Seen und langsam fließende Gewässer; ernährt sich überwiegend pflanzlich und hält Brutreviere besetzt.", "Sing- und Zwergschwan haben eine andere, gelb-schwarze Schnabelzeichnung. Die gebogene Halshaltung allein reicht nicht.", "Zischen und andere leise Laute; das hörbare Flügelrauschen ist keine Stimme.", "hoeckerschwan"],
  ["waldschnepfe", "Waldschnepfe", "Scolopax rusticola", "Schnepfen und Rallen", "Gedrungener, braun gemusterter Schnepfenvogel mit langem Schnabel und quer gebändertem Scheitel.", "Feuchte, strukturreiche Wälder; tastet im Boden nach Wirbellosen. Balzflug über Waldlichtungen in der Dämmerung.", "Bekassine hat eine andere Kopfstreifung und ist stärker an offene Feuchtgebiete gebunden.", "Im Balzflug tiefe quorrende Laute und ein hoher 'Puitz'-Ruf.", "waldschnepfe"],
  ["bekassine", "Bekassine", "Gallinago gallinago", "Schnepfen und Rallen", "Langer gerader Schnabel, braun gemustertes Gefieder und helle Längsstreifen auf Kopf und Rücken.", "Feuchte Wiesen, Moore und Schlammflächen; sucht kleine Bodentiere. Benötigt ausreichend nasse Böden.", "Von Waldschnepfe und Zwergschnepfe anhand von Kopfzeichnung, Proportionen und Verhalten unterscheiden.", "Ruft beim Auffliegen; das 'Meckern' im Balzflug entsteht durch vibrierende Schwanzfedern und ist kein Stimmruf.", "bekassine"],
  ["blaesshuhn", "Blässhuhn", "Fulica atra", "Schnepfen und Rallen", "Dunkles Wasserhuhn mit weißem Schnabel und weißem Stirnschild; Zehen mit Schwimmlappen.", "Seen, Teiche und langsam fließende Gewässer; frisst Pflanzen und kleine Tiere, kann tauchen.", "Teichhuhn hat unter anderem eine rote Stirnregion mit gelber Schnabelspitze. Junge Blässhühner sind anders gefärbt als Erwachsene.", "Kurze, scharfe 'Köck'- und 'Pitt'-Laute.", "blaesshuhn"],
  ["haubentaucher", "Haubentaucher", "Podiceps cristatus", "Taucher, Kormorane und Reiher", "Langer Hals und spitzer Schnabel; im Brutkleid auffällige schwarze Haube und rostbraune Halskrause.", "Größere Gewässer mit geeigneten Brutplätzen; fängt vor allem Fische durch Tauchen, schwimmendes Nest.", "Im Winter fehlt die auffällige Halskrause. Mit anderen Lappentauchern über Größe und Kopfprofil vergleichen.", "Raues, wiederholtes Rufen, oft während der Balz.", "haubentaucher"],
  ["kormoran", "Kormoran", "Phalacrocorax carbo", "Taucher, Kormorane und Reiher", "Großer dunkler Wasservogel mit langem Hals und hakiger Schnabelspitze; trocknet häufig die ausgebreiteten Flügel.", "Gewässer aller Größen; jagt Fische tauchend und brütet oft in Kolonien.", "Die ähnliche Krähenscharbe und andere Scharben nicht allein anhand einer dunklen Silhouette ausschließen.", "An Kolonien gutturale und knarrende Rufe; außerhalb oft still.", "kormoran"],
  ["graureiher", "Graureiher", "Ardea cinerea", "Taucher, Kormorane und Reiher", "Großer grauer Reiher mit langen Beinen und dolchförmigem Schnabel; fliegt gewöhnlich mit eingezogenem Hals.", "Gewässer, Feuchtgebiete und Felder; frisst Fische, Amphibien und andere kleine Tiere.", "Silberreiher ist weiß, Kranich hält beim Flug den Hals gestreckt. Größe allein reicht nicht.", "Lautes, raues Krächzen, häufig im Flug.", "graureiher"],
  ["kolkrabe", "Kolkrabe", "Corvus corax", "Krähen und Tauben", "Sehr großer Rabenvogel mit kräftigem Schnabel, zottiger Kehlbefiederung und keilförmigem Schwanz im Flug.", "Wälder, Gebirge, Küsten und Kulturlandschaften; nutzt ein breites Nahrungsspektrum einschließlich Aas.", "Rabenkrähe ist kleiner und hat eine andere Schwanzform; Perspektive und fehlender Größenvergleich erschweren die Bestimmung.", "Tiefe, resonante 'Kroak'-Laute und ein vielfältiges weiteres Rufrepertoire.", "kolkrabe"],
  ["saatkraehe", "Saatkrähe", "Corvus frugilegus", "Krähen und Tauben", "Erwachsene mit unbefiederter heller Schnabelbasis; schwarzes glänzendes Gefieder, spitzer Schnabel.", "Offene Kulturlandschaft; Koloniebrüter in Bäumen, Nahrung unter anderem Bodentiere und Samen.", "Jungvögel haben noch eine befiederte Schnabelbasis und können Rabenkrähen ähneln.", "Raue, oft langgezogene Rufe, in Kolonien vielfach überlagert.", "saatkraehe"],
  ["turteltaube", "Turteltaube", "Streptopelia turtur", "Krähen und Tauben", "Kleine Taube mit rostbraun geschuppten Flügeln und schwarz-weiß gestreiftem Halsfleck bei Erwachsenen.", "Strukturreiche warme Kulturlandschaften mit Gehölzen; Langstreckenzieher, frisst vor allem Samen.", "Türkentaube ist gleichmäßiger hell und besitzt einen schwarzen Nackenhalbring. Junge Turteltauben zeigen den Halsfleck schwächer.", "Leises, anhaltend schnurrendes Gurren.", "turteltaube"],
  ["verwilderte-haustaube", "Verwilderte Haustaube", "Columba livia forma domestica", "Krähen und Tauben", "Aus Haustauben hervorgegangene Vögel mit sehr variabler Zeichnung; Grundform mit zwei dunklen Flügelbinden.", "Vor allem Siedlungen und Gebäude, daneben offene Flächen; nutzt überwiegend Samen und andere pflanzliche Nahrung.", "Von Hohl- und Ringeltaube unterscheiden; ein einzelnes ungewöhnlich gefärbtes Tier kann eine entflogene, gekennzeichnete Haustaube sein.", "Gurrende Rufe; Klang und Balzverhalten unterstützen die Bestimmung.", "strassentaube"],
  ["wacholderdrossel", "Wacholderdrossel", "Turdus pilaris", "Weitere Vögel", "Grauer Kopf und Bürzel, kastanienbrauner Rücken und gefleckte Brust.", "Waldränder und offene Landschaften; frisst Bodentiere und im Winter viele Beeren, oft in Trupps.", "Von Mistel- und Singdrossel durch die Kombination aus grauem Kopf und braunem Rücken unterscheiden.", "Auffällige schackernde Rufreihen.", "wacholderdrossel"],
  ["lachmoewe", "Lachmöwe", "Chroicocephalus ridibundus", "Möwen", "Kleine Möwe; im Brutkleid brauner Kopf, im Winter heller Kopf mit dunklem Ohrfleck, rote Beine und Schnabel bei Erwachsenen.", "Küsten und Binnengewässer; Koloniebrüter, breites Nahrungsspektrum.", "Nicht jede Möwe mit dunklem Kopf ist eine Lachmöwe; Alter, Flügelzeichnung und Kopfhaube beachten.", "Scharfe, kreischende Rufreihen.", "lachmoewe"],
  ["sturmmoewe", "Sturmmöwe", "Larus canus", "Möwen", "Mittelgroße Möwe mit grauem Rücken, bei Erwachsenen meist gelbgrünen Beinen und unauffälligerem Schnabel als Silbermöwen.", "Küsten und Binnenland, auch auf Feldern; frisst kleine Tiere und anderes verfügbares Futter.", "Junge Möwen verschiedener Arten sind schwer zu trennen. Größe ist bei fehlendem Vergleich unsicher.", "Helle, durchdringende Rufe.", "sturmmoewe"],
  ["silbermoewe", "Silbermöwe", "Larus argentatus", "Möwen", "Große Möwe mit hellgrauem Rücken, gelbem Schnabel mit rotem Fleck und bei Erwachsenen meist rosafarbenen Beinen.", "Schwerpunkt an nördlichen Küsten, auch Binnenland; vielseitige Nahrung und Koloniebrut.", "Mittelmeer- und Steppenmöwen können sehr ähnlich sein. Jungvögel erfordern mehrere Fachmerkmale.", "Lautes, mehrsilbiges Möwengeschrei.", "silbermoewe"],
  ["mantelmoewe", "Mantelmöwe", "Larus marinus", "Möwen", "Sehr große Möwe mit schwarzem Oberrücken und bei Erwachsenen meist rosafarbenen Beinen.", "Vor allem Küsten; nutzt Fische, Aas und weitere tierische Nahrung, im Binnenland seltener.", "Heringsmöwen sind kleiner und Erwachsene haben gewöhnlich gelbe Beine. Größenvergleich und Flügelzeichnung helfen.", "Tiefe, kräftige Möwenrufe.", "mantelmoewe"],
  ["heringsmoewe", "Heringsmöwe", "Larus fuscus", "Möwen", "Große Möwe mit dunkelgrauem bis schwarzem Rücken; Erwachsene meist mit gelben Beinen.", "Küsten und Binnengewässer, teils Zugvogel; nutzt Fische und ein breites weiteres Nahrungsspektrum.", "Von Mantelmöwe anhand von Proportionen, Rückenfarbe und Beinen unterscheiden; Jugendkleider besonders sorgfältig prüfen.", "Rufreihen ähnlich anderen großen Möwen; Stimme allein ist unsicher.", "heringsmoewe"],
  ["mittelmeermoewe", "Mittelmeermöwe", "Larus michahellis", "Möwen", "Große graurückige Möwe mit gelben Beinen bei Erwachsenen; kräftiger gelber Schnabel mit rotem Fleck.", "Mittelmeerraum und zunehmend mitteleuropäische Gewässer; Koloniebrüter und Nahrungsgeneralist.", "Mit Silber- und Steppenmöwe anhand mehrerer Merkmale vergleichen; Beinfarbe allein ist keine sichere Artbestimmung.", "Kräftige Rufe ähnlich anderen großen Möwen.", "mittelmeermoewe"],
  ["gaensesaeger", "Gänsesäger", "Mergus merganser", "Säger", "Langer schmaler roter Schnabel; Erpel im Prachtkleid mit dunklem Kopf und heller Unterseite, Weibchen mit rotbraunem Kopf und weißem Kinn.", "Flüsse und Seen; taucht nach Fischen, brütet häufig in Höhlen.", "Mittelsäger-Weibchen ähnlich; Halsübergang, Kopfprofil und Schnabel gemeinsam prüfen.", "Meist leise, rau oder knarrend rufend.", "gaensesaeger"],
  ["mittelsaeger", "Mittelsäger", "Mergus serrator", "Säger", "Schlanker Säger mit dünnem rotem Schnabel und struppiger Haube; Erpel im Prachtkleid mit rostbrauner Brust.", "Nördliche Gewässer und Küsten; überwintert vorwiegend am Meer und frisst hauptsächlich Fische.", "Weibchen sorgfältig vom Gänsesäger unterscheiden; kein einzelnes Kopfmerkmal isoliert verwenden.", "Leise, rau oder gurrend wirkende Rufe.", "mittelsaeger"],
  ["zwergsaeger", "Zwergsäger", "Mergellus albellus", "Säger", "Kleiner Säger; Erpel im Prachtkleid überwiegend weiß mit schwarzen Zeichnungen, Weibchen mit braunem Scheitel und weißen Wangen.", "Nordischer Brutvogel und Wintergast auf Binnengewässern; frisst kleine Wassertiere einschließlich Fischen.", "Nicht mit kleinen schwarz-weißen Tauchenten gleichsetzen; Kopf- und Schnabelproportionen prüfen.", "Meist wenig auffällige Rufe.", "zwergsaeger"],
  ["waldkauz", "Waldkauz", "Strix aluco", "Weitere Vögel", "Runder Kopf ohne Federohren, dunkle Augen und braunes oder graues Gefieder.", "Wälder und baumreiche Siedlungen; jagt vor allem kleine Wirbeltiere, brütet in Höhlen.", "Waldohreule hat Federohren und orangefarbene Augen; Stimme und Silhouette gemeinsam prüfen.", "Gesang mit einem gedehnten Laut, Pause und einer abschließenden Rufreihe; daneben scharfe Kontaktrufe.", "waldkauz"],
  ["amsel", "Amsel", "Turdus merula", "Weitere Vögel", "Erwachsene Männchen schwarz mit gelbem Schnabel; Weibchen und junge Vögel überwiegend braun.", "Wälder, Gärten und Parks; sucht Bodentiere und frisst Früchte.", "Star hat andere Proportionen und häufig geflecktes Gefieder. Geschlecht und Jugendkleid berücksichtigen.", "Flötender Gesang sowie kurze Warn- und Kontaktrufe.", "amsel"],
  ["kuckuck", "Kuckuck", "Cuculus canorus", "Weitere Vögel", "Schlanker Vogel mit langem Schwanz; meist graue Oberseite und quer gebänderte Unterseite.", "Strukturreiche Landschaften; Brutparasit, dessen Eier von anderen Vogelarten ausgebrütet werden.", "Sperber kann eine ähnliche Flug-Silhouette zeigen; Flügelgestalt, Verhalten und Stimme vergleichen.", "Männchen mit dem bekannten zweisilbigen Kuckucksruf; Weibchen mit anderem Ruf.", "kuckuck"],
];

const additionalMammals = [
  {slug:"elchwild",name:"Elchwild",scientificName:"Alces alces",group:"Schalenwild",identification:"Sehr große, hochbeinige Hirschart; Kopfprofil, Körperproportionen und Geweih gemeinsam beurteilen.",habitat:"Wald- und Feuchtlandschaften; Äsung unter anderem aus Blättern, Trieben und Wasserpflanzen. Einzelne Tiere können weite Strecken wandern.",confusion:"Nicht mit Rothirsch allein nach Körpergröße bestimmen; Kopfprofil, Hals und Beine vergleichen.",voice:"Körperbau und Verhalten gemeinsam prüfen. Hier liegt keine geprüfte Originalaufnahme vor.",biologySources:[{title:"Bayerische Akademie für Naturschutz: Elche – Merkmale und Lebensweise",url:"https://www.anl.bayern.de/fachinformationen/beweidung/7_13_beweidung_mit_elchen.htm"}]},
  {slug:"wisent",name:"Wisent",scientificName:"Bison bonasus",group:"Schalenwild",identification:"Großes Wildrind mit mächtiger Schulterpartie, kräftigem Vorderkörper und kurzen gebogenen Hörnern bei beiden Geschlechtern.",habitat:"Wald-Offenland-Mosaike; nutzt Gräser, Kräuter und Gehölze. Wiederansiedlungen und gehaltene Tiere sind rechtlich getrennt zu betrachten.",confusion:"Amerikanischer Bison ist eine andere Art. Beobachtungen von Gehegetieren belegen keine frei lebende Population.",voice:"Körperbau und Verhalten gemeinsam prüfen. Hier liegt keine geprüfte Originalaufnahme vor.",biologySources:[{title:"Nationalpark Białowieża: Biologie des Wisents",url:"https://bpn.com.pl/index.php?Itemid=133&id=70&lang=pl&option=com_content&task=view"},{title:"WWF: Wisent – eigener Artenschutzsteckbrief",url:"https://www.wwf.de/themen-projekte/artenlexikon/wisent-europaeisches-bison/"}]},
  {slug:"murmeltier",name:"Alpenmurmeltier",scientificName:"Marmota marmota",group:"Hasenartige und Nagetiere",identification:"Gedrungener großer Nager mit kleinen Ohren, kräftigen Grabpfoten und dunkler Schwanzspitze.",habitat:"Alpine Graslandschaften mit grabfähigem Boden; lebt in Familiengruppen in Bauen und hält Winterschlaf.",confusion:"Lebensraum und Körperform helfen; ein hoher Pfiff allein kann auch von einem Vogel stammen.",voice:"Schrille Warnrufe, die wie Pfiffe klingen; es sind echte Stimm-Laute.",biologySources:[{title:"Deutsche Wildtier Stiftung: Alpenmurmeltier",url:"https://www.deutschewildtierstiftung.de/wildtiere/alpenmurmeltier"}]},
  {slug:"wolf",name:"Wolf",scientificName:"Canis lupus",group:"Raubtiere",identification:"Großer hundeartiger Beutegreifer; Proportionen, Kopf, Fellzeichnung und Bewegungsablauf gemeinsam beurteilen.",habitat:"Sehr anpassungsfähig; benötigt Rückzugsräume, Nahrung und ausreichend durchlässige Landschaften. Rudel sind gewöhnlich Familienverbände.",confusion:"Hunde und Goldschakale können ähnlich wirken. Einzelbilder und Trittsiegel liefern nicht immer sichere Nachweise.",voice:"Heulen dient unter anderem dem Kontakt und der Revierkommunikation; daneben Bellen, Knurren und weitere Laute.",biologySources:[{title:"DBBW: Steckbrief und Biologie des Wolfes",url:"https://dbb-wolf.de/Wolf_Steckbrief/portrait"},{title:"Freistaat Sachsen: Biologie und Kommunikation des Wolfes",url:"https://www.wolf.sachsen.de/faq-die-biologie-des-wolfes-4319.html"},{title:"Oregon Department of Fish and Wildlife: Kommunikation des Wolfes",url:"https://dfw.state.or.us/Wolves/biology.html"}]},
  {slug:"goldschakal",name:"Goldschakal",scientificName:"Canis aureus",group:"Raubtiere",identification:"Hundeartiger Beutegreifer, gewöhnlich kleiner und feiner gebaut als ein Wolf; kurzer dunkler Schwanz und goldbraunes bis graues Fell.",habitat:"Natürliche Ausbreitung aus Südosteuropa; nutzt strukturreiche Landschaften und ein vielseitiges Nahrungsspektrum.",confusion:"Fuchs, Hund und Wolf sorgfältig ausschließen; Farbe und Größe allein sind unzuverlässig.",voice:"Komplexe Heulrufe, auch gemeinsames Heulen in Gruppen.",biologySources:[{title:"FVA Baden-Württemberg: Goldschakal",url:"https://www.fva-bw.de/top-meta-navigation/fachabteilungen/fva-wildtierinstitut/luchs-wolf/goldschakal"},{title:"Graf und Hatlauf (2021): Originalforschung zu Goldschakal-Heulrufen",url:"https://link.springer.com/article/10.1007/s13364-021-00587-2"}]},
  {slug:"mink",name:"Mink – Amerikanischer Nerz",scientificName:"Neogale vison",group:"Raubtiere",identification:"Schlanker dunkler Marder mit relativ langem Schwanz; kann einen hellen Kinnfleck zeigen. In älteren Quellen Neovison vison genannt.",habitat:"Gebietsfremder Beutegreifer, vor allem an Gewässern; nutzt tierische Nahrung und kann gut schwimmen.",confusion:"Europäischer Nerz, Iltis und Fischotter sind andere Arten. Die Bestimmung muss vor jeder Maßnahme sicher sein.",voice:"Für die Bestimmung Körperbau und Verhalten gemeinsam vergleichen; hier liegt keine geprüfte Originalaufnahme vor.",biologySources:[{title:"Wildtierportal Baden-Württemberg: Mink",url:"https://www.wildtierportal-bw.de/de/frontend/product/detail?productId=64"},{title:"British Columbia: American Mink – Artmerkmale",url:"https://a100.gov.bc.ca/pub/eswp/speciesSummary.do?id=15566"},{title:"NCBI Taxonomy: Neogale vison",url:"https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=452646&mode=info"}]},
  {slug:"fischotter",name:"Fischotter",scientificName:"Lutra lutra",group:"Raubtiere",identification:"Langer schlanker Körper, kleine Ohren und kräftiger, zur Spitze schmaler werdender Schwanz; Pfoten mit Schwimmhäuten.",habitat:"Gewässer mit ausreichender Nahrung, Deckung und sicheren Uferverbindungen; Straßenquerungen können gefährliche Engstellen sein.",confusion:"Nutria und Biber sind Nager, der Mink ist wesentlich kleiner. Bei schlechter Sicht keine sichere Artbestimmung behaupten.",voice:"Vielfältige Lautäußerungen, darunter Kontaktpfiffe.",biologySources:[{title:"info fauna: Biologie des Fischotters",url:"https://www.infofauna.ch/de/nationale-koordinationsstellen/fischotterfachstelle/der-fischotter/biologie"},{title:"Gnoli und Prigioni (1995): Originalforschung zu Otter-Kontaktpfiffen",url:"https://doi.org/10.4404/hystrix-7.1-2-4083"}]},
  {slug:"braunbaer",name:"Braunbär",scientificName:"Ursus arctos",group:"Raubtiere",identification:"Großer Beutegreifer mit rundlichen Ohren, kräftigen Gliedmaßen und deutlich ausgeprägter Schulterpartie.",habitat:"Nahrungsgeneralist mit hohem Raumbedarf; europäische Populationen leben unter anderem in den Alpen und bewaldeten Gebirgen.",confusion:"Farbe variiert erheblich; Verhalten und Merkmale gemeinsam prüfen. Beobachtungen aus Abstand dokumentieren.",voice:"Körperbau und Verhalten gemeinsam prüfen. Hier liegt keine geprüfte Originalaufnahme vor.",biologySources:[{title:"LfU Bayern: Braunbär – Biologie und Vorkommen",url:"https://www.lfu.bayern.de/natur/wildtiermanagement_grosse_beutegreifer/baer/faq_baer/index.htm"},{title:"US National Park Service: Ursus arctos – Körpermerkmale",url:"https://www.nps.gov/articles/000/coastal-bear-ecology.htm"}]},
  {slug:"seehund",name:"Seehund",scientificName:"Phoca vitulina",group:"Weitere Säugetiere",identification:"Robbe mit rundlichem Kopf und relativ kurzer Schnauze; Fellzeichnung individuell verschieden.",habitat:"Küsten und Wattenmeer; braucht störungsarme Ruheplätze auf Sandbänken und ernährt sich vorwiegend von Fischen.",confusion:"Kegelrobben haben eine längere Schnauze, besonders auffällig bei den Bullen. Ein allein liegendes Seehund-Jungtier ist nicht automatisch verlassen.",voice:"Vor allem Jungtiere geben auffällige Kontaktlaute von sich; rufende Tiere nicht bedrängen.",biologySources:[{title:"Nationalpark Wattenmeer: Seehund",url:"https://www.nationalpark-wattenmeer.de/wissensbeitrag/seehund/"},{title:"NOAA Fisheries: Harbor Seal – Körpermerkmale",url:"https://www.fisheries.noaa.gov/species/harbor-seal"},{title:"Nationalpark Wattenmeer: Vergleichsart Kegelrobbe",url:"https://www.nationalpark-wattenmeer.de/wissensbeitrag/kegelrobben/"}]},
];

const specialBirds = [
  {slug:"wildtruthuhn",name:"Wildtruthuhn",scientificName:"Meleagris gallopavo",group:"Hühner und Raufußhühner",identification:"Großer Hühnervogel; Hahn mit nackten farbigen Kopfpartien und fächerförmig spreizbarem Schwanz.",habitat:"Nordamerikanischer Ursprung; nutzt Wälder mit angrenzenden offenen Flächen, sucht Nahrung am Boden und schläft in Bäumen. In Europa Wild-, Haus- und Gehegevögel unterscheiden.",confusion:"Eine jagdrechtliche Nennung beweist weder ein örtliches Vorkommen noch den Status eines frei lebenden Wildtiers.",voice:"Der Hahn gibt auffällige kollernde Balzrufe ab.",biologySources:[{title:"US National Park Service: Wild Turkey – Merkmale und Originalrufe",url:"https://www.nps.gov/romo/learn/photosmultimedia/sounds-wildturkey.htm"},{title:"Indiana Department of Natural Resources: Wild Turkey – Lebensweise",url:"https://www.in.gov/dnr/fish-and-wildlife/wildlife-resources/animals/wild-turkey/"}]},
  {slug:"rackelwild",name:"Rackelwild – Auer-/Birkhuhn-Hybrid",scientificName:"Tetrao urogallus × Lyrurus tetrix",group:"Hühner und Raufußhühner",identification:"Kreuzung von Auer- und Birkhuhn; Aussehen kann zwischen den Elternarten liegen. Keine eigenständige Art.",habitat:"Kann bei räumlichem Zusammentreffen der Elternarten entstehen; selten, daher keine pauschale Ansprache aus einem Einzelmerkmal.",confusion:"Ungewöhnliche Auer- oder Birkhühner sind nicht automatisch Rackelwild. Fachkundige Bestimmung erforderlich.",voice:"Laute können von den typischen Balzlauten der Elternarten abweichen; keine Standardaufnahme ersetzt den Nachweis.",biologySources:[{title:"Wildtierportal Bayern: Birkwild und Rackelwild",url:"https://www.wildtierportal.bayern.de/wildtiere_bayern/102436/index.php"},{title:"LBV: dokumentierter Rackelhahn",url:"https://naturfotos.lbv.de/image/Rackelhahn--5086.html"}]},
];

const legalComparisonForms = [
  {slug:"verwilderte-hauskatze",name:"Verwilderte Hauskatze",scientificName:"Felis catus",group:"Raubtiere",identification:"Jagdrechtlich relevante Hauskatzenform in der Schweizer Artenliste. Die Fellfarbe beweist weder Verwilderung noch Besitzlosigkeit.",habitat:"Hauskatzen können auch bei vorhandener menschlicher Versorgung frei laufen und Wildtiere erbeuten. Ein Aufenthalt im Freien allein macht eine Katze nicht verwildert.",confusion:"Von Europäischer Wildkatze und von gehaltenen oder entlaufenen Hauskatzen unterscheiden. Ein einzelnes Sichtmerkmal liefert keine sichere rechtliche Einordnung.",voice:"Miauen und weitere Hauskatzen-Laute bestimmen keinen Eigentums- oder Verwilderungsstatus.",biologySources:[{title:"Schweizerische Vogelwarte und BirdLife: Katzen und Vögel",url:"https://www.birdlife.ch/sites/default/files/documents/Katzen_D.pdf"}]},
];

export const legalSources = {
  deFederal:{title:"Deutschland: BJagdG §§ 2, 22, 22b–22d",url:"https://www.gesetze-im-internet.de/bjagdg/BJNR007800952.html"},
  deTimes:{title:"Deutschland: Bundes-Jagdzeitenverordnung § 1",url:"https://www.gesetze-im-internet.de/jagdzeitv_1977/BJNR005310977.html"},
  deBavaria:{title:"Bayern: AVBayJG §§ 18–19, Fassung ab 1. April 2026",url:"https://www.gesetze-bayern.de/Content/Document/BayAVJG/true"},
  deBavariaUpdate:{title:"Bayern: amtliche Erläuterungen zur Novelle 2026",url:"https://www.stmwi.bayern.de/jagd-forst/oberste-jagdbehoerde/bayerisches-jagdgesetz/"},
  atNoSpecies:{title:"Niederösterreich: NÖ Jagdgesetz § 3, aktuelle Fassung",url:"https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=LrNO&Gesetzesnummer=20000559&Paragraf=3"},
  atNoTimes:{title:"Niederösterreich: NÖ Jagdverordnung § 22, Fassung ab 3. Februar 2026",url:"https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=LrNO&Gesetzesnummer=20001057&Paragraf=22"},
  atNoWolf:{title:"Niederösterreich: NÖ Jagdverordnung § 22a – Wolfsmaßnahmen",url:"https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=LrNO&Gesetzesnummer=20001057&Paragraf=22a"},
  atCarinthia:{title:"Kärnten: Durchführungsverordnung § 6 – Schon- und Jagdzeiten",url:"https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=LrK&Gesetzesnummer=20000210&Paragraf=6"},
  atTyrol:{title:"Tirol: Jagdgesetz 2004, Anlage 1 – Artenverzeichnis",url:"https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=LrT&Gesetzesnummer=10000088&Anlage=1"},
  atOoMink:{title:"Oberösterreich: amtliche Novelle 2025 zur Jagdverordnung, Mink und weitere Arten",url:"https://www.ris.bka.gv.at/Dokumente/LgblAuth/LGBLA_OB_20251113_80/LGBLA_OB_20251113_80.html"},
  atOoOtter:{title:"Oberösterreich: Fischotter-Ausnahmeverordnung, LGBl. 56/2022 – bis 30. November 2028",url:"https://www.ris.bka.gv.at/Dokumente/LgblAuth/LGBLA_OB_20220627_56/LGBLA_OB_20220627_56.html"},
  atOoBirds:{title:"Oberösterreich: Federwildmanagementverordnung, LGBl. 24/2025",url:"https://www.ris.bka.gv.at/Dokumente/LgblAuth/LGBLA_OB_20250313_24/LGBLA_OB_20250313_24.html"},
  atSalzburgBirds:{title:"Salzburg: Vogelabschussplanverordnung 2026/2027 – Graureiher und Kormoran",url:"https://ris.bka.gv.at/Dokumente/LgblAuth/LGBLA_SA_20260219_13/LGBLA_SA_20260219_13.html"},
  atBgTimes:{title:"Burgenland: Wildstandregulierungsverordnung § 1 – Schusszeiten",url:"https://ris.bka.gv.at/Dokumente/Landesnormen/LBG40026782/LBG40026782.html"},
  atStyria:{title:"Steiermark: Jagdgesetz § 2 – Artenverzeichnis",url:"https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=LrStmk&Gesetzesnummer=20000850&Paragraf=2"},
  atVorarlberg:{title:"Vorarlberg: Jagdverordnung §§ 26–27 – Schuss- und Schonzeiten",url:"https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LrVbg&Gesetzesnummer=20000568&ShowPrintPreview=True"},
  atBgProtected:{title:"Burgenland: Wildstandregulierungsverordnung § 2 – ganzjährige Schonung",url:"https://ris.bka.gv.at/Dokumente/Landesnormen/LBG40026783/LBG40026783.html"},
  deNdsExceptions:{title:"Niedersachsen: Jagdzeitenverordnung – besondere Gänseregelungen",url:"https://voris.wolterskluwer-online.de/browse/document/95fe66c5-e8d8-3324-bcb2-f7501a1a0d27"},
  chLaw:{title:"Schweiz: JSG Art. 5, 7 und 7a, Stand 1. Februar 2025",url:"https://www.fedlex.admin.ch/eli/cc/1988/506_506_506/de?version=20250201"},
  chOrder:{title:"Schweiz: JSV Art. 3bis, 4a und 8a, Stand 1. Januar 2026",url:"https://www.fedlex.admin.ch/eli/cc/1988/517_517_517/de?version=20260101"},
  chFramework:{title:"BAFU: kantonale Zuständigkeit, Jagdsysteme und Schutzgebiete",url:"https://www.bafu.admin.ch/de/jagd"},
};

export const legalStatusLabels = {
  season:"Jagdzeit vorgesehen – örtlich prüfen",
  regional:"Regionale Regelung prüfen",
  protected:"Geschützt / keine reguläre Jagdzeit",
  special:"Sonderregelung / behördliche Maßnahme",
  unverified:"Keine pauschale Freigabe ableitbar",
};
export const dachCountries = [{id:"DE",name:"Deutschland"},{id:"AT",name:"Österreich"},{id:"CH",name:"Schweiz"}];
const set = values => new Set(values.split(" "));
const deSeason = set("rotwild damwild rehwild schwarzwild muffelwild gamswild sikawild fuchs dachs steinmarder baummarder iltis hermelin mauswiesel feldhase wildkaninchen fasan rebhuhn stockente krickente pfeifente spiessente tafelente reiherente graugans kanadagans ringeltaube tuerkentaube wildtruthuhn hoeckerschwan blessgans saatgans ringelgans bergente samtente trauerente waldschnepfe blaesshuhn lachmoewe sturmmoewe silbermoewe mantelmoewe heringsmoewe");
const deRegional = set("waschbaer marderhund nutria bisam mink nilgans rabenkraehe nebelkraehe elster eichelhaeher verwilderte-haustaube");
const deClosed = set("steinwild schneehase murmeltier elchwild wisent wildkatze luchs fischotter seehund auerhuhn birkhuhn schneehuhn haselhuhn rackelwild wachtel hohltaube turteltaube schnatterente loeffelente knaekente schellente eiderente eisente kolbenente moorente kurzschnabelgans weisswangengans zwerggans brandgans bekassine haubentaucher kolkrabe saatkraehe gaensesaeger mittelsaeger zwergsaeger waldkauz amsel kuckuck eichhoernchen braunbaer wacholderdrossel");
const atNoSeason = set("rotwild damwild rehwild schwarzwild muffelwild gamswild steinwild sikawild fuchs dachs steinmarder baummarder iltis hermelin mauswiesel feldhase wildkaninchen fasan rebhuhn stockente krickente pfeifente spiessente tafelente reiherente graugans ringeltaube tuerkentaube waschbaer marderhund murmeltier haselhuhn rackelwild schnatterente loeffelente knaekente schellente saatgans nilgans goldschakal waldschnepfe blaesshuhn");
const atRegional = set("schneehase birkhuhn auerhuhn schneehuhn steinhuhn kanadagans wildtruthuhn wachtel bekassine hoeckerschwan nutria bisam eichhoernchen turteltaube rabenkraehe nebelkraehe elster eichelhaeher kolkrabe kormoran graureiher");
const chSeason = set("rotwild damwild rehwild schwarzwild muffelwild gamswild sikawild fuchs dachs steinmarder baummarder feldhase schneehase wildkaninchen fasan birkhuhn schneehuhn stockente krickente pfeifente spiessente tafelente reiherente ringeltaube tuerkentaube waschbaer marderhund murmeltier schnatterente loeffelente knaekente schellente bergente eiderente eisente samtente trauerente mandarinente waldschnepfe blaesshuhn haubentaucher kormoran kolkrabe rabenkraehe nebelkraehe elster eichelhaeher saatkraehe verwilderte-haustaube");

const rule = (status,note,sources) => ({status,note,sources});
function legalFor(slug) {
  const legal = {
    DE: deSeason.has(slug) ? rule("season","Eine Bundes-Jagdzeit ist vorgesehen. Landesrecht, Schutzgebiete, örtliche Freigaben und Elterntierschutz zusätzlich prüfen.",["deTimes","deFederal"]) : deRegional.has(slug) ? rule("regional","Die Einordnung und Bejagbarkeit beruhen auf Landesrecht; eine bundesweit einheitliche Freigabe besteht nicht.",["deFederal","deBavaria"]) : deClosed.has(slug) ? rule("protected","In der Bundes-Jagdzeitenverordnung ist keine reguläre Jagdzeit festgelegt oder die Art fällt unter Artenschutz. Jagdrechtliche Nennung bedeutet keine Freigabe.",["deTimes","deFederal"]) : rule("unverified","Aus den hier geprüften Bundes- und Beispiel-Landesquellen folgt keine allgemeine Jagdfreigabe. Zuständige Behörde und Landesrecht prüfen.",["deFederal","deBavaria"]),
    AT: atNoSeason.has(slug) ? rule("season","Schusszeit beispielsweise in Niederösterreich vorgesehen. Geschlecht, Alter, Elterntierschutz, Abschussplan und Vorgaben des jeweiligen Bundeslandes zusätzlich prüfen.",["atNoTimes","atNoSpecies"]) : atRegional.has(slug) ? rule("regional","Artenverzeichnis, Schonzeit und mögliche besondere Freigabe unterscheiden sich nach Bundesland; die Nennung als Wild genügt nicht.",["atNoSpecies","atCarinthia","atTyrol"]) : rule("unverified","Für diese Art wird hier keine österreichweite Freigabe abgeleitet. Artenliste, ganzjährige Schonung und mögliche Ausnahmen des Bundeslandes prüfen.",["atNoSpecies","atCarinthia","atStyria"]),
    CH: chSeason.has(slug) ? rule("season","Bundesrechtlich jagdbar; der Kanton kann Artenliste und Jagdzeit weiter einschränken. Geschlecht, Alter, Elterntierschutz, Schutzgebiete und Freigaben prüfen.",["chLaw","chOrder","chFramework"]) : rule("protected","Keine reguläre Jagdfreigabe nach der geprüften Bundes-Artenliste; Schutz und mögliche behördliche Sondermaßnahmen getrennt prüfen.",["chLaw","chOrder"]),
  };
  if(slug === "steinwild") legal.CH = rule("special","Steinböcke bleiben geschützt; die Kantone können bewilligte Bestandsregulierungen nach JSG Art. 7a und JSV Art. 4a durchführen.",["chLaw","chOrder"]);
  if(slug === "birkhuhn") legal.CH = rule("season","Die Bundesliste nennt nur den Birkhahn. Birkhennen sind geschützt; auch für Hähne müssen kantonale Jagdzeit, Bestandsfreigabe und Gebietsvorgaben erfüllt sein.",["chLaw","chOrder","chFramework"]);
  if(["haselhuhn","rackelwild"].includes(slug)) legal.AT = rule("season",`${slug === "haselhuhn" ? "Haselhahn" : "Rackelhahn"}: beispielsweise in Niederösterreich mit Schusszeit. Die Nennung gilt nicht automatisch für Hennen; örtliche Freigabe und Bundesland prüfen.`,["atNoTimes"]);
  if(["auerhuhn","birkhuhn"].includes(slug)) legal.AT = rule("regional","Wo eine Freigabe vorgesehen ist, betrifft sie regelmäßig den Hahn und besondere Abschusspläne. Oberösterreich beschränkt Ausnahmen auf bestimmte junge Hähne unter Managementbedingungen. Hennen nicht als automatisch freigegeben behandeln.",["atOoBirds","atCarinthia","atTyrol"]);
  if(["eichhoernchen","steinhuhn"].includes(slug)) legal.AT = rule("unverified","Die Nennung in einzelnen Landes-Artenverzeichnissen beweist keine offene Jagdzeit. In den geprüften Beispielen ist keine gewöhnliche Freigabe abgeleitet.",["atCarinthia","atTyrol","atStyria"]);
  if(slug === "lachmoewe") legal.AT = rule("regional","Vorarlberg sieht eine Schusszeit vor. Das ist keine österreichweite Freigabe; andere Bundesländer und örtliche Voraussetzungen prüfen.",["atVorarlberg"]);
  if(["wachtel","bekassine","wildtruthuhn","kanadagans","hoeckerschwan"].includes(slug)) legal.AT = rule("regional","In einzelnen Bundesländern ist eine Jagdzeit vorgesehen, zum Beispiel Burgenland beziehungsweise Vorarlberg. Ganzjährige Schonung in anderen Ländern und örtliche Freigaben beachten.",["atBgTimes","atVorarlberg","atCarinthia"]);
  if(slug === "weisswangengans") legal.DE = rule("special","Keine gewöhnliche Bundes-Jagdzeit. Zum Beispiel Niedersachsen verlangt zusätzlich eine artenschutzrechtliche Ausnahme für die entsprechende Bejagung.",["deTimes","deNdsExceptions"]);
  if(slug === "verwilderte-hauskatze") {
    legal.CH = rule("season","JSG Art. 5 nennt ausdrücklich verwilderte Hauskatzen. Eine gehaltene, entlaufene oder lediglich frei laufende Katze ist damit nicht automatisch erfasst. Kantonale Zuständigkeit und sichere rechtliche Einordnung prüfen.",["chLaw","chFramework"]);
    legal.DE = rule("special","Keine reguläre Jagdart der Bundesliste. Jagdschutzbestimmungen der Länder sind gesondert zu prüfen; im Freien laufende Katzen sind nicht automatisch herrenlos oder verwildert.",["deFederal"]);
    legal.AT = rule("special","Hauskatzen werden nicht durch die Wildartenliste gewöhnlich jagdbar. Besondere Landes- und Tierschutzbestimmungen prüfen; ein Aufenthalt im Freien genügt nicht.",["atNoSpecies"]);
  }
  if(slug === "wolf") {
    legal.DE = rule("special","Seit der 2026 geltenden Bundesregelung Jagdrechtsart mit besonderen Vorgaben: Managementplan, Erhaltungszustand und §§ 22b–22d bestimmen die Zulässigkeit.",["deFederal"]);
    legal.AT = rule("special","Wolfsmaßnahmen sind bundeslandabhängig; etwa Niederösterreich regelt besondere Eingriffe in § 22a. Kein allgemeiner Abschuss allein nach Artbestimmung.",["atNoWolf","atNoSpecies"]);
    legal.CH = rule("special","Geschützte Art; bewilligte Regulierung und Einzelmaßnahmen nach JSG/JSV sind von regulärer Jagd zu unterscheiden.",["chLaw","chOrder"]);
  }
  if(slug === "goldschakal") legal.DE = rule("special","Zum Beispiel Bayern führt den Goldschakal seit April 2026 im Jagdrecht. Artenliste, konkrete Jagdzeit und Managementvorgaben gesondert prüfen.",["deBavaria","deBavariaUpdate"]);
  if(slug === "mink") legal.AT = rule("season","Zum Beispiel Oberösterreich sieht für Mink keine Schonzeit vor; Zuständigkeit, örtliche Bestimmungen und sichere Abgrenzung zum Europäischen Nerz beachten.",["atOoMink"]);
  if(slug === "fischotter") legal.AT = rule("special","In mehreren Bundesländern ganzjährig geschont; örtlich bestehen befristete Ausnahmeverordnungen. Nur nach deren konkreten Bedingungen.",["atCarinthia","atOoOtter"]);
  if(["biber","nutria","bisam","mink","nilgans","kanadagans","rostgans"].includes(slug)) legal.CH = rule("special","Keine gewöhnliche Freigabe aus JSG Art. 5. Je nach Art kommen angeordnete Konflikt- oder Gebietsfremdenmaßnahmen nach JSG/JSV in Betracht.",["chLaw","chOrder"]);
  if(slug === "rebhuhn" || slug === "moorente") legal.CH = rule("protected","Die Jagdverordnung schützt diese Art ausdrücklich in Art. 3bis. Die gesetzliche Grundliste allein wäre unvollständig.",["chOrder"]);
  if(["wildkatze","luchs","braunbaer","waldkauz","amsel","kuckuck","zwerggans","moorente"].includes(slug)) legal.AT = rule("protected","Keine reguläre Jagd aus der jagdrechtlichen Nennung ableiten; Schutz beziehungsweise ganzjährige Schonung und behördliche Ausnahmen getrennt behandeln.",["atNoSpecies","atCarinthia"]);
  if(slug === "turteltaube") legal.AT = rule("protected","Niederösterreich hat die Schusszeit 2024 gestrichen, Burgenland nennt die Art seit Juli 2024 als ganzjährig geschont. Keine reguläre Freigabe aus älteren Tabellen übernehmen.",["atNoTimes","atBgProtected"]);
  if(["graureiher","kormoran"].includes(slug)) legal.AT = rule("special","Eingriffe können nur nach besonderen Landes- beziehungsweise Ausnahme- oder Managementregelungen zulässig sein. Keine österreichweite reguläre Jagdfreigabe.",["atCarinthia","atStyria","atNoSpecies"]);
  if(slug === "graureiher") legal.AT = rule("special","Zum Beispiel Oberösterreich regelt Eingriffe durch die Federwildmanagementverordnung mit örtlichen, persönlichen und Kontingentbedingungen. Keine gewöhnliche Freigabe für ganz Österreich.",["atOoBirds","atCarinthia"]);
  if(slug === "kormoran") legal.AT = rule("special","Zum Beispiel Salzburg sieht im Vogelabschussplan 2026/2027 örtliche Höchstmengen vor. Maßnahmenvoraussetzungen und Kontingent bleiben entscheidend; daraus folgt keine freie Jagd für ganz Österreich.",["atSalzburgBirds","atCarinthia"]);
  if(["graureiher","kormoran"].includes(slug)) legal.DE = rule("special","Nur konkrete Landesregelung oder behördliche Ausnahme kann eine Maßnahme zulassen. Keine gewöhnliche Jagdfreigabe aus dem Bundes-Artenverzeichnis.",["deFederal","deBavaria"]);
  if(slug === "rackelwild") for(const country of ["DE","AT","CH"]) legal[country].note = `Hybrid, keine eigene Art. ${legal[country].note}`;
  return legal;
}

const expandedBirds = birdRecords.map(([slug,name,scientificName,group,identification,habitat,confusion,voice,sourceSlug]) => ({slug,name,scientificName,group,identification,habitat,confusion,voice,biologySources:[{title:`Schweizerische Vogelwarte: ${name}`,url:`https://www.vogelwarte.ch/de/voegel-der-schweiz/${sourceSlug}/`},...(slug === "saatgans" ? [{title:"Schweizerische Vogelwarte: Artenliste 2026 – zwei Saatgansarten",url:"https://www.vogelwarte.ch/wp-content/uploads/2024/05/ch-artliste-6.pdf"}] : [])]}));
// Legacyname präzisieren, URL und bestehendes Porträt beibehalten.
const legacy = legacyRecords.map(record => record.slug === "schneehuhn" ? {...record,name:"Alpenschneehuhn",scientificName:"Lagopus muta"} : record.slug === "iltis" ? {...record,confusion:"Waldiltis, geschützter Steppeniltis, Mink und Fischotter sind getrennt zu bestimmen. Eine Freigabe für den Waldiltis gilt nicht automatisch für eine andere Iltisart."} : record);
const aliasesBySlug = {rotwild:["Rothirsch"],damwild:["Damhirsch"],rehwild:["Reh"],schwarzwild:["Wildschwein"],gamswild:["Gämse","Gemse"],steinwild:["Steinbock","Alpensteinbock"],muffelwild:["Mufflon"],sikawild:["Sikahirsch"],saatgans:["Waldsaatgans","Tundrasaatgans"],blessgans:["Blässgans","Blaessgans"],weisswangengans:["Nonnengans"],blaesshuhn:["Bläßhuhn","Blesshuhn"],mink:["Amerikanischer Nerz","Neovison vison"],iltis:["Waldiltis","Europäischer Iltis"]};
export const dachWildlife = [...legacy,...additionalMammals,...expandedBirds,...specialBirds,...legalComparisonForms].map(record => ({...record,aliases:aliasesBySlug[record.slug] || [],legal:legalFor(record.slug)}));
export const dachWildlifeBySlug = Object.fromEntries(dachWildlife.map(record => [record.slug,record]));
export const dachWildlifeGroups = [...new Set(dachWildlife.map(record => record.group))];
export function normalizeWildlifeSearch(value="") { return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/ß/g,"ss").replace(/ae/g,"a").replace(/oe/g,"o").replace(/ue/g,"u").trim(); }
export function filterDachWildlife({query="",group="all",country=null,status="all"}={}) {
  const terms=normalizeWildlifeSearch(query).split(/\s+/).filter(Boolean);
  return dachWildlife.filter(record => (group === "all" || record.group === group) && (!country || status === "all" || record.legal[country]?.status === status) && terms.every(term => normalizeWildlifeSearch([record.name,record.slug,record.scientificName,record.group,record.identification,record.habitat,...record.aliases].join(" ")).includes(term)));
}
