import { useRouter } from "next/router";
import Seo from "../../components/Seo";

// 👉 WICHTIG: Das TERMS-Array hier muss identisch sein wie in index.js
const TERMS = [
  { slug: "ansitz", term: "Ansitz", def: "Stationäre Jagdart vom Hochsitz/Ansitz aus." },
  { slug: "anschuss", term: "Anschuss", def: "Ort, an dem das Wild beschossen wurde." },
  { slug: "absehen", term: "Absehen", def: "Fadenkreuz oder Markierung im Zielfernrohr." },
  { slug: "alttier", term: "Alttier", def: "Weibliches Rotwild ab dem dritten Lebensjahr." },
  { slug: "apportieren", term: "Apportieren", def: "Bringen des erlegten Wildes durch den Hund." },
  // ... ALLE weiteren Begriffe wie in index.js (bitte kopieren!)
];

export default function GlossarSlugPage() {
  const router = useRouter();
  const { slug } = router.query;

  const entry = TERMS.find((t) => t.slug === slug);

  if (!entry) {
    return (
      <main className="py-20 text-center bg-[#faf8f1] min-h-screen">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">Begriff nicht gefunden</h1>
        <p className="mt-4 text-green-800">
          <a href="/glossar" className="underline">
            Zurück zum Glossar
          </a>
        </p>
      </main>
    );
  }

  return (
    <>
      <Seo
        title={`${entry.term} – Jagd-Glossar`}
        description={`Glossarbegriff: ${entry.term} – kompakt erklärt auf Jagdlatein.de`}
      />

      <main className="py-14 px-4 bg-[#faf8f1] min-h-screen flex justify-center">
        <div className="w-full max-w-2xl bg-white border border-gray-200 shadow-sm rounded-2xl p-8">

          {/* Titel */}
          <h1 className="text-4xl font-extrabold mb-6 text-[#1a1a1a]">
            {entry.term}
          </h1>

          {/* Definition */}
          <p className="text-lg leading-relaxed text-gray-800 mb-10">
            {entry.def}
          </p>

          {/* Zurück Link */}
          <a
            href="/glossar"
            className="text-green-800 hover:underline text-sm"
          >
            ← Zurück zum Glossar
          </a>

        </div>
      </main>
    </>
  );
}
