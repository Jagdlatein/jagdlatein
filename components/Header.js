// components/Header.js
import { useRouter } from "next/router";

export default function Header() {
  const router = useRouter();

  function handleLogout() {
    // Alle relevanten Cookies löschen
    ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach((name) => {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    });

    // Zur Login-Seite leiten
    router.replace("/login");
    setTimeout(() => {
      if (typeof window !== "undefined") window.location.href = "/login";
    }, 500);
  }

  return (
    <header className="flex items-center justify-between bg-green-900 text-white px-4 py-3 shadow-md">
      <h1
        onClick={() => router.push("/quiz")}
        className="text-xl font-bold tracking-wide cursor-pointer hover:text-gray-300"
      >
        Jagdlatein
      </h1>
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/glossar")}
          className="bg-white text-green-900 font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100"
        >
          Glossar
        </button>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
