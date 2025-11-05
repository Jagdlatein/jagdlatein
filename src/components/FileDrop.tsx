"use client";
import { useState } from "react";
import * as XLSX from "xlsx";

type Row = { text:string; a:string; b:string; c:string; d:string; correct:number; topic?:string };

export default function FileDrop() {
  const [rows,setRows]=useState<Row[]>([]);
  const [message,setMessage]=useState<string|null>(null);

  function readFile(f: File) {
    setMessage(null);
    const reader = new FileReader();
    reader.onload = e => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type:"array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });

      const mapped: Row[] = json.map((r:any)=>({
        text: String(r.text || r.Frage || r.question || "").trim(),
        a: String(r.a || r.A || "").trim(),
        b: String(r.b || r.B || "").trim(),
        c: String(r.c || r.C || "").trim(),
        d: String(r.d || r.D || "").trim(),
        correct: Number(
          r.correct ?? r.correctIx ?? r.richtig ?? r.Correct ?? r.Korrekt ?? 0
        ),
        topic: (r.topic || r.kategorie || r.them || r.Topic || "").toString().trim() || undefined,
      }));

      setRows(mapped);
    };
    reader.readAsArrayBuffer(f);
  }

  async function importNow() {
    setMessage("Lade hoch…");
    try {
      const res = await fetch("/api/admin/import", {
        method:"POST",
        headers:{ "content-type":"application/json" },
        // wichtig: Cookies mitschicken (Session)
        credentials: "include",
        body: JSON.stringify({ rows })
      });
      const data = await res.json().catch(()=> ({}));
      if (!res.ok) {
        setMessage(`Fehler (${res.status}): ${data?.error ?? "Unbekannt"}`);
        return;
      }
      setMessage(`Import erfolgreich: ${data.imported ?? rows.length} Zeilen`);
    } catch (e:any) {
      setMessage(`Netzwerkfehler: ${e?.message ?? e}`);
    }
  }

  return (
    <div>
      <div className="border-2 border-dashed p-6 text-center mb-4"
           onDragOver={(e)=>e.preventDefault()}
           onDrop={(e)=>{ e.preventDefault(); const f=e.dataTransfer.files?.[0]; if (f) readFile(f); }}>
        <p>Ziehen & Ablegen oder Datei wählen</p>
        <input
          type="file"
          accept=".xlsx,.xls"
          className="mt-2"
          onChange={e=>{
            const f = e.target.files?.[0]; if (f) readFile(f);
          }}
        />
      </div>

      {rows.length>0 && <>
        <p className="mb-2">Vorschau ({rows.length} Zeilen)</p>
        <div className="max-h-80 overflow-auto border">
          <table className="w-full text-sm">
            <thead><tr><th>Frage</th><th>A</th><th>B</th><th>C</th><th>D</th><th>Korrekt</th><th>Topic</th></tr></thead>
            <tbody>
              {rows.slice(0,100).map((r,i)=>(
                <tr key={i}>
                  <td className="border p-1">{r.text}</td>
                  <td className="border p-1">{r.a}</td>
                  <td className="border p-1">{r.b}</td>
                  <td className="border p-1">{r.c}</td>
                  <td className="border p-1">{r.d}</td>
                  <td className="border p-1">{r.correct}</td>
                  <td className="border p-1">{r.topic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="border px-4 py-2 mt-3" onClick={importNow}>In DB importieren</button>
      </>}
      {message && <p className="mt-3">{message}</p>}
    </div>
  );
}
