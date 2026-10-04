import { useRef, useState } from "react";
import WildlifePortraitLayout from "../../components/WildlifePortraitLayout";
import { dachWildlife, dachWildlifeBySlug, legacyWildlifeSlugs } from "../../lib/dach-wildlife";
import styles from "../../styles/LearningExperience.module.css";

const comparisonSlugs = {
  elchwild:["rotwild","damwild"],wisent:["elchwild","schwarzwild"],wolf:["goldschakal","fuchs"],goldschakal:["wolf","fuchs"],mink:["iltis","fischotter"],fischotter:["mink","nutria"],braunbaer:["dachs","wolf"],seehund:["fischotter","biber"],murmeltier:["biber","nutria"],
  haselhuhn:["rebhuhn","steinhuhn"],steinhuhn:["haselhuhn","rebhuhn"],wachtel:["rebhuhn","haselhuhn"],wildtruthuhn:["fasan","auerhuhn"],rackelwild:["auerhuhn","birkhuhn"],
  schnatterente:["stockente","pfeifente"],loeffelente:["stockente","spiessente"],knaekente:["krickente","schnatterente"],schellente:["reiherente","bergente"],bergente:["reiherente","schellente"],eiderente:["samtente","trauerente"],eisente:["spiessente","schellente"],samtente:["trauerente","eiderente"],trauerente:["samtente","eiderente"],kolbenente:["tafelente","reiherente"],moorente:["tafelente","reiherente"],mandarinente:["kolbenente","stockente"],
  blessgans:["zwerggans","graugans"],saatgans:["kurzschnabelgans","graugans"],kurzschnabelgans:["saatgans","blessgans"],ringelgans:["weisswangengans","kanadagans"],weisswangengans:["ringelgans","kanadagans"],zwerggans:["blessgans","saatgans"],rostgans:["brandgans","nilgans"],brandgans:["rostgans","nilgans"],hoeckerschwan:["graugans","kanadagans"],
  waldschnepfe:["bekassine","blaesshuhn"],bekassine:["waldschnepfe","blaesshuhn"],blaesshuhn:["haubentaucher","stockente"],haubentaucher:["gaensesaeger","kormoran"],kormoran:["graureiher","gaensesaeger"],graureiher:["kormoran","haubentaucher"],
  kolkrabe:["rabenkraehe","saatkraehe"],saatkraehe:["rabenkraehe","kolkrabe"],turteltaube:["tuerkentaube","hohltaube"],"verwilderte-haustaube":["hohltaube","ringeltaube"],wacholderdrossel:["amsel","kuckuck"],
  lachmoewe:["sturmmoewe","silbermoewe"],sturmmoewe:["lachmoewe","silbermoewe"],silbermoewe:["heringsmoewe","mantelmoewe"],mantelmoewe:["silbermoewe","heringsmoewe"],heringsmoewe:["silbermoewe","mantelmoewe"],mittelmeermoewe:["silbermoewe","mantelmoewe"],
  gaensesaeger:["mittelsaeger","zwergsaeger"],mittelsaeger:["gaensesaeger","zwergsaeger"],zwergsaeger:["gaensesaeger","schellente"],waldkauz:["kuckuck","kolkrabe"],amsel:["wacholderdrossel","kuckuck"],kuckuck:["waldkauz","wacholderdrossel"],"verwilderte-hauskatze":["wildkatze","mink"],
};

export default function ExpandedWildlifePortrait({ species }) {
  return <WildlifePortraitContent key={species.slug} species={species} />;
}

