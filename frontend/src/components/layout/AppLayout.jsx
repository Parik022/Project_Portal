import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Bell, LogOut } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { navFor, NAV_ITEMS } from "./navItems";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import api, { IS_DEMO } from "@/lib/api";
import { DemoBanner } from "@/demo/DemoBanner";

function getInitials(name) {
  return (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Unread count, refreshed on navigation and every minute.
function useUnreadCount(pathname) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    const load = () =>
      api
        .get("/notifications?limit=1")
        .then((res) => active && setCount(res.data.unreadCount))
        .catch(() => {});
    load();
    const timer = setInterval(load, 60_000);
    window.addEventListener("notifications:changed", load);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("notifications:changed", load);
    };
  }, [pathname]);
  return count;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const pageTitle = NAV_ITEMS.find((item) => pathname.startsWith(item.to))?.label || "Portal";
  const unread = useUnreadCount(pathname);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        {IS_DEMO && <DemoBanner />}
        <header className="sticky top-0 z-10 border-b border-border/80 bg-card/90 backdrop-blur-md supports-[backdrop-filter]:bg-card/75">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <img src="/srm-logo-seal-sm.png" alt="" className="h-8 w-8 md:hidden" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted">SRMIST · ProjectFlow</p>
                <p className="text-base font-semibold text-foreground">{pageTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-accent-soft hover:text-primary"
                aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
              >
                <Bell className="h-[18px] w-[18px]" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted">{ROLE_LABELS[user?.role]}</p>
              </div>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white ring-2 ring-accent-soft ring-offset-1"
                title={user?.email}
              >
                {getInitials(user?.name)}
              </div>
              <button
                type="button"
                onClick={logout}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-accent-soft hover:text-primary md:hidden"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Mobile navigation: the sidebar is hidden below md */}
          <nav className="flex gap-1 overflow-x-auto border-t border-border/60 px-3 py-2 md:hidden">
            {navFor(user?.role).map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                    isActive ? "bg-primary text-white" : "text-muted hover:bg-accent-soft"
                  )
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </NavLink>
            ))}
          </nav>
        </header>
        <div className="page-shell flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
