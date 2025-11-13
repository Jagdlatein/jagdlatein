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

  // Beispiel: Token im LocalStorage speichern (sicher versuchen)
  function safeSetItem(key, value) {
    try {
      if (window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      // Ignorieren – einige Browser/Modi verbieten Storage
    }
  }

  function safeRemoveItem(key) {
    try {
      if (window.localStorage) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      // Ignorieren
    }
  }

  async function handleLogin(event) {
    event.preventDefault();

    const email = (emailInput.value || '').trim();
    if (!email) {
      showMessage('Bitte gib deine E-Mail-Adresse ein.', 'error');
      return;
    }

    // einfache Mail-Prüfung für UX
    if (!email.includes('@')) {
      showMessage('Diese E-Mail-Adresse sieht nicht gültig aus.', 'error');
      return;
    }

    setLoading(true);
    showMessage('');

    try {
      // Hier deine echte Login-URL eintragen
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const rawText = await response.text(); // erst als Text holen
      const data = safeJsonParse(rawText);

      if (!data) {
        console.error('Ungültige JSON-Antwort vom Server:', rawText);
        showMessage(
          'Es gab ein technisches Problem mit der Server-Antwort. Bitte versuche es später noch einmal.',
          'error'
        );
        return;
      }

      // Einheitliches Format erwartet:
      // { success: true, token: '...', message?: '...' }
      if (!response.ok || data.success === false) {
        const msg =
          (data && data.message) ||
          'Login fehlgeschlagen. Bitte prüfe deine E-Mail-Adresse.';

        showMessage(msg, 'error');
        return;
      }

      // Erfolg
      if (data.token) {
        safeSetItem('jagdlatein_auth_token', data.token);
      }

      showMessage('Erfolgreich eingeloggt. Du wirst weitergeleitet…', 'success');

      // Weiterleitung nach kurzer Zeit – URL anpassen
      setTimeout(function () {
        window.location.href = '/quiz';
      }, 800);
    } catch (err) {
      console.error('Netzwerk- oder Fetch-Fehler:', err);
      showMessage(
        'Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung oder versuche es später erneut.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    safeRemoveItem('jagdlatein_auth_token');
    showMessage('Du wurdest abgemeldet.', 'success');
  }

  if (form) {
    form.addEventListener('submit', handleLogin);
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }
})();
