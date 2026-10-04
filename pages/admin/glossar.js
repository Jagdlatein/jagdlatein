import { useState } from "react";
import Link from "next/link";
import { TERMS } from "../../data/glossary-terms";
import { getPaidPageProps } from "../../lib/account-access";

export default function GlossarAdmin() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase("de");
  const terms = TERMS.filter(term => (term.term + " " + term.def).toLocaleLowerCase("de").includes(needle));
  return (
    <main style={{maxWidth: 980, margin: "24px auto", padding: "0 16px"}}>
      <h1>Glossar – Übersicht</h1>
      <p>Hier siehst du die aktuell veröffentlichten Begriffe. Änderungen und Dateiimporte sind in dieser Version noch nicht verfügbar.</p>
      <p><Link href="/glossar">Zum Lern-Glossar</Link> · <Link href="/admin/glossar-import">Informationen zum Import</Link></p>
      <label htmlFor="glossary-admin-search">Begriffe durchsuchen</label>
      <input id="glossary-admin-search" value={query} onChange={event => setQuery(event.target.value)} style={{display:"block", width:"100%", boxSizing:"border-box", padding:12, margin:"8px 0"}} />
      <p>{terms.length} Begriffe</p>
      <dl>
        {terms.map(term => <div key={term.slug} style={{marginBottom:20}}>
          <dt><Link href={"/glossar/" + encodeURIComponent(term.slug)}>{term.term}</Link></dt>
          <dd style={{marginLeft:0}}>{term.def}</dd>
        </div>)}
      </dl>
    </main>
  );
}

export async function getServerSideProps(context) {
  return getPaidPageProps(context, { adminOnly: true });
}
