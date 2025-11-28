useEffect(() => {
  async function init() {
    const u = localStorage.getItem("jagd_username");
    if (!u) {
      router.replace("/quiz-app/username");
      return;
    }

    // direkt speichern
    setUsername(u);

    // 🔥 User SOFORT registrieren – ohne auf username-State zu warten
    await fetch("/api/quiz/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: u,
        country,
      }),
    });

    // erst jetzt Fragen laden
    const res = await fetch(`/api/questions?country=${country}&topic=${topic}`);
    const data = await res.json();
    setQuestions(data.questions || []);
  }

  init();
}, [router, country, topic]);
