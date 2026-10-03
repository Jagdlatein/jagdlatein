import Link from "next/link";

export default function ActivityResultNotice({ saving, saved, error, retry, nextUrl }) {
  if (!saving && !saved && !error) return null;
  return (
    <aside role={error ? "alert" : "status"} style={{ marginTop: 20, padding: "12px 14px", borderRadius: 12, background: error ? "#fff4dc" : "#eaf4e9", color: "#2e4d32", lineHeight: 1.5, overflowWrap: "anywhere" }}>
      {saving ? "Dein Ergebnis wird gespeichert …" : error ? (
        <>
          <p style={{ margin: "0 0 8px" }}>Dein Ergebnis konnte gerade nicht gespeichert werden.</p>
          {error.code === "SESSION_RENEWAL_REQUIRED" ? (
            <Link href={`/login?reauth=1&next=${encodeURIComponent(nextUrl)}`}>Anmeldung erneuern</Link>
          ) : (
            <button type="button" onClick={retry} style={{ font: "inherit", padding: "8px 12px", background: "white", color: "#2e4d32", border: "1px solid #b8c8b1", borderRadius: 8, cursor: "pointer" }}>Erneut speichern</button>
          )}
        </>
      ) : (
        <>Ergebnis gespeichert. <Link href="/auswertungen">Meine Auswertungen ansehen</Link></>
      )}
    </aside>
  );
}
