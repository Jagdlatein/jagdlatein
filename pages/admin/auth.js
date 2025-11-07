// 🔒 helpers
function getBearer(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}
function isAuthorized(req) {
  const sent = getBearer(req).trim();
  const want = (process.env.ADMIN_PASS || "").trim();
  return Boolean(sent && want && sent === want);
}

import { useState } from 'react';
import Seo from '../../components/Seo';

export default function AdminAuth(){
  const [t, setT] = useState('');
  const onSubmit = (e)=> {
    e.preventDefault();
    if (!t) return;
    const expected = process.env.NEXT_PUBLIC_ADMIN_TOKEN || '';
    if (t === expected) {
      document.cookie = 'admin=1; Path=/; Max-Age=86400; SameSite=Lax';
      window.location.href = '/admin';
    } else {
      alert('Token falsch');
    }
  };

  return (
    <>
      <Seo title="Admin Login" />
      <section className="section">
        <div className="container" style={{maxWidth:420}}>
          <h1>Admin Login</h1>
          <form className="card" onSubmit={onSubmit}>
            <label>Admin-Token</label>
            <input type="password" value={t} onChange={(e)=>setT(e.target.value)} placeholder="Token" style={{padding:12, borderRadius:12, border:'1px solid rgba(0,0,0,.2)', margin:'6px 0 12px'}}/>
            <button className="cta" type="submit">Anmelden</button>
          </form>
        </div>
      </section>
    </>
  );
}
