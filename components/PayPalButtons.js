// /components/PayPalButtons.js
import { useEffect, useRef, useState } from "react";

export default function PayPalButtons({ tier = "monthly" }) {
  const mountRef = useRef(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [msg, setMsg] = useState("PayPal lädt …");

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
  const currency = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "EUR";

  useEffect(() => {
    // Diagnose
    if (!clientId) {
      setMsg("PayPal ist nicht konfiguriert (Client-ID fehlt).");
      console.error("PayPal: NEXT_PUBLIC_PAYPAL_CLIENT_ID fehlt");
      return;
    }

    // SDK nur einmal laden
    if (window.paypal) { setSdkReady(true); setMsg(""); return; }

    const params = new URLSearchParams({
      "client-id": clientId,
      currency,
      intent: "capture",
      components: "buttons",
      commit: "true",
    }).toString();

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?${params}`;
    script.async = true;
    script.onload = () => { setSdkReady(true); setMsg(""); };
    script.onerror = () => {
      setMsg("PayPal-SDK konnte nicht geladen werden.");
      console.error("PayPal SDK load error");
    };
    document.body.appendChild(script);
  }, [clientId, currency]);

  useEffect(() => {
    if (!sdkReady || !window.paypal || !mountRef.current) return;

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
          setMsg("PayPal konnte nicht gestartet werden.");
          throw new Error("create-order failed");
        }
        return data.id;
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
            setMsg("PayPal-Zahlung konnte nicht abgeschlossen werden.");
            return;
          }
          window.location.href = "/success?provider=paypal";
        } catch (e) {
          console.error(e);
          setMsg("Unerwarteter PayPal-Fehler.");
        }
      },
      onCancel: () => (window.location.href = "/preise?canceled=1"),
      onError: (err) => {
        console.error("paypal onError:", err);
        setMsg("PayPal-Fehler – bitte erneut versuchen.");
      },
    }).render(mountRef.current);
  }, [sdkReady, tier]);

  // Sichtbarer Platzhalter / Diagnose
  return (
    <div style={{ minWidth: 260 }}>
      {msg && (
        <div style={{
          fontSize: 13, color: "#6b7280", marginBottom: 8,
          padding: "6px 8px", border: "1px dashed #d1d5db", borderRadius: 8
        }}>
          {msg}
        </div>
      )}
      <div ref={mountRef} />
    </div>
  );
}
