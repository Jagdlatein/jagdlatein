import PracticeLayout from "../../components/PracticeLayout";
import TargetGame from "../../components/TargetGame";
import PracticeStatementRound from "../../components/PracticeStatementRound";
import { getPracticeScenarios } from "../../lib/practice-scenarios";
import styles from "../../styles/TargetGame.module.css";

export function getStaticProps() {
  return { props: { scenarios: getPracticeScenarios("trefferzonen") } };
}

export default function Trefferzonen({ scenarios }) {
  return <PracticeLayout exercise="trefferzonen" description="Ein Minispiel auf virtuellen Scheiben und vorhandene Wissensfälle zu Sicherheit und Beobachtung." headingOnly>
    <TargetGame />
    <details className={styles.learningCases}>
      <summary>Wissen & Sicherheit: {scenarios.length} Aussagen üben</summary>
      <PracticeStatementRound scenarios={scenarios} />
    </details>
  </PracticeLayout>;
}
