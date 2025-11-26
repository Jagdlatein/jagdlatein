"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function useLiveLeaderboard(onUpdate) {
  useEffect(() => {
    const channel = supabase
      .channel("quiz_scores_live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_scores",
        },
        (payload) => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);
}
