import Seo from '../components/Seo';

export default function EbookPage() {
  return (
    <>
      <Seo 
        title="Jagdlatein E-Book Download" 
        description="Lade das offizielle Jagdlatein Lehrbuch herunter." 
      />

      <div style={{ maxWidth: '700px', margin: '40px auto', padding: '20px' }}>
        <h1>📘 Jagdlatein – E-Book</h1>

        <p>
          Hier kannst du das komplette <strong>Jagdlatein Lehrbuch</strong> als PDF direkt herunterladen.
        </p>

        <a 
          href="/ebook/Jagdlatein-Lehrbuch.pdf"
          download
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
          📥 Jetzt E-Book herunterladen
        </a>

        <p style={{ marginTop: '20px', color: '#666' }}>
          Dateiformat: PDF • Umfang: 133 Seiten
        </p>
      </div>
    </>
  );
}
