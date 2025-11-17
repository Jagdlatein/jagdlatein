import RequireAccess from "../../components/RequireAccess";
import Seo from "../../components/Seo";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { filterQuestions } from "../../data/questions-full";

function QuizRun() {
  const router = useRouter();
  const country = (router.query.country || "DE").toString().toUpperCase();
  const topic = (router.query.topic || "Alle").toString();

  const items = useMemo(
    () => filterQuestions({ country, topic, count: 10 }),
    [country, topic]
  );

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);

  const total = items.length;
  const current = items[step] || null;

  const handleSelect = (qid, optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: optionId,
    }));
  };

  const handleNext = () => {
    if (!current) return;
    if (step + 1 < total) {
      setStep(step + 1);
    } else {
      setDone(true);
    }
  };

  const handleRestart = () => {
    // Neu laden mit gleicher URL, damit filterQuestions neu mischt
    router.replace(router.asPath);
  };

  const numCorrect = useMemo(() => {
    if (!done) return 0;
    return items.reduce((acc, q) => {
      const picked = answers[q.id];
      const correct = q.correct && q.correct[0];
      return acc + (picked === correct ? 1 : 0);
    }, 0);
  }, [done, items, answers]);

  return (
    <RequireAccess>
      <>
        <Seo title="Quiz starten – Jagdlatein" />
        <section className="page">
          <div className="page-inner" style={{ maxWidth: 720 }}>
            <p className="small" style={{ marginBottom: 8 }}>
              <a href="/quiz">← Zurück zur Übersicht</a>
            </p>

            <h1>Quiz</h1>
            <p className="lead">
              Land: <strong>{country}</strong> · Thema: <strong>{topic}</strong>
            </p>

            {total === 0 && (
              <p>
                Für diese Kombination sind noch keine Fragen eingetragen. Wähle
                bitte ein anderes Thema oder Land.
              </p>
            )}

            {total > 0 && !done && current && (
              <div
                style={{
                  marginTop: 24,
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}
                >
                  Frage {step + 1} von {total}
                </div>
                <h2 style={{ fontSize: 18, marginBottom: 12 }}>{current.q}</h2>

                <div style={{ display: "grid", gap: 8 }}>
                  {current.answers.map((opt) => {
                    const picked = answers[current.id];
                    const isPicked = picked === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelect(current.id
