// ---------- SUPABASE LOGIN SYSTEM ----------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔥 Deine echten Projekt-Keys
const supabase = createClient(
  "https://tjbcmhhwazioyosvrezo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYmNtaGh3YXppb3lvc3ZyZXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzY1NDksImV4cCI6MjA3ODExMjU0OX0.7CD1_aqUgR8Br_wTx0l8hADupQYdk8JhHHcJeiAmNOE"
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

  // 🔥 LOGIN via Supabase Magic Link
  async function handleLogin(e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      showMessage("Bitte E-Mail eingeben.", "error");
      return;
    }
    if (!email.includes("@")) {
      showMessage("Ungültige E-Mail-Adresse.", "error");
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
      "Der Login-Link wurde an deine E-Mail gesendet. Bitte Posteingang prüfen!",
      "success"
    );
  }

  // 🔥 LOGOUT
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
