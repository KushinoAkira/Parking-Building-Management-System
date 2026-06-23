import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { AdminLayout } from "./components/AdminLayout";
import { Dashboard } from "./components/Dashboard";
import { SlotManagement } from "./components/SlotManagement";
import { PricingPolicies } from "./components/PricingPolicies";
import { ReportsAnalytics } from "./components/ReportsAnalytics";
import { UserManagement } from "./components/UserManagement";
import { RoleManagement } from "./components/RoleManagement";
import { SystemConfig } from "./components/SystemConfig";
import { Login } from "./components/Login";
import { StaffDashboard } from "./components/StaffDashboard";
import { UserMobileHome } from "./components/UserMobileHome";
import { UserWebDashboard } from "./components/UserWebDashboard";
import { Settings } from "./components/Settings";
import { Violations } from "./components/Violations";
import { VehicleHistory } from "./components/VehicleHistory";
import { RequireAuth } from "./components/RequireAuth";
import { RequireGuest } from "./components/RequireGuest";
import { RouteErrorPage } from "./components/RouteErrorPage";
import { getAuth, getRoleHomePath } from "./lib/auth";

function SettingsRedirect() {
  const auth = getAuth();
  if (!auth?.token) return <Navigate to="/login" replace />;
  const role = auth.roleName.toLowerCase();
  if (role === "admin") return <Navigate to="/admin/settings" replace />;
  if (role === "manager") return <Navigate to="/manager/settings" replace />;
  return <Navigate to={getRoleHomePath(auth.roleName)} replace />;
}

export const router = createBrowserRouter([
  {
    element: <RequireGuest />,
    children: [
      {
        path: "/",
        Component: Login,
      },
      {
        path: "/login",
        Component: Login,
      },
    ],
  },
  {
    element: <RequireAuth roles={["Staff"]} />,
    children: [
      {
        path: "/staff-dashboard",
        Component: StaffDashboard,
      },
    ],
  },
  {
    element: <RequireAuth roles={["Driver"]} />,
    children: [
      {
        path: "/user-mobile",
        Component: UserMobileHome,
      },
      {
        path: "/user-web",
        Component: UserWebDashboard,
      },
    ],
  },
  {
    element: <RequireAuth roles={["Manager"]} />,
    children: [
      {
        path: "/manager",
        Component: Layout,
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, Component: Dashboard },
          { path: "slots", Component: SlotManagement },
          { path: "pricing", Component: PricingPolicies },
          { path: "reports", Component: ReportsAnalytics },
          { path: "violations", Component: Violations },
          { path: "history", Component: VehicleHistory },
          { path: "settings", Component: Settings },
        ],
      },
    ],
  },
  {
    element: <RequireAuth roles={["Admin"]} />,
    children: [
      {
        path: "/admin",
        Component: AdminLayout,
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, Component: UserManagement },
          { path: "users", Component: UserManagement },
          { path: "roles", Component: RoleManagement },
          { path: "config", Component: SystemConfig },
          { path: "settings", Component: Settings },
        ],
      },
    ],
  },
  {
    path: "/settings",
    Component: SettingsRedirect,
  },
  {
    path: "*",
    Component: () => {
      const auth = getAuth();
      if (auth?.token) return <Navigate to={getRoleHomePath(auth.roleName)} replace />;
      return <Navigate to="/login" replace />;
    },
  },
]);
