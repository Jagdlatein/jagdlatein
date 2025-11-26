"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QuizIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/quiz/run");
  }, []);

  // Wichtig: wir müssen etwas rendern
  return <div>Lade Quiz…</div>;
}
