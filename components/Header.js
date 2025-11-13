/* ===== Header & Navigation ===== */

.header {
  position: sticky;
  top: 0;
  z-index: 1000; /* über allem normalen Content */
  background: linear-gradient(180deg, rgba(241,231,211,.96), rgba(241,231,211,.86));
  border-bottom: 1px solid rgba(42,35,25,.12);
  backdrop-filter: saturate(120%) blur(6px);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 68px;
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  border: none;
  background: transparent;
  padding: 0;
  font-weight: 800;
  letter-spacing: .2px;
}

.brand-title {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand-name {
  font-size: 26px;
  font-weight: 900;
  color: var(--forest);
  letter-spacing: -0.2px;
}

.brand-title small {
  color: var(--muted);
  font-weight: 600;
  font-size: 13px;
  margin-top: -2px;
}

/* Desktop-Menü */
.menu {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-left: auto;
}

.nav-link,
.menu a {
  color: var(--forest);
  font-weight: 700;
  letter-spacing: .2px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: rgba(255,255,255,.4);
  transition:
    background .15s ease,
    color .15s ease,
    border-color .15s ease,
    box-shadow .15s ease;
}

.menu .nav-link:hover {
  background: var(--forest);
  color: #f1e7d3;
  border-color: rgba(31,43,35,.6);
}

/* ===== Hamburger & Mobile-Menü ===== */

.hamburger {
  display: none;                 /* Standard: Desktop */
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(31,43,35,.15);
  background-color: #fff;
  background-image: none;
  position: relative;
  z-index: 1100; /* ÜBER allem (auch Mobile-Menü) */
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,.08);
}

.hamburger span {
  width: 22px;
  height: 2px;
  background: var(--forest);
  border-radius: 2px;
  transition: transform .2s, opacity .2s;
}

/* ☰ → ✕ */
.hamburger.open span:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}
.hamburger.open span:nth-child(2) {
  opacity: 0;
}
.hamburger.open span:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

/* Mobile Menü-Overlay */
.mobile-menu {
  display: none;
  position: fixed;
  z-index: 1050; /* über Content, UNTER Hamburger */
  top: 68px;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20px;
  background: rgba(241,231,211,.97);
  border-top: 1px solid rgba(42,35,25,.12);
  overflow-y: auto;
}

.mobile-menu.open {
  display: block;
}

.mobile-menu a,
.mobile-menu button {
  display: block;
  font-size: 17px;
  font-weight: 700;
  padding: 14px;
  margin-bottom: 8px;
  border-radius: 12px;
  border: 1px solid rgba(31,43,35,0.1);
  background: rgba(255,255,255,.9);
  color: var(--ink);
  text-align: left;
  cursor: pointer;
}

/* Hover */
.mobile-menu a:hover,
.mobile-menu button:hover {
  background: rgba(31,43,35,.12);
}

/* ===== Responsive ===== */

@media (max-width: 780px) {
  .menu {
    display: none;
  }
  .hamburger {
    display: flex;
  }
  .header-inner {
    height: 60px;
  }
  .brand-name {
    font-size: 22px;
  }
  .brand-title small {
    font-size: 12px;
  }
}

@media (min-width: 781px) {
  .mobile-menu {
    display: none !important;
  }
}
