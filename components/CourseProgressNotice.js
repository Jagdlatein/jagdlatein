import Link from "next/link";

export default function CourseProgressNotice({ courseId, saving, error, retry }) {
  if (!saving && !error) return null;

  const renewalRequired = error?.code === "SESSION_RENEWAL_REQUIRED";
  const loginHref = `/login?reauth=1&next=${encodeURIComponent(`/kurse/${courseId}`)}`;

  return (
    <aside
      role={error ? "alert" : "status"}
      style={{
        marginTop: 24,
        padding: "12px 14px",
        borderRadius: 10,
        background: error ? "#fff4dc" : "#f3f6ef",
        color: "#374130",
        fontSize: 15,
        lineHeight: 1.5,
        overflowWrap: "anywhere",
      }}
    >
      {saving ? "Kursfortschritt wird gespeichert …" : (
        <>
          <p style={{ margin: "0 0 8px" }}>
            {renewalRequired
              ? "Bitte melde dich erneut an, damit dein Kursfortschritt deinem Konto zugeordnet werden kann."
              : "Dein Kursfortschritt konnte gerade nicht gespeichert werden."}
          </p>
          {renewalRequired ? (
            <Link href={loginHref} style={{ color: "#42582d", fontWeight: 600 }}>
              Anmeldung erneuern
            </Link>
          ) : (
            <button
              type="button"
              onClick={retry}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #c8d0bc",
                background: "white",
                color: "#374130",
                cursor: "pointer",
                fontSize: "inherit",
              }}
            >
              Erneut speichern
            </button>
          )}
        </>
      )}
    </aside>
  );
}
