import Link from "next/link";
import { examProfileLawHref, normalizeExamProfile } from "../lib/exam-profile";
import styles from "../styles/ExamStudyPlan.module.css";

const internal = value => typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !/[\\\s\u0000-\u001f\u007f]/.test(value);

export function ExamLearningGoal({ goal, profile, goalProgress }) {
  const target = normalizeExamProfile(profile);
  const href = goal.regionalLaw ? target && examProfileLawHref(target) : goal.href;
  const quizHref = goal.regionalLaw ? target && examProfileLawHref(target, "uebung") : goal.quizHref;
  return <li className={styles.examGoal} onFocus={() => goalProgress?.focus?.(goal, true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) goalProgress?.focus?.(goal, false); }}>
    <h4>{goal.title}</h4>
    <p>{goal.task}</p>
    {goal.caseText && <p><strong>Eigener Übungsfall:</strong> {goal.caseText}</p>}
    {goal.followUp && <p><strong>Nachfrage:</strong> {goal.followUp}</p>}
    <p className={styles.goalSelfCheck}><strong>Selbstkontrolle:</strong> {Array.isArray(goal.selfCheck) ? goal.selfCheck.join(" · ") : goal.selfCheck}</p>
    {goalProgress && <label className={styles.goalState}>Mein Stand
      <select aria-label={`${goal.title}: Mein Stand`} value={goalProgress.state(goal)} disabled={!goalProgress.ready} onChange={event => goalProgress.set(goal, event.target.value)}>
        {!goalProgress.ready && <option value="">{target ? "Wird geladen …" : "Prüfungsziel wählen"}</option>}
        <option value="offen">Offen</option><option value="ueben">Üben</option><option value="erklaert">Erklärt</option>
      </select>
    </label>}
    {goalProgress?.retained?.(goal) && <p className={styles.retainedGoal}>Stand geändert. Dieser Eintrag bleibt sichtbar, bis du die Auswahl im Menü erneut anwendest.</p>}
    {internal(href) ? <div className={styles.links}>
      <Link href={href} prefetch={false} aria-label={`${goal.title}: ${goal.regionalLaw ? "Regionales Recht lesen" : goal.lessonPractice ? "Lektion lesen und üben" : "Lektion lesen"}`}>{goal.regionalLaw ? "Regionales Recht" : goal.lessonPractice ? "Lektion lesen & üben" : "Lektion lesen"}</Link>
      {internal(quizHref) && <Link href={quizHref} prefetch={false} aria-label={`${goal.title}: ${goal.regionalLaw ? "Regionale Rechtsfragen" : "Kurscheck"}`}>{goal.regionalLaw ? "Rechtsfragen" : "Kurscheck"}</Link>}
    </div> : goal.regionalLaw && <p>Wähle dein Prüfungsziel im unteren Menü, um das passende Recht zu öffnen.</p>}
    {!goal.regionalLaw && <p className={styles.goalLesson}>{goal.courseTitle} · {goal.lessonTitle}</p>}
    {goal.relatedLessons?.length > 0 && <div className={styles.links}>{goal.relatedLessons.filter(item => internal(item.href)).map(item => <Link key={item.href} href={item.href} prefetch={false}>{item.lessonTitle}</Link>)}</div>}
  </li>;
}

export default function ExamLearningGoals({ category, profile, goalProgress }) {
  if (!category?.goals?.length) return null;
  return <div className={styles.examCategoryGoals}>
    <ol className={styles.examGoalList}>{category.goals.map(goal => <ExamLearningGoal key={goal.id} goal={goal} profile={profile} goalProgress={goalProgress} />)}</ol>
    {category.practiceCase && <div className={styles.examCase}>
      <h4>Übungsfall</h4>
      <p>{category.practiceCase.text}</p>
      <p><strong>Nachfrage:</strong> {category.practiceCase.followUp}</p>
      {internal(category.practiceCase.href) && <Link href={category.practiceCase.href} prefetch={false}>Gespräch zu diesem Fall üben</Link>}
    </div>}
  </div>;
}
