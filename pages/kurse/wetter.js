"use client";

import { useState } from "react";

export default function WetterKurs() {
  const quiz = [
    {
      frage: "Warum ist Windrichtung wichtig?",
      antworten: [
        { text: "Wild sieht dadurch schlechter", richtig: false },
        { text: "Wild nimmt Gerüche über den Wind wahr", richtig: true },
        { text: "Weil der Schuss lauter wird", richtig: false },
        { text: "Für die Optikeinstellung", richtig: false }
      ]
    },
    {
      frage: "Wann ist Wild besonders aktiv?",
      antworten: [
        { text: "Bei starkem Sturm", richtig: false },
        { text: "In den Dämmerungsphasen", richtig: true },
        { text: "Bei greller Mittagssonne", richtig: false },
        { text: "Nur bei Regen", richtig: false }
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
    },900)
  }

  return(
    <div style={{
      maxWidth:800,margin:"40px auto",padding:24,background:"white",
      borderRadius:12,boxShadow:"0 4px 14px rgba(0,0,0,0.1)"
    }}>
      <h1 style={{fontSize:32,marginBottom:15}}>🌦 Wetter & Wind in der Jagd</h1>

      <p style={{fontSize:18,marginBottom:25}}>
        Wetter beeinflusst Wildverhalten, Schussabgabe und Lautstärke enorm.
        Windrichtung entscheidet über Witterungskontakt – der wichtigste Faktor
        für eine erfolgreiche Ansitz- und Pirschjagd.
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
          <h3 style={{fontSize:24}}>🎉 Sehr gut erkannt!</h3>
          <p>Du hast {p} von {quiz.length} Fragen richtig.</p>
        </>
      )}
    </div>
  );
}
