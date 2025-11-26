"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const QuizClient = dynamic(() => import("./QuizClient"), { ssr: false });

export default function QuizRunPage() {
  const router = useRouter();

  useEffect(() => {
    const u = localStorage.getItem("jagd_username");
    if (!u) router.replace("/quiz/username");
  }, []);

  return <QuizClient />;
}
