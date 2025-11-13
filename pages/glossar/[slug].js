import Seo from '../../components/Seo';

const TERMS = {
  ansitz: {
    title:'Ansitz',
    body:'Stationäre Jagdart vom festen Stand (z. B. Hochsitz). Fördert Ruhe und sichere Schussabgabe.'
  },
  bergstock: {
    title:'Bergstock',
    body:'Stab/Stock als Gehhilfe im alpinen Gelände; unterstützt Stand und Sicherheit.'
  },
  bruch: {
    title:'Bruch',
    body:'Traditionelles Jagdzeichen aus Zweigen, z. B. Anschussbruch, Inbesitznahmebruch.',
  },
wechsel: {
  title: "Wechsel",
  body: "Regelmäßig genutzter Weg des Wildes, der oft zu Pirsch oder Ansitz genutzt wird."
},
kirren: {
  title: "Kirren",
  body: "Anlocken des Wildes durch Futter wie Mais, üblicherweise zur Schwarzwildbejagung."
},
verhoffen: {
  title: "Verhoffen",
  body: "Kurzfristiges Stehenbleiben des Wildes, um die Umgebung zu sichern."
},
fuchsfang: {
  title: "Fuchsfang",
  body: "Bejagung des Fuchses durch Fallenjagd, Baujagd oder Ansitz."
},
sichern: {
  title: "Sichern",
  body: "Das Wild prüft seine Umgebung durch Hören, Riechen und Sehen."
},
zeichnen: {
  title: "Zeichnen",
  body: "Körperliche Reaktion des Wildes beim Treffer, z. B. Zusammensacken oder Ausschlagen."
},
verblasen: {
  title: "Verblasen",
  body: "Jagdlicher Brauch, bei dem Stücke mit dem Jagdhorn verblasen werden."
},
verhitzen: {
  title: "Verhitzen",
  body: "Wild wird durch Lärm oder Störungen unruhig."
},
blasen: {
  title: "Blasen",
  body: "Lockruf oder Lautäußerung, häufig bei Rehwild in der Blattzeit."
},
plätzen: {
  title: "Plätzen",
  body: "Äsung des Rehwildes, oft im morgendlichen oder abendlichen Rhythmus."
},
brechen: {
  title: "Brechen",
  body: "Nahrungsaufnahme des Schwarzwildes, häufig laut und gründelnd."
},
fegen: {
  title: "Fegen",
  body: "Das Abreiben des Bastes vom Gehörn oder Geweih an Bäumen und Sträuchern."
},
rickenruf: {
  title: "Rickenruf",
  body: "Kontaktlaut der Ricke, besonders wichtig in der Setzzeit."
},
anschuss: {
  title: "Anschuss",
  body: "Die Stelle, an der das Wild beim Schuss stand; wichtiger Startpunkt für Nachsuchen."
},
ausschuss: {
  title: "Ausschuss",
  body: "Austrittsöffnung des Geschosses, wichtig für Schweißmenge und Nachsuche."
},
feisthirsch: {
  title: "Feisthirsch",
  body: "Besonders gut genährter Hirsch vor der Brunft, oft schwer und stark."
},
schmalspieser: {
  title: "Schmalspießer",
  body: "Einjähriger Hirsch mit schlanken, unverzweigten Stangen."
},
kahlwild: {
  title: "Kahlwild",
  body: "Weibliches Rotwild und dessen einjährige Nachkommen."
},
alttier: {
  title: "Alttier",
  body: "Erwachsenes weibliches Rotwild, meist Leittier der Rudel."
},
spieser: {
  title: "Spießer",
  body: "Junger Hirsch mit zwei unverzweigten Stangen."
},
schmelzer: {
  title: "Schmelzer",
  body: "Einjähriges Rotwild, das körperlich und geistig heranwächst."
},
plaetzruhe: {
  title: "Plätzruhe",
  body: "Ruhephase des Rotwildes, häufig im Tagesversteck."
},
brunftschrei: {
  title: "Brunftschrei",
  body: "Laut des Hirsches während der Brunft, dient Revierabgrenzung und Rivalenausruf."
},


};

export default function GlossarDetail({ title, body }){
  return (
    <>
      <Seo title={`${title} – Glossar`} description={body.slice(0,120)} />
      <section className="section">
        <div className="container" style={{maxWidth:820}}>
          <a className="btn" href="/glossar">← Zurück zum Glossar</a>
          <h1 style={{marginTop:12}}>{title}</h1>
          <p>{body}</p>
        </div>
      </section>
    </>
  );
}

export async function getServerSideProps(ctx){
  const { slug } = ctx.params || {};
  const hit = TERMS[slug];
  if (!hit) return { notFound: true };
  return { props: hit };
}

