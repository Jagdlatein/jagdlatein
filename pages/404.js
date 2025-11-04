export default function NotFound() {
  return (
    <section className="section">
      <div className="container" style={{textAlign:'center', maxWidth:640}}>
        <h1>Seite nicht gefunden</h1>
        <p>Die angeforderte Seite existiert nicht oder wurde verschoben.</p>
        <p className="small" style={{marginTop:8}}>
          <a className="btn" href="/" style={{marginRight:10}}>Start</a>
          <a className="btn" href="/quiz" style={{marginRight:10}}>Zum Quiz</a>
          <a className="btn" href="/preise">Preise</a>
        </p>
      </div>
    </section>
  );
}
