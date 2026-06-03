import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/context/AuthContext";

const routeTitles = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/teams": "Teams",
  "/submissions": "Weekly Reports",
  "/attendance": "Attendance",
  "/settings": "Settings",
};

function getInitials(name) {
  return (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AppLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const pageTitle = routeTitles[pathname] || "Portal";

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-border/80 bg-card/90 px-6 py-3.5 backdrop-blur-md supports-[backdrop-filter]:bg-card/75 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted">
                SRMIST · Academia
              </p>
              <p className="text-base font-semibold text-foreground">{pageTitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted">{user?.role}</p>
              </div>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white ring-2 ring-accent-soft ring-offset-1"
                title={user?.email}
              >
                {getInitials(user?.name)}
              </div>
            </div>
          </div>
        </header>
        <div className="page-shell flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
