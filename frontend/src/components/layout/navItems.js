import { LayoutDashboard, FolderKanban, Users, FileText, CalendarCheck, Settings, Bell, ShieldCheck } from "lucide-react";

// Each item lists the roles that see it.
export const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["STUDENT", "FACULTY", "HOD", "ADMIN"] },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck, roles: ["STUDENT", "FACULTY", "HOD", "ADMIN"] },
  { to: "/submissions", label: "Weekly Reports", icon: FileText, roles: ["STUDENT", "FACULTY", "HOD", "ADMIN"] },
  { to: "/projects", label: "Projects", icon: FolderKanban, roles: ["STUDENT", "FACULTY", "HOD", "ADMIN"] },
  { to: "/teams", label: "Teams", icon: Users, roles: ["STUDENT", "FACULTY", "HOD", "ADMIN"] },
  { to: "/users", label: "Users", icon: ShieldCheck, roles: ["HOD", "ADMIN"] },
  { to: "/notifications", label: "Notifications", icon: Bell, roles: ["STUDENT", "FACULTY", "HOD", "ADMIN"] },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["STUDENT", "FACULTY", "HOD", "ADMIN"] },
];

export const navFor = (role) => NAV_ITEMS.filter((item) => item.roles.includes(role));
