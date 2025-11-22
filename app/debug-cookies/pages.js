"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";

export default function DebugCookiesPage() {
  const [clientCookies, setClientCookies] = useState("");

  useEffect(() => {
    setClientCookies(document.cookie);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Cookie Debug</h1>
      <pre>{clientCookies || "Keine Cookies gefunden"}</pre>
    </div>
  );
}
