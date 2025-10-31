export default function Kurse() {
  const kurse = [
    { title: 'DE – Jagdschein', desc: 'Lehrplan Deutschland: Recht, Wildkunde, Waffen, Praxis.' },
    { title: 'AT – Jagdprüfung', desc: 'Österreich: Landesjagdgesetze, Wildbiologie, Praxis.' },
    { title: 'CH – Jagdprüfung', desc: 'Schweiz: kantonale Unterschiede, Ethik, Sicherheit.' },
  ];

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <div className="brand">
            <div style={{ width: 28, height: 28, background: '#D4AF37', borderRadius: '50%' }} />
            <div>Jagdlatein <span>• Lernplattform</span></div>
          </div>
          <nav className="menu">
            <a href="/">Start</a>
            <a href="/kurse">Kurse</a>
            <a href="/preise">Preise</a>
            <a href="/login">Login</a>
          </nav>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <h1>Kurse</h1>
          <p>Alle Lernmodule für DE / AT / CH – laufend erweitert.</p>
          <div className="grid">
            {kurse.map((k, i) => (
              <div className="card" key={i}>
                <h3>{k.title}</h3>
                <p>{k.desc}</p>
                <a className="btn" href="/login">Zum Kurs</a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
