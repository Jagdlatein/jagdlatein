// /components/PayPalButtons.js
import { useEffect, useRef, useState } from "react";

export default function PayPalButtons() {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  useEffect(() => {
    if (!clientId || typeof window === "undefined") return;

    // PayPal SDK bereits geladen?
    if (window.paypal) {
      setReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
    script.async = true;
    script.onload = () => setReady(true);
    document.body.appendChild(script);
  }, [clientId]);

  useEffect(() => {
    if (!ready || !window.paypal || !containerRef.current) return;

    window.paypal.Buttons({
      style: {
        shape: "rect",
        color: "gold",
        layout: "vertical",
        label: "subscribe",
      },

      createSubscription: function (data, actions) {
        return actions.subscription.create({
          plan_id: "P-38V69183FP2658041NEQFIYQ", // deine Plan-ID
        });
      },

      onApprove: function (data) {
        // Weiterleitung auf success — Webhook schaltet frei
        window.location.href = `/success?subscription=${data.subscriptionID}`;
      },

      onError: function (err) {
        console.error("PayPal error:", err);
        alert("PayPal konnte nicht gestartet werden.");
      },

    }).render(containerRef.current);
  }, [ready]);

  return <div id="paypal-button-container" ref={containerRef}></div>;
}
