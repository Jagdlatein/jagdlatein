// ---------- SUPABASE LOGIN SYSTEM ----------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔥 HIER deine echten Keys eintragen
const supabase = createClient(
  "https://YOUR-PROJECT.supabase.co",
  "YOUR-ANON-KEY"
);

(function () {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');
  const messageBox = document.getElementById('message-box');

  function showMessage(text, type) {
    if (!messageBox) return;
    messageBox.textContent = text || '';

    messageBox.classList.remove('message--error', 'message--success');
    if (type === 'error') {
      messageBox.classList.add('message', 'message--error');
    } else if (type === 'success') {
      messageBox.classList.add('message', 'message--success');
    } else {
      messageBox.classList.add('message');
    }

    messageBox.hidden = !text;
  }

  function setLoading(isLoading) {
    if (!loginButton) return;
    loginButton.disabled = isLoading;
    loginButton.textContent = isLoading ? 'Wird geprüft…' : 'Einloggen';
  }

  // 🔥 NEU: LOGIN via Supabase Magic Link
  async function handleLogin(e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      showMessage("Bitte E-Mail eingeben.", "error");
      return;
    }

    setLoading(true);
    showMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/", 
      }
    });

    setLoading(false);

    if (error) {
      showMessage("Login fehlgeschlagen: " + error.message, "error");
      return;
    }

    showMessage(
      "Login-Link wurde an deine E-Mail gesendet. Bitte Posteingang prüfen!",
      "success"
    );
  }

  // 🔥 LOGOUT mit Supabase Auth
  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      showMessage("Du wurdest abgemeldet.", "success");
      setTimeout(() => location.href = "/", 500);
    } catch (err) {
      console.log(err);
      showMessage("Logout fehlgeschlagen.", "error");
    }
  }

  if (form) form.addEventListener("submit", handleLogin);
  if (logoutButton) logoutButton.addEventListener("click", handleLogout);

})();
