"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function QuizLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    // wenn user direkt /quiz öffnet → sofort weiter
    if (window.location.pathname === "/quiz") {
      router.replace("/quiz/run");
    }
  }, []);

  return <>{children}</>;
}
