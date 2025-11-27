"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

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

export function useLiveSync(onChange) {
  useEffect(() => {
    const username = localStorage.getItem("jagd_username");
    if (!username) return;

    // 🟩 Live-Updates anhören
    const channel = supabase
      .channel("sync_scores")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_scores",
          filter: `username=eq.${username}`,
        },
        () => {
          console.log("=> LIVE UPDATE für", username);
          onChange();
        }
      )
      .subscribe();

    // 🟩 Zusätzlich: Auto-Refresh alle 10 Sekunden (falls Realtime hängt)
    const interval = setInterval(onChange, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [onChange]);
}
