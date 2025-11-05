// pages/admin/import.js
import { useEffect, useRef, useState } from "react";

const REQUIRED = ["id","country","category","topic","question","option_a","option_b","option_c","option_d","correct"];
const PASS_KEY = "jl_admin_pass";

export default function ImportQuiz() {
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [okMsg, setOkMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const [pass, setPass] = useState("");

  // Passwort aus Session laden
  useEffect(() => {
    const p = sessionStorage.getItem(PASS_KEY) || "";
    setPass(p);
  }, []);

  // SheetJS laden (CDN)
  useEffect(() => {
    if (window.XLSX) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    s.async = true;
    s.onload = () => setReady(true);
    s.onerror = () => alert("XLSX konnte nicht geladen werden.");
    document.body.appendChild(s);
  }, []);

  function validate(list) {
    const errs = [];
    if (!list.length) { errs.push("Datei enthält keine Daten."); return errs; }
    const have = Object.keys(list[0] || {});
    const missing = REQUIRED.filter(h => !have.includes(h));
    if (missing.length) errs.push(`Fehlende Spalten: ${missing.join(", ")}`);
    list.forEach((r, i) => {
      const z = i + 2; // XLSX: Kopfzeile = 1
      if (!r.id) errs.push(`Zeile ${z}: id fehlt`);
      if (!r.question) errs.push(`Zeile ${z}: question fehlt`);
      if (!["A","B","C","D"].includes(String(r.correct||"").toUpperCase()))
        errs.push(`Zeile ${z}: correct muss A/B/C/D sein`);
    });
    return errs;
  }

  function onFile(e) {
    setOkMsg("");
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const data = ev.target.result;
      const wb = window.XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = window.XLSX.utils.sheet_to_json(ws, { defval: "" });
      const errs = validate(json);
      setErrors(errs);
      setRows(json);
    };
    reader.readAsArrayBuffer(f);
  }

  async function upload() {
    if (!pass) return alert("Passwort erforderlich.");
    if (!rows.length) return alert("Bitte zuerst eine Datei laden.");
    const errs = validate(rows);
    if (errs.length) { setErrors(errs); return; }

    try {
      setBusy(true);
      setOkMsg("");
      const res = await fetch("/api/quiz/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pass": pass
        },
        body: JSON.stringify({
          path: "public/data/quiz_bank.json",
          message: "chore(quiz): update quiz_bank.json via admin import",
          data: rows
        })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Upload fehlgeschlagen");
      setOkMsg("✅ Erfolgreich committed. Das Quiz wird mit dem nächsten Deployment aktualisiert.");
    } catch (e) {
      alert(e.message || "Fehler beim Upload.");
    } finally {
      setBusy(false);
    }
  }

  function saveLocal() {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "quiz_bank.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function setPassword(p) {
    setPass(p);
    sessionStorage.setItem(PASS_KEY, p);
  }

  // Passwort-Gate (einfach)
  if (pass !== "Jagdlatein2025") {
    return (
      <main style={st.page}>
        <div style={st.wrap}>
          <h1 style={st.h1}>Admin Login</h1>
          <input
            type="password"
            placeholder="Passwort"
            onChange={e=>setPassword(e.target.value)}
            style={st.input}
          />
          <p style={{color:"#6b7280", marginTop:8}}>Tipp: Passwort bleibt wie von dir bestätigt.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={st.page}>
      <div style={st.wrap}>
        <h1 style={st.h1}>Quiz-Import</h1>
        <p style={{color:"#475569", margin:"0 0 12px"}}>
          Excel (.xlsx/.xls/.csv) hochladen → prüfen → per Klick ins Repo committen.
        </p>

        <div style={{display:"grid", gap:10}}>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={onFile} disabled={!ready} style={st.input}/>
          {!ready && <span>📦 Lade Parser…</span>}
          {errors.length > 0 && (
            <div style={st.alert}>
              <strong>Prüfhinweise:</strong>
              <ul style={{margin:"6px 0 0 18px"}}>
                {errors.slice(0,50).map((e,i)=><li key={i}>{e}</li>)}
              </ul>
              {errors.length>50 && <div>… {errors.length-50} weitere</div>}
            </div>
          )}

          {rows.length > 0 && (
            <>
              <div style={{display:"flex", gap:10, flexWrap:"wrap", alignItems:"center"}}>
                <span><strong>{rows.length}</strong> Datensätze geladen</span>
                <button onClick={saveLocal} style={st.btnGhost}>JSON herunterladen</button>
                <button onClick={upload} disabled={busy} style={st.btnPrimary}>
                  {busy ? "Lade hoch…" : "✅ Ins Repo committen"}
                </button>
              </div>

              <div style={st.tableWrap}>
                <table style={st.table}>
                  <thead>
                    <tr>
                      {Object.keys(rows[0]||{}).map(h=>(
                        <th key={h} style={st.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0,60).map((r,i)=>(
                      <tr key={i}>
                        {Object.keys(rows[0]).map(k=>(
                          <td key={k} style={st.td}>{String(r[k])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{padding:"8px", color:"#6b7280"}}>Vorschau zeigt max. 60 Zeilen.</div>
              </div>
            </>
          )}

          {okMsg && <div style={st.note}>{okMsg}</div>}
        </div>
      </div>
    </main>
  );
}

const st = {
  page:{ background:"linear-gradient(180deg,#fff,#f7faf7)" },
  wrap:{ maxWidth:980, margin:"0 auto", padding:"20px 14px", fontFamily:"system-ui, Segoe UI, Roboto, Arial" },
  h1:{ margin:"6px 0 12px", fontSize:34, lineHeight:1.15, color:"#121518" },
  input:{ height:42, borderRadius:10, border:"1px solid #dfe7df", padding:"0 12px", background:"#fff" },
  btnPrimary:{ padding:"10px 14px", borderRadius:10, background:"#1d4d2b", color:"#fff", border:"none", cursor:"pointer", fontWeight:700 },
  btnGhost:{ padding:"10px 14px", borderRadius:10, background:"#fff", border:"1px solid #dfe7df", cursor:"pointer", fontWeight:700 },
  alert:{ background:"#fff5f5", border:"1px solid #ffc9c9", padding:12, borderRadius:10 },
  tableWrap:{ marginTop:12, overflow:"auto", maxHeight:420, border:"1px solid #eee", borderRadius:8, background:"#fff" },
  table:{ width:"100%", borderCollapse:"collapse", fontSize:14 },
  th:{ position:"sticky", top:0, background:"#f6faf6", textAlign:"left", padding:"8px", borderBottom:"1px solid #eaeaea" },
  td:{ padding:"8px", borderTop:"1px solid #eee", whiteSpace:"nowrap" },
  note:{ background:"#f0f9ff", border:"1px solid #bfdbfe", color:"#0c4a6e", padding:12, borderRadius:10 }
};
