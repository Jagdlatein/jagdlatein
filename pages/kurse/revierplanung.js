"use client";

import { useState } from "react";

export default function RevierplanungKurs() {
  const quiz = [
    {
      frage: "Was gehört zu einer guten Revierplanung?",
      antworten: [
        { text: "Unklare Wegeführung", richtig: false },
        { text: "Sichere Hochsitzstandorte", richtig: true },
        { text: "Zufällige Fütterungsstellen", richtig: false },
        { text: "Keine Wildruhezonen", richtig: false }
      ]
    },
    {
      frage: "Warum sind Ruhezonen wichtig?",
      antworten: [
        { text: "Zur besseren Jagdübersicht", richtig: false },
        { text: "Sie reduzieren Stress und fördern gesunden Wildbestand", richtig: true },
        { text: "Weil sie schön aussehen", richtig: false },
        { text: "Damit Wild weniger frisst", richtig: false }
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
      if(i+1<quiz.length){setI(i+1);setSel(null)}
      else setF(true);
    },900)
  }

  return(
    <div style={{
      maxWidth:800,margin:"40px auto",padding:24,background:"white",
      borderRadius:12,boxShadow:"0 4px 14px rgba(0,0,0,0.1)"
    }}>
      <h1 style={{fontSize:32,marginBottom:15}}>🗺 Revierplanung & Management</h1>

      <p style={{fontSize:18,marginBottom:25}}>
        Revierplanung umfasst Wildruhezonen, Hochsitzplanung, Wechselbeobachtung,
        Fütterungsmanagement und Sicherheitsaspekte. Ein gut strukturiertes Revier
        erleichtert Jagdausübung und schützt den Wildbestand langfristig.
      </p>

      {!f ? (
        <>
          <p>Frage {i+1} von {quiz.length}</p>
          <p style={{fontSize:20}}>{q.frage}</p>

          {q.antworten.map((a,idx)=>{
            let bg="#eaeaea"
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
          <h3 style={{fontSize:24}}>🎉 Stark!</h3>
          <p>Du hast {p} von {quiz.length} Fragen richtig.</p>
        </>
      )}
    </div>
  );
}
