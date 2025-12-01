export default function Jagdpraxis() {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: 32 }}>
      <h1>🦌 Jagdpraxis-Simulator</h1>
      <p>
        Realistische Jagdszenarien – Schießen oder nicht? Ansprechen, Verhalten, Sicherheit.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 32 }}>
        
        <a href="/jagdpraxis/ansitz" className="btn">🎯 Ansitz-Simulator</a>
        <a href="/jagdpraxis/drueckjagd" className="btn">🐗 Drückjagd-Simulator</a>
        <a href="/jagdpraxis/pirsch" className="btn">👣 Pirsch-Simulator</a>
        <a href="/jagdpraxis/keiler" className="btn">🐗 Keiler-Erkennung</a>
        <a href="/jagdpraxis/schusszeichen" className="btn">💥 Schusszeichen-Trainer</a>
        <a href="/jagdpraxis/trefferzonen" className="btn">🎯 Trefferzonen-Trainer</a>
        <a href="/jagdpraxis/wild" className="btn">🦌 Wildkunde</a>
        <a href="/jagdpraxis/wildansprache" className="btn">🦌 Wildansprache-Trainer</a>
        <a href="/jagdpraxis/nachsuche" className="btn">🐕 Nachsuche-Simulator</a>

      </div>
    </main>
  );
}
