import { useSession, signIn } from "next-auth/react";
import Seo from '../components/Seo';

export default function EbookPage() {
  const { data: session, status } = useSession();

  // Wenn nicht eingeloggt → Login auffordern
  if (status === "loading") return <p>Lade...</p>;

  if (!session) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>🔒 Nur für registrierte Mitglieder</h2>
        <p>Bitte melde dich an, um das E-Book herunterzuladen.</p>
        <button 
          onClick={() => signIn()}
          style={{
            padding: '12px 20px',
            background: '#2b6e3e',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '18px',
            cursor: 'pointer'
          }}
        >
          Jetzt einloggen
        </button>
      </div>
    );
  }

  return (
    <>
      <Seo 
        title="Jagdlatein E-Book" 
        description="Download nur für Mitglieder" 
      />

      <div style={{ maxWidth: '700px', margin: '40px auto', padding: '20px' }}>
        <h1>📘 Jagdlatein – E-Book</h1>

        <p>Du bist eingeloggt — hier kannst du das E-Book herunterladen.</p>

        <a 
          href="/api/ebook"
          style={{
            display: 'inline-block',
            marginTop: '20px',
            padding: '14px 22px',
            background: '#2b6e3e',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '18px'
          }}
        >
          📥 E-Book herunterladen
        </a>
      </div>
    </>
  );
}
