async function handleLogin(e) {
  e.preventDefault();
  const email = emailInput.trim().toLowerCase();
  if (!email) return alert("Bitte E-Mail eingeben");

  const r = await fetch("/api/auth/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await r.json();
  console.log("LOGIN CHECK RESULT:", data);

  if (data.ok && data.hasAccess) {
    localStorage.setItem("jl_email", email);
    window.location.href = "/quiz";
  } else {
    alert("Kein Zugang mit dieser E-Mail. Zahlung erkannt? Falls ja: Force Reload.");
  }
}
