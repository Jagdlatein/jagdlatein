{/* MONAT – Stripe + PayPal (Payment-Link) */}
<div className="plan" style={{
  background:"#fff", border:"1px solid #e6eee6", borderRadius:16, padding:16
}}>
  <h3 style={{margin:"0 0 6px"}}>Monatszugang</h3>
  <p style={{margin:"0 0 10px", color:"#4b5563"}}>10 € / Monat · jederzeit kündbar</p>

  <div style={{display:"flex", gap:12, flexWrap:"wrap", alignItems:"center"}}>
    {/* Stripe Payment Link */}
    <a
      href="https://buy.stripe.com/6oUcN61GxaRcbahgu94Vy00"
      target="_blank" rel="noopener noreferrer"
      style={{
        display:"inline-block", padding:"12px 16px", borderRadius:12,
        background:"#1d4d2b", color:"#fff", textDecoration:"none", fontWeight:600
      }}
    >
      Stripe • 10 €
    </a>

    {/* PayPal Payment-Link (dein Code, in gültiges JSX konvertiert) */}
    <form
      action="https://www.paypal.com/ncp/payment/WBPRVVCEQ8HU8"
      method="post"
      target="_blank"
      style={{display:"inline-grid", justifyItems:"center", alignContent:"start", gap:"0.5rem"}}
    >
      <input className="pp-WBPRVVCEQ8HU8" type="submit" value="Jetzt kaufen" />
      <img
        src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg"
        alt="Karten"
        style={{height:"20px"}}
      />
      <section style={{fontSize:"0.75rem"}}>
        Abgewickelt durch{" "}
        <img
          src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg"
          alt="PayPal"
          style={{height:"0.875rem", verticalAlign:"middle"}}
        />
      </section>

      {/* Button-Styles (nur für diesen Button) */}
      <style jsx>{`
        .pp-WBPRVVCEQ8HU8 {
          text-align: center;
          border: none;
          border-radius: 0.25rem;
          min-width: 11.625rem;
          padding: 0 2rem;
          height: 2.625rem;
          font-weight: bold;
          background-color: #FFD140;
          color: #000000;
          font-family: "Helvetica Neue", Arial, sans-serif;
          font-size: 1rem;
          line-height: 1.25rem;
          cursor: pointer;
        }
      `}</style>
    </form>
  </div>
</div>
