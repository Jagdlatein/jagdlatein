'use client';
import { useEffect, useRef, useState } from "react";

export default function PayPalButtons({ tier = "monthly" }) {
  const ref = useRef(null);
  const [sdkReady, setSdkReady] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""; // LIVE ODER SANDBOX – aber immer passend zur API
  const currency = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "EUR";

  useEffect(() => {
    // SDK nur einmal hinzufügen
    if (window.paypal) { setSdkReady(true); return; }

    if (!clientId) {
      console.error("PayPal: NEXT_PUBLIC_PAYPAL_CLIENT_ID fehlt");
      return;
    }

    const script = document.createElement("script");
    const params = new URLSearchParams({
      "client-id": clientId,
      currency,
      intent: "capture",
      components: "buttons",
      commit: "true",
    }).toString();
    script.src = `https://www.paypal.com/sdk/js?${params}`;
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => console.error("PayPal SDK konnte nicht geladen werden");
    document.body.appendChild(script);
  }, [clientId, currency]);

  useEffect(() => {
    if (!sdkReady || !window.paypal || !ref.current) return;

    window.paypal.Buttons({
      style: { layout: "horizontal", color: "gold", shape: "rect", label: "paypal", height: 40 },
      createOrder: async () => {
        const res = await fetch("/api/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier }),
        });
        const data = await res.json();
        if (!res.ok || !data?.id) {
          console.error("create-order error:", data);
          alert("PayPal konnte nicht gestartet werden. Bitte später erneut versuchen.");
          throw new Error("create-order failed");
        }
        return data.id; // <- sehr wichtig
      },
      onApprove: async (data) => {
        try {
          const res = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderID }),
          });
          const j = await res.json();
          if (!res.ok) {
            console.error("capture error:", j);
            alert("PayPal-Zahlung konnte nicht abgeschlossen werden.");
            return;
          }
          window.location.href = "/success?provider=paypal";
        } catch (e) {
          console.error(e);
          alert("Unerwarteter Fehler bei PayPal.");
        }
      },
      onCancel: () => (window.location.href = "/preise?canceled=1"),
      onError: (err) => {
        console.error("paypal onError:", err);
        alert("PayPal-Fehler – bitte erneut versuchen.");
      },
    }).render(ref.current);
  }, [sdkReady, tier]);

  // Fallback-UI
  if (!clientId) {
    return <div style={{color:"#b91c1c"}}>PayPal ist nicht konfiguriert (Client-ID fehlt).</div>;
  }

  return <div ref={ref} style={{ minWidth: 260 }} />;
}
