import { Suspense } from "react";
import QuizClient from "./QuizClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Lade Quiz…</div>}>
      <QuizClient />
    </Suspense>
  );
}
