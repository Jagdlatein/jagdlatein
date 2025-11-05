import { useEffect, useRef, useState } from "react";

export default function PayPalButtons({ tier = "monthly" }) {
  const containerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const currency = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "EUR";

  // SDK Script laden
  useEffect(() => {
    if (window.paypal) { setLoaded(true); return; }
    const script = document.createElement("script");
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""; // optional nur fürs SDK
    const params = new URLSearchParams({
      "client-id": clientId || "sb", // "sb" für Sandbox ohne Client-ID
      currency,
      intent: "capture",
      components: "buttons",
      commit: "true",
    }).toString();
    script.src = `https://www.paypal.com/sdk/js?${params}`;
    script.async = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
  }, [currency]);

  useEffect(() => {
    if (!loaded || !window.paypal || !containerRef.current) return;

    window.paypal.Buttons({
      style: {
        layout: "horizontal",
        color: "gold",
        shape: "rect",
        label: "paypal",
        height: 40,
      },
      createOrder: async () => {
        const res = await fetch("/api/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "create-order failed");
        return data.id; // orderId
      },
      onApprove: async (data) => {
        // Optional: Nutzer-E-Mail, falls du sie im State hast
        const email = null;
        const res = await fetch("/api/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.orderID, email }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "capture failed");
        // Redirect auf deine Success-Seite
        window.location.href = "/success?provider=paypal";
      },
      onCancel: () => {
        window.location.href = "/preise?canceled=1";
      },
      onError: (err) => {
        console.error(err);
        alert("PayPal-Fehler – bitte erneut versuchen.");
      },
    }).render(containerRef.current);
  }, [loaded, tier]);

  return <div ref={containerRef} />;
}
