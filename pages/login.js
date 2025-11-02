export default function Login(){
  const enter = () => {
    if (typeof window !== 'undefined') {
      const ok = localStorage.getItem('jagdlatein_access') === 'true';
      if (ok) window.location.href='/kurse';
      else alert('Noch kein aktives Abo. Bitte unter Preise buchen.');
    }
  };
  return (
    <section className="section">
      <div className="container" style={{maxWidth:520}}>
        <h1>Login</h1>
        <p className="small">Vorübergehender Zugang bis Checkout live ist.</p>
        <div className="card">
          <button className="cta" onClick={enter}>Zugang prüfen</button>
          <a className="btn" href="/preise" style={{marginLeft:10}}>Abo kaufen</a>
        </div>
      </div>
    </section>
  )
}
