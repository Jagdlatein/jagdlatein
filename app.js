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

  function safeJsonParse(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  function safeSetItem(key, value) {
    try {
      if (window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch (e) {}
  }

  async function handleLogin(event) {
    event.preventDefault();

    const email = (emailInput.value || '').trim();
    if (!email) {
      showMessage('Bitte gib deine E-Mail-Adresse ein.', 'error');
      return;
    }

    if (!email.includes('@')) {
      showMessage('Diese E-Mail-Adresse sieht nicht gültig aus.', 'error');
      return;
    }

    setLoading(true);
    showMessage('');

    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const rawText = await response.text();
      const data = safeJsonParse(rawText);

      if (!data) {
        showMessage(
          'Technisches Problem: Ungültige Server-Antwort.',
          'error'
        );
        return;
      }

      if (!response.ok || data.success === false) {
        const msg =
          (data && data.message) ||
          'Login fehlgeschlagen. Bitte prüfe deine E-Mail-Adresse.';

        showMessage(msg, 'error');
        return;
      }

      if (data.token) {
        safeSetItem('jagdlatein_auth_token', data.token);
      }

      showMessage('Erfolgreich eingeloggt. Du wirst weitergeleitet…', 'success');

      setTimeout(function () {
        window.location.href = '/quiz';
      }, 800);
    } catch (err) {
      showMessage(
        'Keine Verbindung zum Server. Bitte versuche es später erneut.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }

  // 🔥 NEUER KORREKTER LOGOUT (funktioniert mit HttpOnly-Cookies)
  async function handleLogout() {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      showMessage("Du wurdest abgemeldet.", "success");
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (e) {
      console.error("Logout fehlgeschlagen:", e);
      showMessage("Logout fehlgeschlagen.", "error");
    }
  }

  if (form) form.addEventListener('submit', handleLogin);
  if (logoutButton) logoutButton.addEventListener('click', handleLogout);
})();

export default function App({ Component, pageProps }) {
  return (
    <div className="app-wrapper">

      {/* HEADER */}
      <header className="navbar">
        <a href="/" className="logo">Jagdlatein Die Lernplattform</a>
      </header>

      {/* CONTENT */}
      <main className="content-area">
        <Component {...pageProps} />
      </main>

    </div>
  );
}
