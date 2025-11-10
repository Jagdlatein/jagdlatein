export default function Header() {
  function logout() {
    ["jl_session", "jl_paid", "jl_email", "jl_admin"].forEach(name => {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    });
    window.location.href = "/login";
  }

  return (
    <header className="flex justify-between p-4 bg-green-900 text-white">
      <h1 className="font-bold text-lg">Jagdlatein</h1>
      <button
        onClick={logout}
        className="bg-white text-green-900 px-4 py-2 rounded-lg font-semibold"
      >
        Logout
      </button>
    </header>
  );
}
