// pages/wildkunde/index.js

export default function WildkundeIndex() {
  const kategorien = [
    {
      title: "Schalenwild",
      items: [
        { name: "Rotwild", slug: "rotwild" },
        { name: "Damwild", slug: "damwild" },
        { name: "Rehwild", slug: "rehwild" },
        { name: "Schwarzwild", slug: "schwarzwild" },
        { name: "Muffelwild", slug: "muffelwild" },
        { name: "Gamswild", slug: "gamswild" },
        { name: "Steinwild", slug: "steinwild" },
        { name: "Sikawild", slug: "sikawild" },
      ],
    },
    {
      title: "Raubwild",
      items: [
        { name: "Fuchs", slug: "fuchs" },
        { name: "Dachs", slug: "dachs" },
        { name: "Marderhund", slug: "marderhund" },
        { name: "Waschbär", slug: "waschbaer" },
        { name: "Steinmarder", slug: "steinmarder" },
        { name: "Baummarder", slug: "baummarder" },
        { name: "Iltis", slug: "iltis" },
        { name: "Hermelin", slug: "hermelin" },
        { name: "Mauswiesel", slug: "mauswiesel" },
        { name: "Wildkatze", slug: "wildkatze" },
        { name: "Luchs", slug: "luchs" },
      ],
    },
    {
      title: "Niederwild (Hase, Kaninchen, Nagetiere)",
      items: [
        { name: "Feldhase", slug: "feldhase" },
        { name: "Schneehase", slug: "schneehase" },
        { name: "Wildkaninchen", slug: "wildkaninchen" },
        { name: "Nutria", slug: "nutria" },
        { name: "Bisam", slug: "bisam" },
        { name: "Biber", slug: "biber" },
        { name: "Eichhörnchen", slug: "eichhoernchen" },
      ],
    },
    {
      title: "Federwild – Hühner- & Raufußhühner",
      items: [
        { name: "Fasan", slug: "fasan" },
        { name: "Rebhuhn", slug: "rebhuhn" },
        { name: "Birkhuhn", slug: "birkhuhn" },
        { name: "Auerhuhn", slug: "auerhuhn" },
        { name: "Schneehuhn (Federwild)", slug: "schneehuuhn-federwild" },
      ],
    },
    {
      title: "Federwild – Enten",
      items: [
        { name: "Stockente", slug: "stockente" },
        { name: "Krickente", slug: "krickente" },
        { name: "Spießente", slug: "spiessente" },
        { name: "Pfeifente", slug: "pfeifente" },
        { name: "Schnatterente", slug: "schnatterente" },
        { name: "Tafelente", slug: "tafelente" },
        { name: "Reiherente", slug: "reiherente" },
      ],
    },
    {
      title: "Federwild – Gänse",
      items: [
        { name: "Graugans", slug: "graugans" },
        { name: "Kanadagans", slug: "kanadagans" },
        { name: "Nilgans", slug: "nilgans" },
      ],
    },
    {
      title: "Federwild – Krähen & Tauben",
      items: [
        { name: "Rabenkrähe", slug: "rabenkraehe" },
        { name: "Nebelkrähe", slug: "nebelkraehe" },
        { name: "Elster", slug: "elster" },
        { name: "Eichelhäher", slug: "eichelhaeher" },
        { name: "Ringeltaube", slug: "ringeltaube" },
        { name: "Türkentaube", slug: "tuerkentaube" },
        { name: "Hohltaube", slug: "hohltaube" },
      ],
    },
    {
      title: "Federwild – Sonstige",
      items: [
        { name: "Waldschnepfe", slug: "waldschnepfe" },
        { name: "Blässhuhn", slug: "blaesshuhn" },
        { name: "Haubentaucher", slug: "haubentaucher" },
      ],
    },
  ];

  return (
    <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Wildkunde – Alle jagdbaren Wildarten</h1>
      <p>
        Hier findest du alle jagdbaren Wildarten aus Deutschland, Österreich und
        der Schweiz – sortiert nach Wildkategorie.
      </p>

      {kategorien.map((kat) => (
        <section key={kat.title} style={{ marginBottom: "2rem" }}>
          <h2>{kat.title}</h2>
          <ul>
            {kat.items.map((art) => (
              <li key={art.slug}>
                <a href={`/wildkunde/${art.slug}`}>{art.name}</a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
