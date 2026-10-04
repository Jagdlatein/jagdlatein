"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export function useLiveLeaderboard(onChange) {
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    const supabase = createClient(url, key);
    const channel = supabase
      .channel("real-time-scores")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_scores" },
        () => {
          onChange();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [onChange]);
}
