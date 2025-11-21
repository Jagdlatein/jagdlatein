// /components/PayPalButtons.js
import { useEffect, useRef, useState } from "react";

export default function PayPalButtons() {
  const mountRef = useRef(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [msg, setMsg] = useState("PayPal lädt …");

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
  const currency = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "EUR";

  useEffect(() => {
    if (!clientId) {
      setMsg("PayPal ist momentan nicht konfiguriert. Bitte Betreiber kontaktieren.");
      return;
    }

    if (typeof window === "undefined") return;

    if (window.paypal) {
      setSdkReady(true);
      setMsg("");
      return;
    }

    const params = new URLSearchParams({
      "client-id": clientId,
      currency,
      components: "hosted-buttons",
      "disable-funding": "venmo",
    }).toString();

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?${params}`;
    script.async = true;
    script.onload = () => {
      setSdkReady(true);
      setMsg("");
    };
    script.onerror = () => {
      setMsg("PayPal konnte nicht geladen werden.");
    };

    document.body.appendChild(script);
  }, [clientId, currency]);

  useEffect(() => {
    if (!sdkReady || !window.paypal || !mountRef.current) return;

    window.paypal
      .HostedButtons({
        hostedButtonId: "GDPFM87K7X6TJ", // <<< deine neue Hosted Button ID
      })
      .render(mountRef.current);
  }, [sdkReady]);

  return (
    <div style={{ minWidth: 260 }}>
      {msg && (
        <div
          style={{
            fontSize: 13,
            color: "#6b7280",
            marginBottom: 8,
            padding: "6px 8px",
            border: "1px dashed #d1d5db",
            borderRadius: 8,
          }}
        >
          {msg}
        </div>
      )}
      <div ref={mountRef} />
    </div>
  );
}
