import { Outlet, NavLink, useNavigate, useLocation } from "react-router";
import {
  Users,
  Settings,
  Search,
  LogOut,
  ChevronRight,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  ServerCog,
  BarChart3,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationDropdown } from "./NotificationDropdown";
import { CallStaffPanel } from "./CallStaffPanel";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { getAuth, clearAuth } from "../lib/auth";

const navigation = [
  { name: "Quản Lý Người Dùng", href: "/admin/users", icon: Users },
  { name: "Phân Quyền Hệ Thống", href: "/admin/roles", icon: ShieldCheck },
  { name: "Cấu Hình Hệ Thống", href: "/admin/config", icon: ServerCog },
  { name: "Bảng Quản Lý (Manager)", href: "/manager", icon: BarChart3 },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCallPanelOpen, setIsCallPanelOpen] = useState(false);
  const auth = getAuth();
  const displayName = auth?.fullName ?? "System Admin";
  const displayEmail = auth?.email ?? "admin@parking.vn";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  function handleLogout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white overflow-hidden font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="h-16 flex-shrink-0 bg-white dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 shadow-sm z-30">
        <div className="flex items-center gap-3 md:w-60">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/admin')}>
            <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-red-600 transition-colors">
              AdminPro
            </span>
          </div>
        </div>

        <div className="flex-1 flex justify-center max-w-xl px-4 hidden sm:flex">
          <div className="w-full relative">
            <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 text-sm transition-colors"
              placeholder="Tìm nhân viên, chức năng hệ thống..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <ThemeToggle />
          <NotificationDropdown />
          <div className="h-7 w-px bg-gray-200 dark:bg-gray-800" />
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-red-600/25">
                {avatarLetter}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-red-600 transition-colors leading-tight">{displayName}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Quản trị viên</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 flex-shrink-0 bg-white dark:bg-[#1A1A1A] border-r border-gray-200 dark:border-gray-800 hidden md:flex flex-col">
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                    isActive || (location.pathname === "/admin" && item.href === "/admin/users")
                      ? "bg-red-600/10 dark:bg-red-600/15 text-red-600 font-semibold"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white font-medium"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1.5 rounded-lg transition-colors ${isActive || (location.pathname === "/admin" && item.href === "/admin/users") ? 'bg-red-600/15 text-red-600' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="flex-1 text-sm">{item.name}</span>
                    {(isActive || (location.pathname === "/admin" && item.href === "/admin/users")) && <ChevronRight className="w-3.5 h-3.5 text-red-600 opacity-60" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
            <button
              onClick={() => setIsCallPanelOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-red-600/10 hover:bg-red-600/20 text-red-600 font-semibold py-2.5 rounded-xl transition-colors border border-red-600/20 hover:scale-[1.02]"
            >
              <PhoneCall className="w-4 h-4" />
              <span className="text-sm">Hỗ trợ kỹ thuật</span>
            </button>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                {avatarLetter}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{displayEmail}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#121212] p-4 sm:p-6 lg:p-8 relative">
          <Outlet />
        </main>
      </div>

      <CallStaffPanel isOpen={isCallPanelOpen} onClose={() => setIsCallPanelOpen(false)} />
    </div>
  );
}
