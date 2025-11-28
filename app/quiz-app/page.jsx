"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QuizIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/quiz-app/run");
  }, []);

  return <div>Lädt…</div>;
}
