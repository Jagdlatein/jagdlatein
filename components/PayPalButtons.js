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
      console.error("PayPal: NEXT_PUBLIC_PAYPAL_CLIENT_ID fehlt");
      return;
    }

    if (typeof window === "undefined") return;

    // PayPal SDK bereits geladen?
    if (window.paypal) {
      setSdkReady(true);
      setMsg("");
      return;
    }

    // Hosted Buttons Script laden
    const params = new URLSearchParams({
      "client-id": clientId,
      currency,
      components: "hosted-buttons",
      "disable-funding": "venmo",
    }).toString();

    const src = `https://www.paypal.com/sdk/js?${params}`;
    console.log("Lade PayPal SDK:", src);

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      console.log("PayPal SDK geladen");
      setSdkReady(true);
      setMsg("");
    };
    script.onerror = (e) => {
      console.error("PayPal SDK load error", e);
      setMsg("PayPal-SDK konnte nicht geladen werden. Bitte erneut versuchen.");
    };

    document.body.appendChild(script);
  }, [clientId, currency]);

  useEffect(() => {
    if (!sdkReady || !window.paypal || !mountRef.current) return;

    window.paypal
      .HostedButtons({
        hostedButtonId: "WBPRVVCEQ8HU8", // <<< deine Button-ID
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
