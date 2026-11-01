"use client";
import { usePathname } from "next/navigation";
import ExamProfileBoundary, { requiresExamProfile } from "./ExamProfileBoundary";

export default function AppExamProfileBoundary({ children }) {
  return <ExamProfileBoundary required={requiresExamProfile(usePathname())}>{children}</ExamProfileBoundary>;
}
