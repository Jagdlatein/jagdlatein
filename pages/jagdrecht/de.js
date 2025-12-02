import { useState } from "react";

export default function JagdrechtDELexikon() {
  const [search, setSearch] = useState("");

  const terms = [
    { term: "Abschussplan", def: "Jährlicher behördlich genehmigter Plan zur Regulierung des Wildbestandes gemäß §21 BJagdG und Landesrecht." },
    { term: "Abschussliste", def: "Dokumentation der tatsächlich erlegten Stücke für Kontrolle des Abschussplans." },
    { term: "Abschussfreigabe", def: "Behördliche oder jagdleiterseitige Freigabe eines Stücks oder einer Klasse." },
    { term: "Allgemeine Schonzeit", def: "Zeit, in der Wildarten grundsätzlich nicht bejagt werden dürfen (§22 BJagdG)." },
    { term: "Anfang und Ende der Jagdzeit", def: "Je nach Wildart gesetzlich festgelegt durch Länder (§22 BJagdG)." },
    { term: "Ankirrung", def: "Das Ausbringen von Futter zur Bejagung – streng reglementiert nach Landesjagdgesetz." },
    { term: "Ansprechen des Wildes", def: "Rechtlich verpflichtende Identifikation von Art, Geschlecht, Alter und Zustand vor Schussabgabe." },
    { term: "Ansteller", def: "Person mit Jagdleitungsvollmacht, verantwortlich für Sicherheit und Zuweisung von Ständen." },
    { term: "Anstellungsbefehl", def: "Rechtlicher Auftrag der Jagdleitung an Schützen/Treiber für eine Gesellschaftsjagd." },
    { term: "Anweiser", def: "Person, die Treiber bei Gesellschaftsjagden führt und Sicherheitsabstände überwacht." },
    { term: "Aufbrechpflicht", def: "Verpflichtung zum unverzüglichen Aufbrechen von Wild nach tierschutzrechtlichen Vorgaben." },
    { term: "Auslandsjagdrecht", def: "Regeln über Waffenmitnahme, Jagdlizenzen und Wildursprungsscheine im Ausland." },
    { term: "Befriedeter Bezirk", def: "Grundstücke, auf denen die Jagd ruht (§6 BJagdG), z. B. Wohngebiete." },
    { term: "Begehungsschein", def: "Schriftlicher Jagderlaubnisschein eines Jagdausübungsberechtigten." },
    { term: "Begehungsschneise", def: "Schneise für Kontrolle oder Bejagung – bauliche Veränderungen oft genehmigungspflichtig." },
    { term: "Beizjagd", def: "Jagd mit Greifvögeln; gesonderte Erlaubnisse erforderlich (§15 BJagdG)." },
    { term: "Berufsjäger", def: "Ausgebildeter Jäger im Dienst eines Revierinhabers; besondere Rechtsbefugnisse." },
    { term: "Beschussrecht", def: "Waffen dürfen nur mit gültigem Beschusszeichen geführt werden (Beschussgesetz)." },
    { term: "Betretungsrecht", def: "Öffentliches Recht auf Betreten des Waldes – Ausnahmen für jagdliche Tätigkeiten." },
    { term: "Betriebsjagd", def: "Jagd in Firmen- oder Industriewäldern – Sonderregelungen durch Landesrecht." },
    { term: "Beunruhigungsverbot", def: "Wild darf nicht unnötig gestört werden (§19 BJagdG)." },
    { term: "Bewegungsjagd", def: "Jagdart mit besonderen Sicherheitsvorschriften und Schusswinkeln." },
    { term: "Bockabschuss", def: "Regelungen zu Klassen, Altersstufen und Hegezielen." },
    { term: "Bockjagdrecht", def: "Landesrechtliche Vorgaben zur Rehbockbejagung." },
    { term: "Dienstwaffe", def: "Nur bei Berufsjägern relevant; unterliegt besonderen Vorgaben." },
    { term: "Durchgeh Lines", def: "Bewegungsabhängige Sicherheitsgrenze bei Drückjagden." },
    { term: "Einrichtungsrecht", def: "Recht, jagdliche Einrichtungen im Revier aufzustellen; genehmigungspflichtig." },
    { term: "Einwechseln", def: "Wild bewegt sich in ein anderes Revier – rechtlich relevant für Abschuss." },
    { term: "Entnahmerecht", def: "Recht zur Entnahme (Erschießen/Tötung) bestimmter Tierarten im Seuchenfall." },
    { term: "Erleger", def: "Schütze, dem der Abschuss rechtlich zugerechnet wird." },
    { term: "Erlegerpflichten", def: "Weidgerechter Umgang mit Wild, Nachsuchepflicht, Beachtung Schonzeiten." },
    { term: "Fallenjagd", def: "Nur mit behördlicher Fangkursbescheinigung erlaubt; Lebendfallen Pflicht bei Raubwild." },
    { term: "Fangjagdrecht", def: "Spezielles Teilgebiet des Jagdrechts mit Tierschutzauflagen." },
    { term: "Fehlabschuss", def: "Rechtswidriger oder fehlerhafter Abschuss eines nicht freigegebenen Stücks." },
    { term: "Friedhof als befriedeter Bezirk", def: "Darf nicht bejagt werden; Ausnahmen nur mit Behörden." },
    { term: "Friedwild", def: "Wild, das sich in befriedeten Bezirken aufhält – nicht frei bejagbar." },
    { term: "Fuchsbejagung", def: "Besondere Landesregelungen (Bau- und Fallenjagd)." },
    { term: "Fütterungsverbot", def: "Bundes- oder landesrechtlich streng geregelt, v. a. bei Schalenwild." },
    { term: "Gemeinschaftsjagdbezirk", def: "Zusammenschluss mehrerer Grundstückseigentümer zur Jagdausübung." },
    { term: "Genossenschaftsjagd", def: "Jagd in gemeinschaftlichen Jagdbezirken, verpachtet durch Jagdgenossenschaft." },
    { term: "Gehegejagd", def: "In Deutschland stark reguliert; Mindestgrößen und Kontrollen." },
    { term: "Geländehaftung", def: "Haftung für Schäden im Revier z. B. bei Jagden." },
    { term: "Gesellschaftsjagd", def: "Organisierte Jagdform mit besonderen Sicherheitsvorschriften." },
    { term: "Haftung bei Jagdunfällen", def: "Komplexes Zusammenspiel aus Jagdleitung, Erleger, Grundstückshaftung." },
    { term: "Hegerecht", def: "Pflicht zur Pflege und zum Schutz des Wilds (§1 BJagdG)." },
    { term: "Hegeabschuss", def: "Abschuss zur Verbesserung des Wildbestandes." },
    { term: "Hundeordnung", def: "Bei Gesellschaftsjagden vorgeschrieben (brauchbare Hunde!)." },
    { term: "Jagdabgabe", def: "Gebühr zur Förderung des Naturschutzes beim Lösen des Jagdscheins." },
    { term: "Jagdaufsicht", def: "Beauftragte Person, die Einhaltung des Jagdrechts kontrolliert." },
    { term: "Jagdbehörde", def: "Untere oder obere Jagdbehörde; zuständig für Genehmigungen." },
    { term: "Jagderlaubnisschein", def: "Rechtliche Erlaubnis zum Jagen in einem fremden Revier." },
    { term: "Jagdgenossenschaft", def: "Eigentümergemeinschaft landwirtschaftlicher Flächen." },
    { term: "Jagdhausfriedensbruch", def: "Straftat gegen jagdliche Einrichtungen." },
    { term: "Jagdhaftpflicht", def: "Pflichtversicherung für jeden Jäger (§15 BJagdG)." },
    { term: "Jagdhoheit", def: "Hoheit des Staates über das Wild, nicht des Grundbesitzers." },
    { term: "Jagdleitung", def: "Verantwortlich für Sicherheit und Organisation einer Jagd." },
    { term: "Jagdruhe", def: "Zeiträume, in denen bestimmte Wildarten nicht bejagt werden." },
    { term: "Jagdschutz", def: "Weidgerechter Schutz des Wildes vor Wilderern, Hunden und Katzen." },
    { term: "Jagdschaden", def: "Durch Wild verursachte Schäden – Reglung durch Jagdrecht." },
    { term: "Jagdschein", def: "Erlaubnis zum Führen von Waffen und zur Jagdausübung (§15 BJagdG)." },
    { term: "Jagdsteuer", def: "Kommunale Abgabe auf die Jagdausübung (in manchen Bundesländern abgeschafft)." },
    { term: "Jagdzeiten", def: "Bejagbare Zeiten für jede Wildart nach Landesrecht." },
    { term: "Kirrung", def: "Stellen von Futter zur Schwarzwildbejagung – streng reguliert!" },
    { term: "Kunstbaujagd", def: "Baujagd an künstlich angelegten Bauanlagen – streng gesetzlich." },
    { term: "Landesjagdgesetz", def: "Regelt Details der Jagd in jedem Bundesland." },
    { term: "Leitfaden Drückjagd", def: "Amtliche Vorgaben für Sicherheit & Planung." },
    { term: "Leitfäden Hege", def: "Rechtliche Anforderungen an Hegegemeinschaften." },
    { term: "Leitlinie Tierschutz bei der Jagd", def: "Amtliche Vorgaben zum weidgerechten Verhalten." },
    { term: "Nachsuchepflicht", def: "Nachsuche ist gesetzlich vorgeschrieben (§22a BJagdG)." },
    { term: "Notstand", def: "Ausnahme bei Gefahr für Menschen; kein Freibrief für Regelverstöße." },
    { term: "Patentjagd", def: "In Deutschland unbekannt, relevant in CH/AT (Abgrenzung wichtig!)." },
    { term: "Pachtvertrag", def: "Regelt Rechte & Pflichten des Jagdausübungsberechtigten." },
    { term: "Rechtsweg", def: "Verfahren bei Streitigkeiten zwischen Jagdgenossenschaft und Pächtern." },
    { term: "Rehwildabschussrichtlinie", def: "Alters- und Geschlechterrichtlinien für nachhaltige Bejagung." },
    { term: "Schadholzregelung", def: "Rechtliche Freigaben zur Reduktion bei Kalamitäten." },
    { term: "Schießnachweis", def: "In vielen Ländern Pflicht vor Bewegungsjagden." },
    { term: "Schonzeit", def: "Wild ist nicht bejagbar – endet niemals durch private Freigabe." },
    { term: "Sicherheitsfaden", def: "Unsichtbare Sicherheitslinie für Drückjagden." },
    { term: "Sicherheitsfänge", def: "Fallen mit tierschutzkonformen Mechanismen." },
    { term: "Treibjagd", def: "Jagdform mit engen gesetzlichen Vorgaben." },
    { term: "Trophäeigentum", def: "Erwerb der Trophäe gemäß Vertrag/Erlegerrecht." },
    { term: "Überläufer", def: "Besondere Abschussregelungen je nach Land/Hegeplan." },
    { term: "Wildfolge", def: "Wild darf bei Verletzung über Grenzen verfolgt werden – nur mit Zustimmung!" },
    { term: "Wildschadensersatz", def: "Regelt Ersatzpflichten zwischen Eigentümern und Pächtern." },
    { term: "Wildseuchenrecht", def: "Rechtliche Grundlage für ASP-Bekämpfung." },
    { term: "Wildtiermanagement", def: "Umfassende rechtliche Planung des Wildbestands." },
    { term: "Waffenrecht", def: "WaffG – Erwerb, Besitz, Transport & Führen von Jagdwaffen." },
    { term: "Waffenaufbewahrung", def: "Strikte Regeln für Tresore der Sicherheitsstufen." },
    { term: "Waffenverbot", def: "Polizeiliche Anordnung möglich bei Zuverlässigkeitszweifeln." },
    { term: "Weidgerechtigkeit", def: "Gesamtheit der ethischen und rechtlichen Vorgaben." },
    { term: "Wildererverdacht", def: "Sonderrechte der Jagdschutzberechtigten." },
    { term: "Zuverlässigkeit", def: "Kernvoraussetzung für Jagdschein – geregelt im WaffG." },
  ];

  const filtered = terms.filter(t =>
    t.term.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 36, marginBottom: 10 }}>🇩🇪 Jagdrecht-Lexikon Deutschland</h1>
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

