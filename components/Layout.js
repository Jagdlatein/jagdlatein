<header className="header">
  <div className="container header-inner">
    <a className="brand" href="/" aria-label="Startseite">
      <img
        src="/logo.png"
        alt="Jagdlatein"
        className="logo"
        onError={(e) => { e.currentTarget.src = '/logo.svg'; }}
      />
      <div className="brand-title">
        <span>Jagdlatein</span>
        <small>• Lernplattform</small>
      </div>
    </a>
  </div>
</header>
