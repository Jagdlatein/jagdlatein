// pages/protected/ebook.js
export async function getServerSideProps({ req }) {
  const cookie = req.headers.cookie || "";

  const hasSession = cookie.includes("jl_session=1");
  const hasPaid = cookie.includes("jl_paid=1");
  const isAdmin = cookie.includes("jl_admin=1");

  if (!hasSession) {
    return {
      redirect: {
        destination: "/login?next=/protected/ebook",
        permanent: false,
      },
    };
  }

  if (!hasPaid && !isAdmin) {
    return {
      redirect: {
        destination: "/preise",
        permanent: false,
      },
    };
  }

  return { props: {} };
}

export default function ProtectedEbookPage() {
  return (
    <main style={{ padding: 40, textAlign: "center" }}>
      <h1>E-Book</h1>

      <p>Dein exklusiver Zugriff ist freigeschaltet:</p>

      <iframe
        src="/ebook.pdf"
        style={{ width: "100%", height: "90vh", border: "none", marginTop: 20 }}
      ></iframe>

      <p>
        <a
          href="/ebook.pdf"
          download
          style={{
            display: "inline-block",
            marginTop: 20,
            padding: "12px 20px",
            background: "#caa53b",
            color: "#111",
            borderRadius: 10,
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
          PDF herunterladen
        </a>
      </p>
    </main>
  );
}
