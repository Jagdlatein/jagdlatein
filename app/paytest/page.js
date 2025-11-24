"use client";

import { useState } from "react";

export default function PayTestPage() {
  const [result, setResult] = useState("");

  async function sendTest() {
    setResult("Sende Webhook…");

    const payload = {
      event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
      resource: {
        subscriber: {
          email_address: "testpremium@jagdlatein.de",
        },
      },
    };

    try {
      const res = await fetch("/api/paypal/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult("Fehler: " + err.toString());
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>PayPal Webhook Test</h1>
      <p>Hier kannst du deinen Webhook direkt testen.</p>

      <button
        onClick={sendTest}
        style={{
          marginTop: "20px",
          padding: "12px 20px",
          background: "#0a7f0a",
          color: "white",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
        }}
      >
        Webhook testen
      </button>

      {result && (
        <pre
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#222",
            color: "#0f0",
            borderRadius: "6px",
            whiteSpace: "pre-wrap",
            fontSize: "14px",
          }}
        >
          {result}
        </pre>
      )}
    </div>
  );
}
