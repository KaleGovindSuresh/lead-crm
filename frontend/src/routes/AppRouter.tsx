import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePermissions } from "../hooks/usePermissions";
import { PageLoader } from "../components/UI/Spinner";
import { AppLayout } from "../components/Layout/AppLayout";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { LeadsListPage } from "../pages/LeadsListPage";
import { LeadCreatePage } from "../pages/LeadCreatePage";
import { LeadEditPage } from "../pages/LeadEditPage";
import { DashboardPage } from "../pages/DashboardPage";
import { NotificationsPage } from "../pages/NotificationsPage";
import { UsersPage } from "../pages/UsersPage";
import type { Permission } from "../types";

// ── Guards ────────────────────────────────────────────────────────────────────

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isBootstrapping } = useAuth();
  if (isBootstrapping) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const RequirePermission = ({
  permission,
  children,
}: {
  permission: Permission;
  children: React.ReactNode;
}) => {
  const { can } = usePermissions();
  if (!can(permission)) return <Navigate to="/leads" replace />;
  return <>{children}</>;
};

const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin } = usePermissions();
  if (!isAdmin()) return <Navigate to="/leads" replace />;
  return <>{children}</>;
};

// ── Public route: redirect if already authenticated ───────────────────────────

const PublicOnly = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isBootstrapping } = useAuth();
  if (isBootstrapping) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/leads" replace />;
  return <>{children}</>;
};

// ── Router ────────────────────────────────────────────────────────────────────

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      {/* Public */}
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

      {/* Protected */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        {/* Default redirect */}
        <Route index element={<Navigate to="/leads" replace />} />

        {/* Leads */}
        <Route path="/leads" element={<LeadsListPage />} />
        <Route
          path="/leads/new"
          element={
            <RequirePermission permission="lead:write">
              <LeadCreatePage />
            </RequirePermission>
          }
        />
        <Route
          path="/leads/:id/edit"
          element={
            <RequirePermission permission="lead:write">
              <LeadEditPage />
            </RequirePermission>
          }
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <RequirePermission permission="dashboard:read">
              <DashboardPage />
            </RequirePermission>
          }
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={
            <RequirePermission permission="notification:read">
              <NotificationsPage />
            </RequirePermission>
          }
        />

        {/* Admin: users */}
        <Route
          path="/users"
          element={
            <RequireAdmin>
              <UsersPage />
            </RequireAdmin>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/leads" replace />} />
    </Routes>
  </BrowserRouter>
);
