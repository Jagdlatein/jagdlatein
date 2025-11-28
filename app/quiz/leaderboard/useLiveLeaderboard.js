"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useLiveLeaderboard(onChange) {
  useEffect(() => {
    const channel = supabase
      .channel("scores-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_scores",
        },
        (payload) => {
          onChange(); // neu laden
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [onChange]);
}
