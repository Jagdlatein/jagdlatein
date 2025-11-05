// components/Layout.js
import Header from "./Header";

export default function Layout({ children }) {
  return (
    <>
      <Header />
      {children}
      <footer className="jl-footer">
        <div className="inner">
          <div className="left">
            © {new Date().getFullYear()} Jagdlatein – Von Jägern. Für Jäger.
          </div>
          <nav className="links">
            <a href="/impressum">Impressum</a>
            <span>·</span>
            <a href="/datenschutz">Datenschutz</a>
          </nav>
        </div>
      </footer>

      <style jsx>{`
        .jl-footer {
          border-top: 1px solid #e6eee6; background: #fafaf7;
        }
        .inner {
          max-width: 1100px; margin: 0 auto; padding: 18px 14px;
          display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between;
          color: #46514a;
        }
        .links { display: inline-flex; gap: 10px; align-items: center; }
        .links :global(a) { color: #1b1d1f; text-decoration: none; }
        .links :global(a:hover) { text-decoration: underline; }
      `}</style>
    </>
  );
}
