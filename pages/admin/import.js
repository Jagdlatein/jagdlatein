// pages/admin/import.js
import { useEffect, useState, useRef } from "react";

export default function ImportQuiz() {
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const inputRef = useRef(null);

  // SheetJS aus CDN laden (ohne npm)
  useEffect(() => {
    if (window.XLSX) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    s.async = true;
    s.onload = () => setReady(true);
    s.onerror = () => alert("XLSX konnte nicht geladen werden.");
    document.body.appendChild(s);
  }, []);

  const required = [
    "id","country","category","topic","question",
    "option_a","option_b","option_c","option_d","correct"
  ];

  function validate(list) {
    const errs = [];
    const have = Object.keys(list[0] || {});
    const missing = required.filter(h => !have.includes(h));
    if (missing.length) errs.push(`Fehlende Spalten: ${missing.join(", ")}`);

    list.forEach((r, i) => {
      if (!r.id) errs.push(`Zeile ${i+2}: id fehlt`);
      if (!r.question) errs.push(`Zeile ${i+2}: question fehlt`);
      if (!["A","B","C","D"].includes((r.correct||"").toUpperCase()))
        errs.push(`Zeile ${i+2}: correct muss A/B/C/D sein`);
    });
    return errs;
  }

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const wb = window.XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = window.XLSX.utils.sheet_to_json(ws, { defval: "" });
      const errs = validate(json);
      setErrors(errs);
      setRows(json);
    };
    reader.readAsArrayBuffer(f);
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz_bank.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main style={{maxWidth:900, margin:"0 auto", padding:"24px 16px", fontFamily:"system-ui"}}>
      <h1>Quiz-Import (Excel)</h1>
      <p>Excel mit den Spalten aus der Vorlage hochladen. Wir erzeugen daraus eine <code>quiz_bank.json</code>.</p>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={onFile}
        disabled={!ready}
        style={{margin:"12px 0"}}
      />

      {!ready && <p>📦 Lade Parser…</p>}

      {errors.length > 0 && (
        <div style={{background:"#fff5f5", border:"1px solid #ffc9c9", padding:12, borderRadius:8, margin:"12px 0"}}>
          <strong>Prüfhinweise:</strong>
          <ul style={{margin:"6px 0 0 18px"}}>
            {errors.map((e,i)=><li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <p><strong>{rows.length}</strong> Datensätze geladen.</p>
          <button
            onClick={downloadJSON}
            style={{padding:"10px 14px", borderRadius:10, background:"#1d4d2b", color:"#fff", border:"none", cursor:"pointer"}}
          >
            JSON herunterladen
          </button>

          <div style={{marginTop:16, overflow:"auto", maxHeight:360, border:"1px solid #eee"}}>
            <table style={{width:"100%", borderCollapse:"collapse", fontSize:14}}>
              <thead>
                <tr>
                  {Object.keys(rows[0]).map(h=>(
                    <th key={h} style={{textAlign:"left", padding:"8px", background:"#f8faf8", position:"sticky", top:0}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0,50).map((r,i)=>(
                  <tr key={i}>
                    {Object.keys(rows[0]).map(k=>(
                      <td key={k} style={{borderTop:"1px solid #eee", padding:"8px"}}>{String(r[k])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{padding:"8px", color:"#6b7280"}}>Vorschau zeigt max. 50 Zeilen.</div>
          </div>
        </>
      )}
    </main>
  );
                        }
