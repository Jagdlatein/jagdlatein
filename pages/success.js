// pages/success.js
import { useRouter } from "next/router";
import { useState } from "react";

export default function Success() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const provider = (router.query.provider || "").toString(); // "stripe" | "paypal"

  const activate = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/access/grant`, { method: "POST" });
      if (!res.ok) throw new Error("grant failed");
      router.replace("/quiz");
    } catch (e) {
      alert("Aktivierung fehlgeschlagen. Bitte nochmals versuchen.");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 KORREKTER LOGOUT — löscht HttpOnly Cookies über API
  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/";
  }

  return (
    <main style={{
      maxWidth:720,
      margin:"40px auto",
      padding:"0 16px",
      fontFamily:"system-ui,Segoe UI,Roboto,Arial"
    }}>
      <h1>Vielen Dank! ✅</h1>

      <p style={{color:"#374151"}}>
        Zahlung erfolgreich{provider ? ` (${provider})` : ""}.  
        Klicke unten, um deinen Zugang freizuschalten.
      </p>

      <button
        onClick={activate}
        disabled={loading}
        style={{
          padding:"12px 16px",
          borderRadius:12,
          border:"1px solid #e2e8e2",
          background:"#1d4d2b",
          color:"#fff",
          fontWeight:600,
          cursor:"pointer",
          marginTop:12
        }}
      >
        {loading ? "Aktiviere…" : "Zugang aktivieren"}
      </button>

      <p style={{marginTop:14, color:"#6b7280", fontSize:14}}>
        Hinweis: Der Zugang wird als Cookie gespeichert (180 Tage).  
        Du kannst ihn jederzeit über „Logout“ entfernen.
      </p>

      {/* 🔥 LOGOUT BUTTON */}
      <button
        onClick={logout}
        style={{
          marginTop:20,
          padding:"10px 20px",
          background:"#fff",
          border:"2px solid #caa53b",
          borderRadius:12,
          fontSize:16,
          fontWeight:600,
          color:"#1f2b23",
          cursor:"pointer"
        }}
      >
        Logout
      </button>
    </main>
  );
}
