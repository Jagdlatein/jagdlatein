"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function useLiveLeaderboard(onChange) {
  useEffect(() => {
    const channel = supabase
      .channel("real-time-scores")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_scores",
        },
        () => {
          onChange(); // 🔥 neu laden
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);
}
