import { useState } from 'react';
import Seo from '../components/Seo';

export default function Login(){
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, msg: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setStatus({ loading: true, msg: '' });
      const res = await fetch('/api/auth/check', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (data.active) {
        // Zugang freischalten (einfacher Client-Flag)
        localStorage.setItem('jagdlatein_access', 'true');
        localStorage.setItem('jagdlatein_email', (data.email || email).toLowerCase());
        localStorage.setItem('jagdlatein_plan', data.plan || '');
        window.location.href = '/'; // Startseite
      } else {
        const reason =
          data.reason === 'no_customer' ? 'Kein Kauf zur E-Mail gefunden.' :
          data.reason === 'no_active_sub' ? 'Kein aktives Abo gefunden.' :
          'Kein Zugang mit dieser E-Mail.';
        setStatus({ loading: false, msg: reason });
      }
    } catch (err) {
      setStatus({ loading: false, msg: 'Serverfehler. Bitte später nochmal.' });
    }
  };

  const logout = () => {
    localStorage.removeItem('jagdlatein_access');
    localStorage.removeItem('jagdlatein_email');
    localStorage.removeItem('jagdlatein_plan');
    setStatus({ loading: false, msg: 'Abgemeldet.' });
  };

  return (
    <>
      <Seo title="Login – Jagdlatein" description="Login mit E-Mail. Zugang wird automatisch anhand deines Stripe-Abos aktiviert." />
      <section className="section">
        <div className="container" style={{maxWidth:520}}>
          <h1>Login</h1>
          <p className="small">Gib die E-Mail ein, mit der du bezahlt hast. Dein Zugang wird automatisch geprüft.</p>

          <form className="card" onSubmit={onSubmit}>
            <label htmlFor="email" style={{display:'block', marginBottom:8, fontWeight:700}}>E-Mail</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              placeholder="deine@email.tld"
              style={{
                width:'100%', padding:'12px 14px', borderRadius:12,
                border:'1px solid rgba(42,35,25,.2)', marginBottom:12
              }}
            />
            <button className="cta" disabled={status.loading} type="submit">
              {status.loading ? 'Prüfe Zugang…' : 'Einloggen'}
            </button>
            <button type="button" className="btn" style={{marginLeft:10}} onClick={logout}>
              Abmelden
            </button>

            {status.msg ? <p className="small" style={{marginTop:12}}>{status.msg}</p> : null}
          </form>

          <p className="small" style={{marginTop:12}}>
            Noch kein Abo? <a className="btn" href="/preise" style={{marginLeft:6}}>Abo wählen</a>
          </p>
        </div>
      </section>
    </>
  );
}
