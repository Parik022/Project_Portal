import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  CalendarCheck,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/teams", label: "Teams", icon: Users },
  { to: "/submissions", label: "Weekly Reports", icon: FileText },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden h-screen w-[17.5rem] shrink-0 flex-col border-r border-border bg-card shadow-[2px_0_24px_rgba(1,70,148,0.04)] md:flex">
      <div className="border-b border-border/80 bg-white px-5 py-5">
        <img
          src="/srm-logo-full.png"
          alt="SRM Institute of Science and Technology"
          className="h-auto w-full max-h-[64px] object-contain object-left"
        />
        <div className="mt-3 flex items-center gap-2">
          <span className="h-px flex-1 bg-gradient-to-r from-gold/60 to-transparent" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            Project Portal
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 bg-sidebar p-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted/90">
          Menu
        </p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-white/12 text-white shadow-sm"
                  : "text-sidebar-muted hover:bg-white/8 hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gold" />
                )}
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    isActive ? "text-gold" : "text-sidebar-muted group-hover:text-white"
                  )}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 bg-sidebar p-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="mt-0.5 truncate text-xs text-sidebar-muted">{user?.email}</p>
          <span className="mt-2.5 inline-flex rounded-md bg-gold/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
            {user?.role}
          </span>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-2.5 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium text-sidebar-muted transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
