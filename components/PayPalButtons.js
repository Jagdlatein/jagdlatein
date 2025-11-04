import { useEffect, useRef } from 'react';

export default function PayPalButtons({ plan = 'monthly' }) {
  const ref = useRef(null);

  useEffect(() => {
    const cid = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
    if (!cid) return;
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${cid}&currency=EUR`;
    script.async = true;
    script.onload = () => {
      if (!window.paypal || !ref.current) return;
      window.paypal.Buttons({
        createOrder: async () => {
          const res = await fetch('/api/paypal/create-order', { method: 'POST', body: JSON.stringify({ plan }) });
          const data = await res.json();
          if (!data?.id) throw new Error('PayPal create failed');
          return data.id;
        },
        onApprove: async (data) => {
          const res = await fetch('/api/paypal/capture-order', { method: 'POST', body: JSON.stringify({ orderID: data.orderID }) });
          const out = await res.json();
          if (out?.capture?.status === 'COMPLETED') {
            window.location.href = '/success';
          } else {
            alert('Zahlung nicht abgeschlossen.');
          }
        }
      }).render(ref.current);
    };
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, [plan]);

  return <div ref={ref} />;
}
