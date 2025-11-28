"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const QuizClient = dynamic(() => import("./QuizClient"), { ssr: false });

export default function QuizRunPage() {
  const router = useRouter();

  useEffect(() => {
    const u = localStorage.getItem("jagd_username");
    const c = localStorage.getItem("jagd_country");

    // Wenn kein Username → zurück zur Username-Seite
    if (!u || !c) {
      router.replace("/quiz-app/username");
    }
  }, []);

  return <QuizClient />;
}
