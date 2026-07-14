import { createBrowserRouter, Navigate } from "react-router";
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

const loginRoute = async () => ({ Component: (await import("./components/Login")).Login });
const staffDashboardRoute = async () => ({ Component: (await import("./components/StaffDashboard")).StaffDashboard });
const userMobileRoute = async () => ({ Component: (await import("./components/UserMobileHome")).UserMobileHome });
const userWebRoute = async () => ({ Component: (await import("./components/UserWebDashboard")).UserWebDashboard });
const managerLayoutRoute = async () => ({ Component: (await import("./components/Layout")).Layout });
const adminLayoutRoute = async () => ({ Component: (await import("./components/AdminLayout")).AdminLayout });
const dashboardRoute = async () => ({ Component: (await import("./components/Dashboard")).Dashboard });
const slotManagementRoute = async () => ({ Component: (await import("./components/SlotManagement")).SlotManagement });
const pricingPoliciesRoute = async () => ({ Component: (await import("./components/PricingPolicies")).PricingPolicies });
const subscriptionPlansRoute = async () => ({ Component: (await import("./components/SubscriptionPlans")).SubscriptionPlans });
const reportsAnalyticsRoute = async () => ({ Component: (await import("./components/ReportsAnalytics")).ReportsAnalytics });
const violationsRoute = async () => ({ Component: (await import("./components/Violations")).Violations });
const feedbacksRoute = async () => ({ Component: (await import("./components/Feedbacks")).Feedbacks });
const vehicleHistoryRoute = async () => ({ Component: (await import("./components/VehicleHistory")).VehicleHistory });
const settingsRoute = async () => ({ Component: (await import("./components/Settings")).Settings });
const userManagementRoute = async () => ({ Component: (await import("./components/UserManagement")).UserManagement });
const roleManagementRoute = async () => ({ Component: (await import("./components/RoleManagement")).RoleManagement });
const systemConfigRoute = async () => ({ Component: (await import("./components/SystemConfig")).SystemConfig });

export const router = createBrowserRouter([
  {
    element: <RequireGuest />,
    children: [
      {
        path: "/",
        lazy: loginRoute,
      },
      {
        path: "/login",
        lazy: loginRoute,
      },
    ],
  },
  {
    element: <RequireAuth roles={["Staff"]} />,
    children: [
      {
        path: "/staff-dashboard",
        lazy: staffDashboardRoute,
      },
    ],
  },
  {
    element: <RequireAuth roles={["Driver"]} />,
    children: [
      {
        path: "/user-mobile",
        lazy: userMobileRoute,
      },
      {
        path: "/user-web",
        lazy: userWebRoute,
      },
    ],
  },
  {
    element: <RequireAuth roles={["Manager"]} />,
    children: [
      {
        path: "/manager",
        lazy: managerLayoutRoute,
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, lazy: dashboardRoute },
          { path: "slots", lazy: slotManagementRoute },
          { path: "pricing", lazy: pricingPoliciesRoute },
          { path: "subscription-plans", lazy: subscriptionPlansRoute },
          { path: "reports", lazy: reportsAnalyticsRoute },
          { path: "feedbacks", lazy: feedbacksRoute },
          { path: "violations", lazy: violationsRoute },
          { path: "history", lazy: vehicleHistoryRoute },
          { path: "settings", lazy: settingsRoute },
        ],
      },
    ],
  },
  {
    element: <RequireAuth roles={["Admin"]} />,
    children: [
      {
        path: "/admin",
        lazy: adminLayoutRoute,
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, lazy: userManagementRoute },
          { path: "users", lazy: userManagementRoute },
          { path: "roles", lazy: roleManagementRoute },
          { path: "config", lazy: systemConfigRoute },
          { path: "settings", lazy: settingsRoute },
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
