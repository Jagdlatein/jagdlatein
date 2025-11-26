export const dynamic = "force-dynamic";
export const revalidate = 0;


import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UsernamePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  // Client-side check
  useEffect(() => {
    const saved = window.localStorage.getItem("jagd_username");

    if (saved) {
      router.replace("/quiz/run");
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, fontSize: 26 }}>Lade...</div>
    );
  }

  function save() {
    if (!name.trim()) return;
    window.localStorage.setItem("jagd_username", name.trim());
    router.replace("/quiz/run");
  }

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "40px auto",
        padding: 20,
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ fontSize: 30, marginBottom: 20 }}>
        Dein Jagdname
      </h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="z.B. Bergjäger"
        style={{
          width: "100%",
          fontSize: 18,
          padding: "12px 14px",
          borderRadius: 10,
          border: "1px solid #ccc",
          marginBottom: 20,
        }}
      />

      <button
        onClick={save}
        style={{
          width: "100%",
          background: "#136f39",
          color: "white",
          padding: "14px",
          borderRadius: 12,
          fontSize: 18,
          border: 0,
          cursor: "pointer",
        }}
      >
        Speichern & weiter
      </button>
    </div>
  );
}
