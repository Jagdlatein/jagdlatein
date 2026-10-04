"use client";

import { useState } from "react";
import useCourseProgress from "../../hooks/useCourseProgress";
import CourseProgressNotice from "../../components/CourseProgressNotice";

export default function FallenrechtKurs() {
  const quiz = [
    {
      frage: "Was musst du vor dem Einsatz einer Falle zu den Kontrollen klären?",
      antworten: [
        { text: "Prüfung nur am Wochenende", richtig: false },
        { text: "Die örtlichen Kontrollfristen und Vorgaben zur unverzüglichen Versorgung eines Fangs", richtig: true },
        { text: "Prüfung nur bei Fangmeldung", richtig: false },
        { text: "Keine Kontrolle nötig", richtig: false }
      ],
      source: "https://www.jagdverband.de/sites/default/files/2026-05/2026-05_DJV_Fallenjagd_Laenderuebersicht.pdf",
    },
    {
      frage: "Welche Aussage zu Lebendfangkastenfallen ist richtig?",
      antworten: [
        { text: "Jede Kastenfalle ist überall zulässig", richtig: false },
        { text: "Zulässigkeit, Bauart, Aufstellung und Betrieb müssen örtliche Vorgaben und Tierschutz erfüllen", richtig: true },
        { text: "Ein Fallenmelder ersetzt jede Form der Versorgung", richtig: false },
        { text: "Die Bauart allein garantiert einen unverletzten Fang", richtig: false }
      ],
      source: "https://www.jagdverband.de/sites/default/files/2026-05/2026-05_DJV_Fallenjagd_Laenderuebersicht.pdf",
    }
  ];

  const [i,setI]=useState(0);
  const [sel,setSel]=useState(null);
  const [p,setP]=useState(0);
  const [f,setF]=useState(false);

  const courseProgress = useCourseProgress("fallenrecht", {
    started: i > 0 || sel !== null || f,
    answeredQuestions: f ? quiz.length : i + (sel !== null ? 1 : 0),
    totalQuestions: quiz.length,
    score: p,
    completed: f || (i === quiz.length - 1 && sel !== null),
  });
  const q=quiz[i];

  function choose(a){
    if(sel!==null) return;
    setSel(a);
    if(q.antworten[a].richtig) setP(p+1);
    setTimeout(()=>{
      if(i+1<quiz.length){
        setI(i+1);setSel(null);
      } else setF(true);
    },900)
  }

  return(
    <div style={{
      maxWidth:800,margin:"40px auto",padding:24,background:"white",
      borderRadius:12,boxShadow:"0 4px 14px rgba(0,0,0,0.1)"
    }}>
      <h1 style={{fontSize:32,marginBottom:15}}>⚖️ Fallenrecht kompakt</h1>

      <p style={{fontSize:18,marginBottom:25}}>
        Fallenrecht regelt den Einsatz von Lebend- und Totschlagfallen.
        Wichtig sind tierschutzgerechte Bauarten, tägliche Kontrolle und 
        sachkundige Anwendung. Verbotene Fallen dürfen nicht genutzt werden.
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
          <h3 style={{fontSize:24}}>🎉 Gesetzeskundig!</h3>
          <p>Du hast {p} von {quiz.length} Fragen richtig.</p>
        </>
      )}
      <CourseProgressNotice courseId="fallenrecht" {...courseProgress} />
    </div>
  );
}
