"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data) => {
        if (!data.loggedIn) {
          window.location.href = "/login";
        } else {
          setAuth(data);
        }
      });
  }, []);

  if (!auth) return <p>Lade...</p>;

  return (
    <div>
      <h1>Willkommen {auth.email}</h1>
      {auth.paid ? (
        <p>Premium freigeschaltet</p>
      ) : (
        <p>Dein Premium ist nicht aktiv</p>
      )}
    </div>
  );
}
