// app/quiz/run/page.jsx
import QuizClient from "./QuizClient";

export const metadata = {
  title: "Jagdquiz | Jagdlatein",
};

export default function QuizPage() {
  return (
    <div style={{ padding: 0, margin: 0 }}>
      <QuizClient />
    </div>
  );
}
