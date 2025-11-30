"use client";

import { useState } from "react";

export default function WildhygieneKurs() {
  const quiz = [
    {
      frage: "Was ist beim Aufbrechen besonders wichtig?",
      antworten: [
        { text: "Lang warten", richtig: false },
        { text: "Sauberes, kontaminationsfreies Arbeiten", richtig: true },
        { text: "Mit Erde abreiben", richtig: false },
        { text: "Kein Messer verwenden", richtig: false }
      ]
    },
    {
      frage: "Woran erkennt man gutes Wildbret?",
      antworten: [
        { text: "Starker Geruch", richtig: false },
        { text: "Feste Struktur & neutrale Farbe", richtig: true },
        { text: "Schmierige Oberfläche", richtig: false },
        { text: "Grünliche Töne", richtig: false }
      ]
    }
  ];

  const [i,setI]=useState(0);
  const [sel,setSel]=useState(null);
  const [p,setP]=useState(0);
  const [f,setF]=useState(false);
  const q=quiz[i];

  function choose(a){
    if(sel!==null) return;
    setSel(a);
    if(q.antworten[a].richtig) setP(p+1);
    setTimeout(()=>{
      if(i+1<quiz.length){setI(i+1);setSel(null);}
      else setF(true)
    },900)
  }

  return(
    <div style={{
      maxWidth:800,margin:"40px auto",padding:24,background:"white",
      borderRadius:12,boxShadow:"0 4px 14px rgba(0,0,0,0.1)"
    }}>
      <h1 style={{fontSize:32,marginBottom:15}}>🔪 Wildhygiene & Verarbeitung</h1>

      <p style={{fontSize:18,marginBottom:25}}>
        Wildhygiene beginnt bereits beim Schuss. Sauberes Aufbrechen, Kühlung,
        richtige Lagerung und fachgerechtes Zerwirken sichern hohe Fleischqualität
        und verhindern Verderb oder Verunreinigungen.
      </p>

      {!f ? (
        <>
          <p>Frage {i+1} von {quiz.length}</p>
          <p style={{fontSize:20}}>{q.frage}</p>

          {q.antworten.map((a,idx)=>{
            let bg="#eaeaea";
            if(sel!==null){
              if(a.richtig) bg="green";
              if(sel===idx && !a.richtig) bg="red";
            }
            return(
              <button key={idx} onClick={()=>choose(idx)} disabled={sel!==null}
                style={{
                  width:"100%",padding:12,marginBottom:10,borderRadius:8,
                  background:bg,color:"white",textAlign:"left"
                }}>{a.text}</button>
            )
          })}
        </>
      ):(
        <>
          <h3 style={{fontSize:24}}>🎉 Sehr sauber gearbeitet!</h3>
          <p>Du hast {p} von {quiz.length} Fragen richtig.</p>
        </>
      )}
    </div>
  );
}
