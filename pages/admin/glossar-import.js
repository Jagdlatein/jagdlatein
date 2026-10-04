import Link from "next/link";
import { getPaidPageProps } from "../../lib/account-access";

export default function GlossarImport() {
  return (
    <main style={{maxWidth:720, margin:"24px auto", padding:"0 16px"}}>
      <h1>Glossar-Import</h1>
      <p>Der Import von Glossarbegriffen ist in dieser Version noch nicht verfügbar. Es können hier keine Dateien hochgeladen oder veröffentlichte Begriffe geändert werden.</p>
      <p><Link href="/admin/glossar">Aktuelle Begriffe ansehen</Link> · <Link href="/glossar">Zum Lern-Glossar</Link></p>
    </main>
  );
}

export async function getServerSideProps(context) {
  return getPaidPageProps(context, { adminOnly: true });
}
