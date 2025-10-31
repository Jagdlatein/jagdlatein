export default function Login() {
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
            <a href="/preise">Preise</a>
          </nav>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <h1>Login</h1>
          <p className="small">Hier kommt der Zugang nach dem Kauf (PayPal / Kreditkarte / TWINT).</p>

          <div className="card" style={{maxWidth:480}}>
            <label style={{display:'block', marginBottom:8}}>E-Mail</label>
            <input style={{width:'100%', padding:10, border:'1px solid #ddd'}} placeholder="dein@email"/>
            <label style={{display:'block', margin:'12px 0 8px'}}>Passwort</label>
            <input type="password" style={{width:'100%', padding:10, border:'1px solid #ddd'}} placeholder="********"/>
            <div style={{marginTop:12, display:'flex', gap:12}}>
              <button className="cta">Einloggen</button>
              <a className="btn" href="/preise">Zugang kaufen</a>
            </div>
          </div>

          <p className="small" style={{marginTop:16}}>
            Hinweis: Bezahl- und Abo-System wird als Nächstes aktiviert.
          </p>
        </div>
      </section>
    </>
  )
}
