import { useState } from "react";
import { User, Bell, Shield, Moon, Sun, Monitor, Smartphone, Globe, Key, SmartphoneNfc, History, Clock, LogOut } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { useLocale } from "../lib/i18n/LocaleContext";

export function Settings() {
  const { theme, setTheme } = useTheme();
  const { t, language, currency } = useLocale();
  const [activeTab, setActiveTab] = useState("appearance");

  const langLabel = language === "vi" ? "Tiếng Việt" : "English";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("settings.title")}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t("settings.subtitle")}</p>
      </div>

      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        <div className="w-full md:w-64 bg-gray-50 dark:bg-[#121212] border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 p-4">
          <nav className="space-y-1">
            {[
              { id: "appearance", icon: Monitor, label: t("settings.appearance") },
              { id: "account", icon: User, label: t("settings.account") },
              { id: "notifications", icon: Bell, label: t("settings.notifications") },
              { id: "security", icon: Shield, label: t("settings.security") },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-600/10 text-blue-600 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 p-6 md:p-8 bg-white dark:bg-[#1A1A1A]">
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t("settings.theme")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      theme === "light"
                        ? "border-blue-600 bg-blue-600/5"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-600/50"
                    }`}
                  >
                    <div className={`p-3 rounded-full ${theme === "light" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                      <Sun className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{t("settings.light")}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t("settings.lightDesc")}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      theme === "dark"
                        ? "border-blue-600 bg-blue-600/5"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-600/50"
                    }`}
                  >
                    <div className={`p-3 rounded-full ${theme === "dark" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                      <Moon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{t("settings.dark")}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t("settings.darkDesc")}</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t("settings.language")}</h2>
                <div className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl max-w-xl">
                  <Globe className="w-6 h-6 text-gray-400 shrink-0 mt-1" />
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{langLabel}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t("settings.languageDesc")}</p>
                      <p className="text-xs text-gray-400 mt-1">{t("settings.currentLang", { lang: language.toUpperCase() })}</p>
                    </div>
                    <LocaleSwitcher />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t("settings.currency")}</h2>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl max-w-xl">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t("settings.currencyDesc")}</p>
                  <p className="text-xs text-gray-400">{t("settings.currentCurrency", { currency })}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t("settings.personalInfo")}</h2>

              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  M
                </div>
                <div>
                  <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    {t("settings.changeAvatar")}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("auth.fullName")}</label>
                  <input type="text" defaultValue="Manager Admin" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("auth.email")}</label>
                  <input type="email" defaultValue="admin@parkingpro.vn" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("settings.phone")}</label>
                  <input type="tel" defaultValue="0987654321" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("settings.role")}</label>
                  <input type="text" disabled defaultValue={t("role.Admin")} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 cursor-not-allowed" />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-600/90 transition-colors shadow-sm">
                  {t("settings.saveChanges")}
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t("settings.notifSettings")}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t("settings.notifDesc")}</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#121212] rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/10 rounded-lg text-blue-600">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t("settings.allowNotif")}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("settings.notifMasterDesc")}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                </label>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">{t("settings.notifTypes")}</h3>
                <div className="space-y-3">
                  {[
                    { id: "in-out", title: t("settings.notifInOut"), desc: t("settings.notifInOutDesc"), defaultChecked: true },
                    { id: "booking", title: t("settings.notifBooking"), desc: t("settings.notifBookingDesc"), defaultChecked: true },
                    { id: "overtime", title: t("settings.notifOvertime"), desc: t("settings.notifOvertimeDesc"), defaultChecked: true },
                    { id: "promo", title: t("settings.notifPromo"), desc: t("settings.notifPromoDesc"), defaultChecked: false },
                  ].map((item) => (
                    <div key={item.id} className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div className="pr-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                        <input type="checkbox" className="sr-only peer" defaultChecked={item.defaultChecked} />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-600/90 transition-colors shadow-sm">
                  {t("settings.saveNotifSettings")}
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t("settings.securityTitle")}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("settings.securityDesc")}</p>
              </div>

              <div className="pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-500 mt-1">
                    <Key className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t("settings.changePassword")}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t("settings.passwordHint")}</p>
                    <div className="space-y-3 max-w-md">
                      <input type="password" placeholder={t("settings.currentPassword")} className="w-full px-4 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-600 text-gray-900 dark:text-white" />
                      <input type="password" placeholder={t("settings.newPassword")} className="w-full px-4 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-600 text-gray-900 dark:text-white" />
                      <input type="password" placeholder={t("settings.confirmNewPassword")} className="w-full px-4 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-600 text-gray-900 dark:text-white" />
                      <button className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                        {t("settings.updatePassword")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg text-purple-500 mt-1">
                      <SmartphoneNfc className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{t("settings.twoFactor")}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("settings.twoFactorDesc")}</p>
                      <p className="text-xs font-medium text-orange-500 mt-2 bg-orange-50 dark:bg-orange-500/10 inline-block px-2 py-1 rounded">{t("settings.twoFactorInactive")}</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    {t("settings.setup")}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t("settings.devicesSessions")}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#121212] border border-blue-600/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Windows PC - Chrome</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> {t("settings.activeDevice")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">iPhone 13 - Safari</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {t("settings.lastActive2h")}</p>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title={t("settings.logoutDevice")}>
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
