// pages/admin/import.js
import { useEffect, useState } from "react";
import { getPaidPageProps } from "../../lib/account-access";

const REQUIRED = ["id","country","category","topic","question","option_a","option_b","option_c","option_d","correct"];

export default function ImportQuiz() {
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);

  // SheetJS laden (CDN)
  useEffect(() => {
    if (window.XLSX) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
    s.async = true;
    s.onload = () => setReady(true);
    s.onerror = () => setErrors(["Die Importvorschau konnte nicht geladen werden. Bitte lade die Seite erneut."]);
    document.body.appendChild(s);
    return () => { s.onload = null; s.onerror = null; s.remove(); };
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
    setRows([]);
    setErrors([]);
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setErrors(["Die Datei darf höchstens 5 MB groß sein."]); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = ev.target.result;
        const wb = window.XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) throw new Error();
        const json = window.XLSX.utils.sheet_to_json(ws, { defval: "" });
        setErrors(validate(json));
        setRows(json);
      } catch { setErrors(["Die Datei konnte nicht gelesen werden. Bitte eine gültige Excel- oder CSV-Datei wählen."]); }
    };
    reader.onerror = () => setErrors(["Die Datei konnte nicht gelesen werden."]);
    reader.readAsArrayBuffer(f);
  }

  function saveLocal() {
    const issues = validate(rows);
    if (issues.length) { setErrors(issues); return; }
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "quiz_import_entwurf.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main style={st.page}>
      <div style={st.wrap}>
        <h1 style={st.h1}>Quiz-Importvorschau</h1>
        <p style={{color:"#475569", margin:"0 0 12px"}}>
          Excel oder CSV auswählen, prüfen und als JSON-Entwurf herunterladen. Die Vorschau verändert keine veröffentlichten Fragen. Neue Fragen müssen fachlich geprüft und anschließend in den Fragenbestand übernommen werden.
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
                <button onClick={saveLocal} disabled={errors.length > 0} style={st.btnGhost}>JSON-Entwurf herunterladen</button>
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

        </div>
      </div>
    </main>
  );
}

export async function getServerSideProps(context) {
  return getPaidPageProps(context, { adminOnly: true });
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
