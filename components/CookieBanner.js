import { useEffect, useState } from 'react';

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setOpen(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setOpen(false);
  };
  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setOpen(false);
  };

  if (!open) return null;
  return (
    <div style={{
      position:'fixed', left:16, right:16, bottom:16, zIndex:100,
      background:'rgba(255,255,255,.9)', border:'1px solid rgba(42,35,25,.15)',
      borderRadius:12, padding:14, boxShadow:'0 10px 25px rgba(0,0,0,.18)'
    }}>
      <div style={{display:'flex',flexWrap:'wrap',gap:12,alignItems:'center',justifyContent:'space-between'}}>
        <p style={{margin:0, color:'#2a2319'}}>
          Wir verwenden Cookies für eine reibungslose Nutzung (z. B. Login). Details in der <a href="/datenschutz">Datenschutzerklärung</a>.
        </p>
        <div style={{display:'flex',gap:8}}>
          <button className="btn" onClick={decline}>Ablehnen</button>
          <button className="cta" onClick={accept}>Akzeptieren</button>
        </div>
      </div>
    </div>
  );
}
