import { useEffect, useState } from "react";
import { api } from "./api";
import { useAuth } from "./auth";
import { LanguageSwitch, RoleBadge, Spinner } from "./components/ui";
import { fullName, initials, roleLabel } from "./format";
import { useI18n } from "./i18n";
import { ActivityPage } from "./pages/ActivityPage";
import { HistoryPage } from "./pages/HistoryPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { SendPage } from "./pages/SendPage";
import { UsersPage } from "./pages/UsersPage";
import "./app.css";

const ADMIN_ROUTES = new Set(["/projects", "/users", "/activity", "/profile"]);
const MEMBER_ROUTES = new Set(["/send", "/history", "/profile"]);

function normalizePath(pathname) {
  const path = pathname && pathname !== "/" ? pathname.replace(/\/$/, "") : "/";
  return path || "/";
}

export default function App() {
  const { status, bootError, restore } = useAuth();
  const { t } = useI18n();

  if (status === "loading") {
    return (
      <div className="session-loading" role="status">
        <Spinner />
        <span>{t("Restoring session")}</span>
      </div>
    );
  }

  if (status === "offline") {
    return (
      <div className="session-loading">
        <section className="offline-card">
          <p className="eyebrow">{t("EJAT notifications")}</p>
          <h1>{t("Unable to reach the notification service.")}</h1>
          <p>{bootError ? t(bootError.message) : null}</p>
          <button className="button button-primary" type="button" onClick={() => void restore()}>
            {t("Retry")}
          </button>
        </section>
      </div>
    );
  }

  if (status !== "ready") return <LoginPage />;
  return <Shell />;
}

function Shell() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [pathname, setPathname] = useState(() => normalizePath(window.location.pathname));
  const [search, setSearch] = useState(() => window.location.search);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [online, setOnline] = useState(true);

  const home = user.role === "SUPER_ADMIN" ? "/projects" : "/send";
  const allowed = user.role === "SUPER_ADMIN" ? ADMIN_ROUTES : MEMBER_ROUTES;
  const route = allowed.has(pathname) ? pathname : home;

  useEffect(() => {
    function onPop() {
      setPathname(normalizePath(window.location.pathname));
      setSearch(window.location.search);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (normalizePath(window.location.pathname) !== route) {
      window.history.replaceState({}, "", route);
    }
  }, [route]);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const body = await api("/health", { redirectOnUnauthorized: false });
        if (active) setOnline(body?.status === "ok");
      } catch {
        if (active) setOnline(false);
      }
    }
    void check();
    const id = window.setInterval(() => void check(), 45000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  function navigate(href) {
    const url = new URL(href, window.location.origin);
    window.history.pushState({}, "", `${url.pathname}${url.search}`);
    setPathname(url.pathname);
    setSearch(url.search);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0 });
  }

  const navItems =
    user.role === "SUPER_ADMIN"
      ? [
          { path: "/projects", label: "Projects", symbol: "P" },
          { path: "/users", label: "Users", symbol: "U" },
          { path: "/activity", label: "Activity", symbol: "A" },
        ]
      : [
          { path: "/send", label: "Send", symbol: "S" },
          { path: "/history", label: "History", symbol: "H" },
        ];

  return (
    <div className="app-shell">
      <aside className={`sidebar${mobileNavOpen ? " sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            E
          </span>
          <span>
            <strong>EJAT</strong>
            <small>{t("Notifications")}</small>
          </span>
        </div>

        <nav className="main-nav" aria-label={t("Main navigation")}>
          <p>{t("Workspace")}</p>
          {navItems.map((item) => (
            <button
              type="button"
              key={item.path}
              className={route === item.path ? "active" : ""}
              aria-current={route === item.path ? "page" : undefined}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-symbol" aria-hidden="true">
                {item.symbol}
              </span>
              {t(item.label)}
            </button>
          ))}
        </nav>

        <div className={`sidebar-profile${route === "/profile" ? " active" : ""}`}>
          <button
            type="button"
            className="sidebar-profile-link"
            onClick={() => navigate("/profile")}
            aria-current={route === "/profile" ? "page" : undefined}
            title={t("Open profile")}
          >
            <span className="avatar avatar-inverse" aria-hidden="true">
              {initials(user)}
            </span>
            <span>
              <strong>{fullName(user)}</strong>
              <small>{t(roleLabel(user.role))}</small>
            </span>
          </button>
          <button
            type="button"
            className="sidebar-sign-out"
            onClick={logout}
            aria-label={t("Sign out")}
            title={t("Sign out")}
          >
            <SignOutIcon />
          </button>
        </div>
      </aside>

      {mobileNavOpen ? (
        <button
          className="mobile-backdrop"
          type="button"
          aria-label={t("Close navigation")}
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <div className="app-main">
        <header className="topbar">
          <button
            className="mobile-menu"
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label={t("Open navigation")}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="topbar-context">
            <span className={`connection-dot${online ? "" : " offline"}`} aria-hidden="true" />
            {online ? t("API connected") : t("API unavailable")}
          </div>
          <div className="topbar-user">
            <LanguageSwitch />
            <span className="topbar-email">{user.email}</span>
            <RoleBadge role={user.role} />
          </div>
        </header>

        <main className="page-content">
          {route === "/projects" ? <ProjectsPage navigate={navigate} /> : null}
          {route === "/users" ? <UsersPage /> : null}
          {route === "/activity" ? <ActivityPage search={search} navigate={navigate} /> : null}
          {route === "/send" ? <SendPage navigate={navigate} /> : null}
          {route === "/history" ? <HistoryPage /> : null}
          {route === "/profile" ? <ProfilePage /> : null}
        </main>
      </div>
    </div>
  );
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M6 2.5H3.8A1.3 1.3 0 0 0 2.5 3.8v8.4a1.3 1.3 0 0 0 1.3 1.3H6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M7 8h6.5M11 5.2 13.8 8 11 10.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
