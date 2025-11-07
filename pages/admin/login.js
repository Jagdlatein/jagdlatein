// pages/admin/login.js
import { useState } from "react";
import { useRouter } from "next/router";

export default function AdminLogin() {
  const r = useRouter();
  const [user, setUser] = useState(process.env.NEXT_PUBLIC_ADMIN_USER || "");
  const [pass, setPass] = useState(process.env.NEXT_PUBLIC_ADMIN_HINT || "");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, pass }),
    });
    if (res.ok) {
      r.push("/admin/quiz");
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Login fehlgeschlagen");
    }
  }

  return (
    <main style={{minHeight:"100dvh",display:"grid",placeItems:"center",fontFamily:"system-ui,sans-serif",padding:24}}>
      <form onSubmit={onSubmit} style={{width:360,maxWidth:"100%",display:"grid",gap:12, padding:20, border:"1px solid #e5e7eb", borderRadius:10}}>
        <h1 style={{margin:0}}>🔐 Admin-Login</h1>
        <label>Benutzername
          <input value={user} onChange={e=>setUser(e.target.value)} required
                 style={{width:"100%",padding:"10px 12px",border:"1px solid #d1d5db",borderRadius:8}} />
        </label>
        <label>Passwort
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} required
                 style={{width:"100%",padding:"10px 12px",border:"1px solid #d1d5db",borderRadius:8}} />
        </label>
        {error && <p style={{color:"#b91c1c",margin:"4px 0 0"}}>{error}</p>}
        <button type="submit" style={{padding:"10px 14px",borderRadius:8,border:"1px solid #111827",background:"#111827",color:"#fff"}}>
          Einloggen
        </button>
        <p style={{fontSize:12,color:"#6b7280",margin:0}}>Tipp: Passwort entspricht <code>ADMIN_PASS</code>.</p>
      </form>
    </main>
  );
}
