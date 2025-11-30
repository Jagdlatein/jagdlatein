"use client";

import { useState } from "react";

export default function BallistikKurs() {
  const quiz = [
    {
      frage: "Was beeinflusst die Geschossflugbahn am stärksten?",
      antworten: [
        { text: "Waffengewicht", richtig: false },
        { text: "Geschossgeschwindigkeit & -gewicht", richtig: true },
        { text: "Riemenbreite", richtig: false },
        { text: "Schalldämpferfarbe", richtig: false }
      ]
    },
    {
      frage: "Was beschreibt die Deformationswirkung?",
      antworten: [
        { text: "Wie laut ein Schuss ist", richtig: false },
        { text: "Wie sich ein Geschoss im Ziel aufpilzt", richtig: true },
        { text: "Rückstoßverhalten", richtig: false },
        { text: "Reichweite der Optik", richtig: false }
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
      else setF(true);
    },900);
  }

  return (
    <div style={{
      maxWidth:800, margin:"40px auto", padding:24, background:"white",
      borderRadius:12, boxShadow:"0 4px 14px rgba(0,0,0,0.1)"
    }}>
      <h1 style={{fontSize:32,marginBottom:15}}>💡 Ballistik Grundlagen</h1>

      <p style={{fontSize:18,marginBottom:25}}>
        Ballistik beschreibt die Flugbahn eines Geschosses. Geschwindigkeit, Masse und
        Form bestimmen Reichweite und Wirkung. Deformationsgeschosse pilzen im Wildkörper auf
        und erhöhen die Energieabgabe.
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
          <h3 style={{fontSize:24}}>🎉 Gut gemacht!</h3>
          <p>Du hast {p} von {quiz.length} Fragen richtig.</p>
        </>
      )}
    </div>
  );
}