function WildlifePortraitContent({ species }) {
  const [answers, setAnswers] = useState({});
  const currentAnswers = useRef(answers);
  const alternatives = (comparisonSlugs[species.slug] || dachWildlife.filter(value => value.group === species.group && value.slug !== species.slug).map(value => value.slug)).slice(0,2).map(slug => dachWildlifeBySlug[slug]);
  const correctPosition = species.slug.length % 3;
  const identifyingChoices = alternatives.map(value => value.identification);
  identifyingChoices.splice(correctPosition,0,species.identification);
  const questions = [
    {question:`Welche Beschreibung passt am genauesten zu ${species.name}?`,choices:identifyingChoices,correct:correctPosition,explanation:`${species.identification} ${species.confusion} Die anderen Beschreibungen gehören zu ${alternatives.map(value => value.name).join(" und ")}.`},
    {question:"Eine Art steht im jagdrechtlichen Artenverzeichnis. Was muss vor einer Bejagung zusätzlich geklärt werden?",choices:["Die Nennung im Artenverzeichnis genügt auch dann, wenn keine Jagdzeit festgelegt ist.","Die Jagdzeit eines Nachbarlandes genügt als Freigabe am eigenen Jagdort.","Die örtlichen Jagd- und Schonzeiten, die Revierfreigabe und gegebenenfalls besondere Genehmigungen."],correct:2,explanation:"Artenkenntnis und Jagdstatus beantworten unterschiedliche Fragen. Artenverzeichnis, Jagd- und Schonzeit, Revierfreigabe, Abschussplan und gegebenenfalls behördliche Anordnung gehören zur rechtlichen Prüfung."},
  ];
  function answer(index, choice) {
    if (currentAnswers.current !== answers || answers[index] !== undefined || !Number.isInteger(choice) || !questions[index]?.choices[choice]) return;
    const next = {...answers,[index]:choice}; currentAnswers.current = next; setAnswers(next);
  }
  function restart() { const next = {}; currentAnswers.current = next; setAnswers(next); }
  return <WildlifePortraitLayout slug={species.slug} title={`${species.name} (${species.scientificName})`} subtitle={species.identification}>
    <section className={styles.panel}><h2>Die Art erkennen</h2><p>{species.identification}</p>{species.slug === "rackelwild" && <p className={styles.note}>Rackelwild ist eine Kreuzung von Auer- und Birkhuhn. Es wird im Atlas als jagdrechtlich relevanter Hybrid geführt und nicht als zusätzliche Tierart gezählt.</p>}<h3>Verwechslungen sicher vermeiden</h3><p>{species.confusion}</p></section>
    <section className={styles.panel}><h2>Lebensraum und Lebensweise</h2><p>{species.habitat}</p><h3>Stimme und andere Geräusche</h3><p>{species.voice}</p><p className={styles.muted}>Die geprüften Originalaufnahmen stehen im Stimmenabschnitt dieses Porträts. Wo eine solche Aufnahme fehlt, wird die Lücke angezeigt.</p></section>
    <section className={styles.panel}><h2>Wissen überprüfen</h2>{questions.map((question,index) => <article key={question.question}><h3>{question.question}</h3><div className={styles.choices}>{question.choices.map((choice,choiceIndex) => <button key={choice} disabled={answers[index] !== undefined} className={`${styles.choice} ${answers[index] !== undefined && choiceIndex === question.correct ? styles.correct : answers[index] === choiceIndex ? styles.wrong : ""}`} onClick={() => answer(index,choiceIndex)}>{choice}</button>)}</div>{answers[index] !== undefined && <p className={styles.feedback} role="status"><strong>{answers[index] === question.correct ? "Richtig." : "Noch nicht richtig."}</strong> {question.explanation}</p>}</article>)}<button className={styles.secondary} onClick={restart}>Noch einmal üben</button></section>
    <section className={styles.panel}><h2>Biologiequellen</h2><p>Eigene Lernzusammenfassung, Quellen geprüft am 4. Oktober 2026.</p><ul>{species.biologySources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul></section>
  </WildlifePortraitLayout>;
}

export function getStaticPaths() {return {paths:dachWildlife.filter(species => !legacyWildlifeSlugs.includes(species.slug)).map(species => ({params:{art:species.slug}})),fallback:false};}
export function getStaticProps({params}) {const species=dachWildlifeBySlug[params.art];return species && !legacyWildlifeSlugs.includes(species.slug) ? {props:{species}} : {notFound:true};}
