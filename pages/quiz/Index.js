const blocks = [
  { title: 'Wildkunde', items: ['Huftiere', 'Haarraubwild', 'Federwild'] },
  { title: 'Waffen & Schuss', items: ['Sicherheit', 'Ballistik', 'Wartung'] },
  { title: 'Recht', items: ['DE', 'AT', 'CH'] },
];

export default function QuizHome() {
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
          <h1>Quiz</h1>
          <p>Trainiere prüfungsnah. Wähle ein Themengebiet:</p>
          <div className="grid">
            {blocks.map((b, i) => (
              <div className="card" key={i}>
                <h3>{b.title}</h3>
                <ul style={{margin:'8px 0 12px', paddingLeft:18}}>
                  {b.items.map((it, j) => <li key={j}>{it}</li>)}
                </ul>
                <a className="btn" href="/login">Starten</a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
