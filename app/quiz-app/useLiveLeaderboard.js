"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function useLiveLeaderboard(onChange) {
  useEffect(() => {
    console.log("🔧 URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("🔧 ANON:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const channel = supabase
      .channel("real-time-scores")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quiz_scores" },
        () => {
          console.log("📡 Live-Update erkannt!");
          onChange();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [onChange]);
}
