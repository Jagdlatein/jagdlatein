import { useState } from "react";

export default function JagdrechtCH() {
  const begriffe = [
    { term: "Abschussplan (CH)", def: "Kantonale Vorgabe zur Anzahl zulässiger Abschüsse pro Wildart. Wird jährlich festgelegt." },
    { term: "Abschusskontingent", def: "Mengenbeschränkung für die Jagd auf bestimmte Wildarten, kantonal geregelt." },
    { term: "Abschussmeldung", def: "Pflicht zur Meldung aller erlegten Tiere an die kantonale Jagdverwaltung." },
    { term: "Abschussprüfung", def: "Kontrolle der erlegten Wildtiere durch kantonale Behörden, z.B. auf Krankheit oder Fehlabschüsse." },
    { term: "Anschusszeichen (CH)", def: "Spuren am Ort des Schusses wie Schnitthaar, Knochensplitter, Pirschzeichen." },
    { term: "Ausbildungspflicht Jäger", def: "In der Schweiz ist eine staatlich anerkannte Jägerprüfung obligatorisch." },
    { term: "Banngebiete", def: "Tiere in Schutzgebieten (Wildruhezonen) dürfen nicht bejagt oder gestört werden." },
    { term: "Betretungsrecht", def: "Öffentlichkeit darf Wald und Wiesen betreten, sofern keine Schutzverordnung entgegensteht." },
    { term: "Bockjagd (CH)", def: "Jagd auf Rehböcke gemäss kantonalem Abschussplan und Jagdzeiten." },
    { term: "Bundesgesetz über die Jagd (JSG)", def: "Hauptgesetz des Bundes zur Regulierung Jagd, Schutz und Nutzung der Wildtiere." },
    { term: "Bundesverordnung über die Jagd (JSV)", def: "Ausführungsverordnung zum Jagdgesetz mit detaillierten Bestimmungen." },
    { term: "Einflussjagd", def: "Jagd zur Regulierung von Wildbeständen bei übermässigem Verbiss." },
    { term: "Einjährige Jagdprüfung (CH)", def: "Die meisten Kantone haben ein mehrstufiges Prüfungssystem inklusive Schiessnachweis." },
    { term: "Erlegerrecht", def: "Der Schütze erhält das erlegte Stück; Ausnahmen bei Jagdgesellschaften möglich." },
    { term: "Fangjagd Schweiz", def: "Nur in wenigen Kantonen erlaubt und streng reguliert. Fallen müssen bewilligt werden." },
    { term: "Fehlabschuss", def: "Erlegung eines nicht freigegebenen Stücks; strafrechtliche Konsequenzen." },
    { term: "Feuerwaffenrecht (CH)", def: "Waffenbesitz und Erwerb durch das Waffengesetz geregelt (WG, WV)." },
    { term: "Freijagd-Kantone", def: "CH-Kantone mit individueller Pirschjagd (z.B. Graubünden, Wallis, Tessin)." },
    { term: "Gesellschaftsjagd-Kantone", def: "Jagd erfolgt in Revierstrukturen (z.B. Bern, Luzern, Aargau)." },
    { term: "Hegepflicht", def: "Jäger sind verpflichtet, Wildbestände zu pflegen, Lebensräume zu verbessern und Wildschutz zu gewährleisten." },
    { term: "Hochwildjagd CH", def: "Jagd auf Hirsch, Gämse, Steinbock – kantonal unterschiedlich geregelt." },
    { term: "Hundeführung Jagd", def: "Jeder Kanton hat spezifische Vorschriften zu Jagdhunden und Prüfungen." },
    { term: "Jagdaufsicht (CH)", def: "Kantonale Wildhüter und Jagdaufseher überwachen die Jagd." },
    { term: "Jagdgebiete", def: "Kantonale Einteilung der Jagdbezirke; können kantonal stark variieren." },
    { term: "Jagdgesetz (JSG)", def: "Zentrale Rechtsgrundlage für die gesamte Schweiz." },
    { term: "Jagdgesellschaft", def: "Revierjagdsystem in Kantonen wie Bern, Zürich, Aargau, Solothurn." },
    { term: "Jagdprüfung Schweiz", def: "Theorie, Praxis, Schiessprüfung, Reviergang und Naturschutzmodule." },
    { term: "Jagdzeiten (CH)", def: "Je Kanton festgelegt; z.B. Bockjagd Aug–Sep, Hirschjagd Sep–Okt." },
    { term: "Lebensraumvernetzung", def: "Wildwechsel und Korridore müssen geschützt werden." },
    { term: "Notstandsjagd", def: "Ausnahmsweise erlaubt bei erheblichen Wildschäden oder Gefahrenlagen." },
    { term: "Pachtjagd CH", def: "Nur wenige Kantone mit Pachtsystem; Mehrheit hat Patentjagd." },
    { term: "Patentjagd", def: "Jahrespatent berechtigt zur Jagdausübung im ganzen Kanton." },
    { term: "Pirschjagd (CH)", def: "Freie Einzeljagd in Bergkantonen." },
    { term: "Ruhegebiete", def: "Wildruhezonen, in denen striktes Betretungsverbot gilt." },
    { term: "Schonzeiten CH", def: "Wildarten haben kantonal unterschiedliche Schonzeiten." },
    { term: "Sicherheitsvorschriften CH", def: "Schussfeld, Hintergrund, Besiedelung und Wildhüterauflagen beachten." },
    { term: "Sonderjagden", def: "Kantonale Eingriffe zur Bestandsregulierung (z.B. Steinwild, Hirsch, Wolf)." },
    { term: "Steinwildbewilligung", def: "Seltene Jagdbewilligung für Steinbock; stark kontingentiert." },
    { term: "Treibjagd (CH)", def: "Nur in Revierkantonen verbreitet; streng reguliert." },
    { term: "Wildhüter", def: "Behördliche Aufsichtsperson, zuständig für Schutz, Regulation und Kontrolle." },
    { term: "Wildruhezonen", def: "Besonders empfindliche Gebiete, oft winterliche Sperrzonen." },
    { term: "Wildschaden CH", def: "Schadenersatzpflicht je nach Kanton unterschiedlich geregelt." },
    { term: "Wolfmanagement", def: "Kantonale Abschussregelungen gemäss Bundesrahmen." },
    { term: "Zuständigkeit Kantone", def: "Jagd ist primär kantonal geregelt; Bundesrecht gibt den Rahmen vor." },
  ];

  const [search, setSearch] = useState("");

  const filtered = begriffe.filter((b) =>
    b.term.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1 style={{ fontSize: 32, marginBottom: 20 }}>🇨🇭 Jagdrecht Schweiz – Lexikon</h1>

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
          fontSize: 16,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map((b, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              padding: 16,
              borderRadius: 12,
              borderLeft: "6px solid #caa53b",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <strong style={{ fontSize: 18 }}>{b.term}</strong>
            <p style={{ marginTop: 6, color: "#333" }}>{b.def}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
