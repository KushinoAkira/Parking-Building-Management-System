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
    element: <RequireAuth roles={["Manager", "Admin"]} />,
    children: [
      {
        path: "/manager",
        Component: Layout,
        errorElement: (
          <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white">
            <h1 className="text-4xl font-bold mb-4 text-[#00C853]">Oops!</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Đã xảy ra lỗi hoặc không tìm thấy trang.</p>
            <a href="/login" className="px-4 py-2 bg-[#00C853] text-white rounded-lg font-medium hover:bg-[#00C853]/90 transition-colors">
              Về màn hình Đăng Nhập
            </a>
          </div>
        ),
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
    path: "/admin",
    Component: AdminLayout,
    errorElement: (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white">
        <h1 className="text-4xl font-bold mb-4 text-[#00C853]">Oops!</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Đã xảy ra lỗi hoặc không tìm thấy trang.</p>
        <a href="/login" className="px-4 py-2 bg-[#00C853] text-white rounded-lg font-medium hover:bg-[#00C853]/90 transition-colors">
          Về màn hình Đăng Nhập
        </a>
      </div>
    ),
    children: [
      { index: true, Component: UserManagement },
      { path: "users", Component: UserManagement },
      { path: "roles", Component: RoleManagement },
      { path: "config", Component: SystemConfig },
      { path: "settings", Component: Settings },
    ],
  },
  {
    path: "/settings",
    Component: () => <Navigate to="/manager/settings" replace />,
  },
  {
    path: "*",
    Component: () => <Navigate to="/login" replace />,
  },
]);
