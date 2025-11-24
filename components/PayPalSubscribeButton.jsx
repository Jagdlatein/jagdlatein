"use client";
import { useEffect } from "react";

export default function PayPalSubscribeButton() {
  useEffect(() => {
    // PayPal SDK laden
    const script = document.createElement("script");
    script.src =
      "https://www.paypal.com/sdk/js?client-id=AQx7R9V-b-x8NJmvXUkRrJ-Js68jqMq3udNpdVmONZrpS0y6zpUj5QMIAiunCQDCTPpwmiKFaJJybJBW&vault=true&intent=subscription&currency=EUR";
    script.async = true;
    script.onload = () => {
      if (window.paypal) {
        window.paypal
          .Buttons({
            style: {
              shape: "rect",
              color: "gold",
              layout: "vertical",
              label: "subscribe",
            },
            createSubscription(data, actions) {
              return actions.subscription.create({
                plan_id: "P-9XU38461YG7706134NESJQWA",
              });
            },
            onApprove(data) {
              alert("Danke! Dein Premium wurde aktiviert.");
            },
          })
          .render("#paypal-subscribe-button");
      }
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div id="paypal-subscribe-button" style={{ width: "100%", marginTop: "20px" }}></div>
  );
}
