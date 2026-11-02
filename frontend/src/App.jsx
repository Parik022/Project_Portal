import { BrowserRouter, MemoryRouter, Navigate, Route, Routes } from "react-router-dom";
import { IS_DEMO } from "@/lib/api";

// The demo runs inside a hosted frame, so it keeps navigation in memory.
const Router = IS_DEMO ? MemoryRouter : BrowserRouter;
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import TeamsPage from "@/pages/TeamsPage";
import SubmissionsPage from "@/pages/SubmissionsPage";
import AttendancePage from "@/pages/AttendancePage";
import SettingsPage from "@/pages/SettingsPage";
import UsersPage from "@/pages/UsersPage";
import NotificationsPage from "@/pages/NotificationsPage";

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnly>
                <LoginPage />
              </PublicOnly>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnly>
                <RegisterPage />
              </PublicOnly>
            }
          />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/submissions" element={<SubmissionsPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route element={<ProtectedRoute roles={["ADMIN", "HOD"]} />}>
                <Route path="/users" element={<UsersPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
