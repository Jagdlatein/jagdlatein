"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect } from "react";

// 🟩 RICHTIGER CLIENT für Realtime
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    realtime: {
      params: {
        eventsPerSecond: 5,
      },
    },
  }
);

export function useLiveLeaderboard(onUpdate) {
  useEffect(() => {
    // 🟩 Auf UPDATE + INSERT hören
    const channel = supabase
      .channel("quiz_scores_live")
      .on(
        "postgres_changes",
        {
          event: "*",  // insert / update / delete
          schema: "public",
          table: "quiz_scores",
        },
        (payload) => {
          console.log("LIVE UPDATE", payload);
          onUpdate();
        }
      )
      .subscribe((status) => console.log("STATUS:", status));

    // 🟩 Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);
}
