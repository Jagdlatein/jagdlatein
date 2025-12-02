import { useState } from "react";

export default function JagdrechtATLexikon() {
  const [search, setSearch] = useState("");

  const terms = [
    { term: "Abschussplan", def: "Von der Behörde approbierter Jagdplan für Schalenwild. Landesrecht entscheidet über Kontingente und Altersklassen." },
    { term: "Abschussliste", def: "Dokumentation der jährlich erlegten Stücke als Soll-Ist-Vergleich zum Abschussplan." },
    { term: "Abschussrichtlinie (Bund/Land)", def: "Richtwerte zur nachhaltigen Bestandsregulierung; variiert nach Bundesland." },
    { term: "Abwurfhölzer", def: "Geweihstangen, deren Sammlung teils meldepflichtig ist (z. B. Salzburg, Tirol)." },
    { term: "Allgemeine Schonzeit", def: "Zeit, in der Wild nicht bejagt werden darf; in AT stark kantonal/regional geregelt." },
    { term: "Ausschussgebiet", def: "Gebiet, in dem Jagd aus Sicherheitsgründen eingeschränkt oder verboten ist (z. B. Siedlungsraum)." },
    { term: "Baujagd", def: "Jagd mit Hunden am Natur- oder Kunstbau; gesetzlich nur mit geprüften Jagdhunden erlaubt." },
    { term: "Begehungsschein", def: "Schriftliche Jagderlaubnis für ein Revier, erteilt vom Jagdausübungsberechtigten." },
    { term: "Begehungsscheininhaber", def: "Person mit eingeschränkten Jagdrechten im Revier." },
    { term: "Beizjagd", def: "Jagd mit Greifvögeln; erfordert Falknerschein und spezielle Bewilligungen." },
    { term: "Bergjagdrecht", def: "Spezielle Regelungen für Hochgebirgsjagden (z. B. Steinwild, Gams)." },
    { term: "Bewilligungspflichtige Jagdart", def: "Bestimmte Jagden wie Kirrjagd, Nachtjagd, Fallenjagd sind behördlich bewilligungspflichtig." },
    { term: "Bezirksverwaltungsbehörde (BVB)", def: "Zuständig für jagdrechtliche Vollziehung (BH, Magistrat)." },
    { term: "Brauchtumspflege", def: "Jagdkulturelle Handlungen wie letzter Bissen, Schützenbruch, Weidmannsheil." },
    { term: "Brauchbarkeitsprüfung", def: "Gesetzlich vorgeschriebene Prüfung für Jagdhunde für bestimmte Jagdarten." },
    { term: "Dammerlaubnis", def: "Besondere Bewilligung für Dämmerungs- oder Nachtjagd." },
    { term: "Drückjagd", def: "Jagd mit Schützen- und Treibergruppen; strenge Sicherheitsvorschriften." },
    { term: "Einstandsgebiet", def: "Hauptlebensraum des Wildes; beeinflusst jagdliche Bewirtschaftung." },
    { term: "Einwilligung des Grundeigentümers", def: "Erforderlich für bestimmte Maßnahmen wie Bau von Hochständen." },
    { term: "Erlegerrecht", def: "Zuweisung des Stücks an den Schützen; hat Bedeutung für Trophäe und Meldung." },
    { term: "Fangjagd", def: "Nur mit behördlichem Fangjagd-Kurs; Lebendfallen Pflicht bei Raubwild." },
    { term: "Fangjagdgesetz", def: "Regelt Fanggeräte, Kontroll- und Sicherheitsvorschriften." },
    { term: "Fangjagdprüfung", def: "Notwendig für tierschutzkonforme Ausübung der Fangjagd." },
    { term: "Freiwildliste", def: "Wildarten, die ganzjährig bejagt werden dürfen (abhängig vom Bundesland)." },
    { term: "Friedwild", def: "Wild innerhalb befriedeter Bezirke — darf nicht regulär bejagt werden." },
    { term: "Fütterungsbewilligung", def: "In vielen Bundesländern notwendig; betrifft Schalenwild." },
    { term: "Fütterungsgebot", def: "In einigen Regionen Pflicht bei extremer Witterung." },
    { term: "Fütterungsverbot", def: "Teilweise in Kärnten, Tirol oder Niederösterreich für bestimmte Wildarten." },
    { term: "Gemeinschaftsjagdgebiet", def: "Zusammenschluss mehrerer Grundeigentümer zur gemeinsamen Jagdausübung." },
    { term: "Genossenschaftsjagd", def: "Von der Jagdgenossenschaft verpachtetes Jagdgebiet." },
    { term: "Geringfügiges Wild", def: "Wildarten mit reduzierten gesetzlichen Anforderungen (z. B. Rabbits, Rabenkrähen je nach Land)." },
    { term: "Greifvögelrecht", def: "Schutzstatus, Besitz und Pflege streng durch Bundesrecht geregelt." },
    { term: "Hegeschau", def: "Verpflichtende Präsentation der Abschüsse zur behördlichen Kontrolle." },
    { term: "Hegemaßnahmen", def: "Wildschutz, Lebensraumverbesserung, Wildschadensvorbeugung." },
    { term: "Hegering", def: "Untergliederung der Jägerschaft; organisiert Prüfungen und Schulungen." },
    { term: "Hochgebirgsjagd", def: "Regelungen zu Steinbock, Gams und Rotwild im Hochgebirge." },
    { term: "Hundezwang", def: "In vielen Bundesländern Leinenpflicht außerhalb der Jagd." },
    { term: "Jagdausübungsberechtigter", def: "Person oder Körperschaft mit dem Recht zur Jagdausübung im Revier." },
    { term: "Jagderlaubnisschein", def: "Erlaubnis für Fremdjäger; begrenzt auf bestimmte Wildarten." },
    { term: "Jagdfrevel", def: "Strafbare Handlung wie Wilderei oder Verstoß gegen Schonzeiten." },
    { term: "Jagdgebrauchshund", def: "Hund mit Brauchbarkeitsprüfung für bestimmte Jagdarten." },
    { term: "Jagdgast", def: "Person mit Jagderlaubnis für begrenzten Zeitraum." },
    { term: "Jagdgesetz (Land)", def: "Jedes Bundesland besitzt eigenes Jagdgesetz." },
    { term: "Jagdgebiet", def: "Flächen, die als Eigenjagd oder Genossenschaftsjagd geführt werden." },
    { term: "Jagdkataster", def: "Amtliche Karte der Jagdgebiete." },
    { term: "Jagdkontingent", def: "Behördlich festgelegtes Abschussvolumen." },
    { term: "Jagdkultur", def: "Traditionelle Regeln des jagdlichen Brauchtums." },
    { term: "Jagdpachtvertrag", def: "Schriftlicher Vertrag über Verpachtung – gesetzlich streng geregelt." },
    { term: "Jagdprüfung", def: "Landesrechtlich geregelte Prüfung für Jagdkarte." },
    { term: "Jagdruf", def: "Akustisches Mittel zur Jagdausübung – bei vielen Wildarten reguliert." },
    { term: "Jagdruhe", def: "Zeitliche Einschränkungen der Jagd im Jahreszyklus." },
    { term: "Jagdschutzorgan", def: "Aufsichtsorgan mit umfangreichen Kontrollbefugnissen." },
    { term: "Jagdsperrgebiet", def: "Behördlich ausgewiesene Gebiete, in denen Jagd ruht." },
    { term: "Jagdstatistik", def: "Meldung der Abschüsse an die Behörde." },
    { term: "Jagdversammlung", def: "Sitzung der Jagdausübungsberechtigten im Genossenschaftsjagdgebiet." },
    { term: "Jagdvergehen", def: "Ordnungswidrigkeiten oder Straftaten nach Landesjagdrecht." },
    { term: "Jagdverordnung", def: "Regelt Details der Jagdzeiten und Methoden." },
    { term: "Jagdverwaltungsbehörde", def: "Behördenstruktur auf Landes- und Bezirksebene." },
    { term: "Jagdwaffe", def: "Waffe, die gemäß österreichischem Waffengesetz zulässig ist." },
    { term: "Jagdzwang", def: "Verpflichtung der Hegegemeinschaft, bestimmte Wildbestände zu regulieren." },
    { term: "Kirrjagd", def: "In vielen Bundesländern verboten oder streng limitiert." },
    { term: "Kontrollstreifen", def: "Streifen in Waldgebieten zur Überwachung von Wildschäden." },
    { term: "Landesjagdverband", def: "Organisation, die wesentliche Aufgaben für Jagdwesen übernimmt." },
    { term: "Lebendfang", def: "Erlaubt nur mit behördlicher Bewilligung und geprüften Fallen." },
    { term: "Lichtquelle", def: "Künstliches Licht zur Jagd nur mit Ausnahmebewilligung." },
    { term: "Lockjagd", def: "Teilweise reglementiert, abhängig von Wildart." },
    { term: "Nachtjagd", def: "Nur mit Waffenrechtskarte B + Bewilligung erlaubt." },
    { term: "Nachsuchepflicht", def: "Verpflichtende unverzügliche Nachsuche mit geeignetem Hund." },
    { term: "Notzeit", def: "Spezielle Winterregelungen zu Fütterung und Jagdruhe." },
    { term: "Patentjagd", def: "In AT üblich; Jagd wird als Patent vergeben statt gepachtet." },
    { term: "Pachtjagd", def: "Revierjagd mit Pachtvertrag; Unterschiede je nach Land." },
    { term: "Rehwildabschussrichtlinie", def: "Empfehlungen für nachhaltige Nutzung." },
    { term: "Revierjagd", def: "Jagdform mit genau definierten Grenzen und Rechten." },
    { term: "Revierkarte", def: "Amtliche Karte des Jagdreviers." },
    { term: "Reviereinrichtungen", def: "Bauten wie Hochstände; bewilligungspflichtig." },
    { term: "Revierpächter", def: "Inhaber eines Jagdpachtvertrags." },
    { term: "Sakkadenregelung", def: "Sicherheitslinien bei Bewegungsjagden." },
    { term: "Salzkontrolle", def: "Bewilligungspflicht für Kirr- und Salzlecken." },
    { term: "Schadenersatzpflicht", def: "Regelt Ersatz für Wildschäden." },
    { term: "Schonzeit", def: "Artbezogene Schonzeitregelungen eines Bundeslands." },
    { term: "Seuchenrecht", def: "Behördliche Maßnahmen bei ASP etc." },
    { term: "Sicherheitszone", def: "Gebiete, in denen Schussabgabe verboten ist." },
    { term: "Standplatz", def: "Zuweisung des Jagdstandes durch Jagdleitung." },
    { term: "Tierschutzrecht", def: "Bundesrecht mit Auswirkungen auf Jagd und Fangjagd." },
    { term: "Treibjagd", def: "Regelungen für Treibjagden, Treiberketten, Sicherheitsmaßnahmen." },
    { term: "Überläuferregelung", def: "Regelt die Bejagung junger Wildschweine." },
    { term: "Verwendung von Nachtsichttechnik", def: "Nur mit Bewilligung und für spezielle Wildarten." },
    { term: "Waffenbesitzkarte (WBK)", def: "Erforderlich für Erwerb von Büchsen und Flinten." },
    { term: "Waffenführerschein", def: "Nachweis für Umgang mit Waffen; Voraussetzung für WBK." },
    { term: "Wildabschuss", def: "Erlegung gemäß Abschussplan." },
    { term: "Wildfütterung", def: "Streng reglementiert; Bewilligungspflicht in mehreren Bundesländern." },
    { term: "Wildfolge", def: "Nachsuche über Reviergrenzen nur mit Zustimmung des Besitzers." },
    { term: "Wildschadensrecht", def: "Regelt Ersatzpflicht zwischen Landwirt und Jagdausübungsberechtigtem." },
    { term: "Wildstand", def: "Wildverteilung und Bestand über Jagdgebiet hinweg." },
    { term: "Wildökologische Raumplanung", def: "Planungsinstrument zur Regulierung der Wildbestände." },
    { term: "Zwangsbejagung", def: "Rechtliche Verpflichtung zur Bejagung bestimmter Wildarten in Problemgebieten." },
  ];

  const filtered = terms.filter(t =>
    t.term.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 36, marginBottom: 10 }}>🇦🇹 Jagdrecht-Lexikon Österreich</h1>
      <input
        type="text"
        placeholder="Begriff suchen…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          border: "1px solid #ccc",
          marginBottom: 20,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((t, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              padding: 16,
              borderRadius: 10,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ margin: 0 }}>{t.term}</h3>
            <p style={{ margin: "6px 0 0 0", color: "#555" }}>{t.def}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
