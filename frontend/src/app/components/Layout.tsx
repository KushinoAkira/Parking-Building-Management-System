import { Outlet, NavLink, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  Car,
  Banknote,
  BarChart3,
  Settings,
  Search,
  LogOut,
  ChevronRight,
  ShieldAlert,
  PhoneCall,
  List,
  MessageSquare,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { NotificationDropdown } from "./NotificationDropdown";
import { CallStaffPanel } from "./CallStaffPanel";
import { useMemo, useState } from "react";
import { getAuth, clearAuth } from "../lib/auth";
import { stopRealtimeConnection } from "../lib/realtime";
import { useLocale } from "../lib/i18n/LocaleContext";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCallPanelOpen, setIsCallPanelOpen] = useState(false);
  const auth = getAuth();
  const { t } = useLocale();
  const displayName = auth?.fullName ?? "Manager";
  const displayEmail = auth?.email ?? "manager@parking.vn";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const roleLabel = auth?.roleName ? t(`role.${auth.roleName}` as "role.Manager") : t("role.Manager");

  const navigation = useMemo(
    () => [
      { name: t("nav.overview"), href: "/manager", icon: LayoutDashboard },
      { name: t("nav.slots"), href: "/manager/slots", icon: Car },
      { name: t("nav.history"), href: "/manager/history", icon: List },
      { name: t("nav.violations"), href: "/manager/violations", icon: ShieldAlert },
      { name: t("nav.pricing"), href: "/manager/pricing", icon: Banknote },
      { name: t("nav.reports"), href: "/manager/reports", icon: BarChart3 },
      { name: t("nav.feedbacks"), href: "/manager/feedbacks", icon: MessageSquare },
      { name: t("nav.settings"), href: "/manager/settings", icon: Settings },
    ],
    [t],
  );

  function handleLogout() {
    clearAuth();
    void stopRealtimeConnection();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white overflow-hidden font-sans transition-colors duration-200">
      <header className="h-16 flex-shrink-0 bg-white dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 shadow-sm z-30">
        <div className="flex items-center gap-3 md:w-60">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate("/manager")}>
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
              {t("auth.appName")}
            </span>
          </div>
        </div>

        <div className="flex-1 flex justify-center max-w-xl px-4 hidden sm:flex">
          <div className="w-full relative">
            <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm transition-colors"
              placeholder={t("common.searchPlate")}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <LocaleSwitcher />
          <ThemeToggle />
          <NotificationDropdown />
          <div className="h-7 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-600/25">
                {avatarLetter}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors leading-tight">{displayName}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{roleLabel}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
              title={t("common.logout")}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-60 flex-shrink-0 bg-white dark:bg-[#1A1A1A] border-r border-gray-200 dark:border-gray-800 hidden md:flex flex-col">
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
            {navigation.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === "/manager"}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                    isActive
                      ? "bg-blue-600/10 dark:bg-blue-600/15 text-blue-600 font-semibold"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white font-medium"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1.5 rounded-lg transition-colors ${isActive ? "bg-blue-600/15 text-blue-600" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="flex-1 text-sm">{item.name}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600 opacity-60" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
            <button
              onClick={() => setIsCallPanelOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 font-semibold py-2.5 rounded-xl transition-colors border border-blue-600/20 hover:scale-[1.02]"
            >
              <PhoneCall className="w-4 h-4" />
              <span className="text-sm">{t("common.callStaff")}</span>
            </button>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-100 dark:border-gray-800">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                {avatarLetter}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{displayEmail}</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#121212] p-4 sm:p-6 lg:p-8 relative">
          <Outlet />
        </main>
      </div>

      <CallStaffPanel isOpen={isCallPanelOpen} onClose={() => setIsCallPanelOpen(false)} />
    </div>
  );
}
