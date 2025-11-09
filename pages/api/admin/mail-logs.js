// pages/admin/mail-logs.js
import { useEffect, useState } from "react";

export default function MailLogs(){
  const [rows,setRows]=useState([]);
  const [key,setKey]=useState("");

  async function load(k){
    const r = await fetch(`/api/admin/mail-logs?limit=200&key=${encodeURIComponent(k)}`);
    const j = await r.json();
    if(j.ok) setRows(j.data); else alert(j.error||"Error");
  }

  useEffect(()=>{ const k = localStorage.getItem("admin_key")||""; setKey(k); if(k) load(k); },[]);
  return (
    <div style={{padding:20}}>
      <h1>Mail Logs</h1>
      <div style={{margin:"10px 0"}}>
        <input value={key} onChange={e=>setKey(e.target.value)} placeholder="ADMIN_PASS" />
        <button onClick={()=>{ localStorage.setItem("admin_key",key); load(key); }}>Laden</button>
      </div>
      <table cellPadding={6} border="1">
        <thead><tr><th>ID</th><th>created</th><th>to</th><th>subject</th><th>status</th><th>error</th><th>ip</th></tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{new Date(r.createdAt).toLocaleString()}</td>
              <td>{r.to}</td>
              <td>{r.subject}</td>
              <td>{r.status}</td>
              <td style={{maxWidth:400}}>{r.error}</td>
              <td>{r.ip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
