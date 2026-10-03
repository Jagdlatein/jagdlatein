import Link from "next/link";
import LearningDiscovery from "../../components/LearningDiscovery";

export default function JagdrechtHome() {
  return (
    <main style={styles.container}>
      <h1 style={styles.h1}>🦌 Jagdrecht – Länderwahl</h1>
      <LearningDiscovery category="Jagdrecht" title="Jagdrecht Schritt für Schritt lernen" />

      <div style={styles.grid}>
        <Link href="/jagdrecht/de" style={styles.card}>
          <h2>🇩🇪 Deutsches Jagdrecht</h2>
          <p>Bundesjagdgesetz, Verordnungen & Landesjagdgesetze.</p>
        </Link>

        <Link href="/jagdrecht/ch" style={styles.card}>
          <h2>🇨🇭 Schweizer Jagdrecht</h2>
          <p>JSG, JSV, Kantone & Jagdsysteme.</p>
        </Link>

        <Link href="/jagdrecht/at" style={styles.card}>
          <h2>🇦🇹 Österreichisches Jagdrecht</h2>
          <p>Landesjagdgesetze, Verordnungen und Jagdkarten der Bundesländer.</p>
        </Link>
      </div>
    </main>
  );
}

const styles = {
  container: {
    maxWidth: 900,
    margin: "0 auto",
    padding: 32,
    fontFamily: "system-ui",
  },
  h1: {
    fontSize: 34,
    marginBottom: 30,
    fontWeight: 700,
    textAlign: "center",
  },
  grid: {
    display: "flex",
    gap: 20,
    flexDirection: "column",
  },
  card: {
    display: "block",
    padding: 20,
    borderRadius: 16,
    border: "3px solid #caa53b",
    background: "#fff",
    boxShadow: "0 0 18px rgba(202,165,59,0.25)",
    textDecoration: "none",
    color: "#333",
    transition: "0.25s ease",
  },
};
