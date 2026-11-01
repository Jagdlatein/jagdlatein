"use client";
import { useSyncExternalStore } from "react";
import { getAccountExamSnapshot, getServerAccountExamSnapshot, subscribeAccountExamProfile } from "../lib/account-exam-profile-client";

export default function useAccountExamProfile() {
  return useSyncExternalStore(subscribeAccountExamProfile, getAccountExamSnapshot, getServerAccountExamSnapshot);
}
