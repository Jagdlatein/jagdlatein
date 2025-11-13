"use client";
import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";
import Seo from '../components/Seo';

export default function EbookPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session) {
      // automatische Weiterleitung zu OneDrive
      window.location.href =
        "https://1drv.ms/b/c/357722b348ffd019/EbveCgU6lLpLpbbe4Na5LO8BtDYreUafjSunpVFmLkmXWA?e=B0pRyj";
    }
  }, [session]);

  if (status === "loading") return <p>Lade...</p>;

  if (!session) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Seo 
          title="Jagdlatein E-Book" 
          description="Zugriff nur für registrierte Mitglieder" 
        />

        <h2>🔒 Login erforderlich</h2>
        <p>Bitte melde dich an, um automatisch zum E-Book weitergeleitet zu werden.</p>

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

  return <p>Weiterleitung zum E-Book…</p>;
}
export async function getServerSideProps() {
  return {
    props: {}
  };
}

