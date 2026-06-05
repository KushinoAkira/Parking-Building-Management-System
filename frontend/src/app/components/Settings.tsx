import { useState, useEffect } from "react";
import { User, Bell, Shield, Moon, Sun, Monitor, Smartphone, Globe, CreditCard, Key, SmartphoneNfc, History, Clock, LogOut } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function Settings() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("appearance");

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cài Đặt Hệ Thống</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Quản lý giao diện, tài khoản và thông báo của bạn.</p>
      </div>

      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 bg-gray-50 dark:bg-[#121212] border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 p-4">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("appearance")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "appearance"
                  ? "bg-blue-600/10 text-blue-600 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Monitor className="w-5 h-5" />
              Giao diện
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "account"
                  ? "bg-blue-600/10 text-blue-600 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <User className="w-5 h-5" />
              Tài khoản
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "notifications"
                  ? "bg-blue-600/10 text-blue-600 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Bell className="w-5 h-5" />
              Thông báo
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === "security"
                  ? "bg-blue-600/10 text-blue-600 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Shield className="w-5 h-5" />
              Bảo mật
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-6 md:p-8 bg-white dark:bg-[#1A1A1A]">
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Giao diện (Theme)</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                  {/* Light Mode Option */}
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      theme === "light"
                        ? "border-blue-600 bg-blue-600/5"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-600/50"
                    }`}
                  >
                    <div className={`p-3 rounded-full ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      <Sun className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">Nền Sáng</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Giao diện màu sáng rõ ràng</p>
                    </div>
                  </button>

                  {/* Dark Mode Option */}
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      theme === "dark"
                        ? "border-blue-600 bg-blue-600/5"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-600/50"
                    }`}
                  >
                    <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      <Moon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">Nền Tối</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Dịu mắt, tiết kiệm pin</p>
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Ngôn ngữ</h2>
                <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl max-w-xl">
                  <Globe className="w-6 h-6 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">Tiếng Việt</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ngôn ngữ mặc định của hệ thống</p>
                  </div>
                  <button className="text-sm font-medium text-blue-600 opacity-50 cursor-not-allowed">Đổi</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Thông tin cá nhân</h2>
              
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  M
                </div>
                <div>
                  <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    Thay đổi ảnh
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ và tên</label>
                  <input type="text" defaultValue="Manager Admin" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input type="email" defaultValue="admin@parkingpro.vn" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
                  <input type="tel" defaultValue="0987654321" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vai trò</label>
                  <input type="text" disabled defaultValue="Quản trị viên" className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 cursor-not-allowed" />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-600/90 transition-colors shadow-sm">
                  Lưu thay đổi
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Cài đặt thông báo</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Quản lý cách bạn nhận thông báo từ hệ thống.</p>
              </div>

              {/* Master Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#121212] rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/10 rounded-lg text-blue-600">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Cho phép nhận thông báo</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bật/tắt tất cả thông báo trên ứng dụng</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Notification Types */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Loại thông báo</h3>
                
                <div className="space-y-3">
                  {[
                    { id: "in-out", title: "Xe vào/ra bãi", desc: "Thông báo khi có xe quét thẻ vào hoặc ra khỏi bãi", defaultChecked: true },
                    { id: "booking", title: "Đặt chỗ thành công", desc: "Thông báo khi khách hàng đặt trước chỗ đỗ xe", defaultChecked: true },
                    { id: "overtime", title: "Xe quá giờ", desc: "Cảnh báo khi có xe đỗ vượt quá thời gian quy định", defaultChecked: true },
                    { id: "promo", title: "Khuyến mãi & Cập nhật", desc: "Nhận tin tức về tính năng mới và chương trình ưu đãi", defaultChecked: false },
                  ].map(item => (
                    <div key={item.id} className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div className="pr-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                        <input type="checkbox" className="sr-only peer" defaultChecked={item.defaultChecked} />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-600/90 transition-colors shadow-sm">
                  Lưu cài đặt
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Bảo mật tài khoản</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Quản lý mật khẩu, xác thực 2 lớp và lịch sử đăng nhập.</p>
              </div>

              {/* Change Password */}
              <div className="pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-500 mt-1">
                    <Key className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Đổi mật khẩu</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Mật khẩu nên có ít nhất 8 ký tự, bao gồm chữ và số.</p>
                    
                    <div className="space-y-3 max-w-md">
                      <input type="password" placeholder="Mật khẩu hiện tại" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-600 text-gray-900 dark:text-white" />
                      <input type="password" placeholder="Mật khẩu mới" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-600 text-gray-900 dark:text-white" />
                      <input type="password" placeholder="Nhập lại mật khẩu mới" className="w-full px-4 py-2 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-600 text-gray-900 dark:text-white" />
                      <button className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                        Cập nhật mật khẩu
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2FA */}
              <div className="pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg text-purple-500 mt-1">
                      <SmartphoneNfc className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Xác thực 2 bước (2FA)</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Bảo vệ tài khoản với một lớp bảo mật bổ sung.</p>
                      <p className="text-xs font-medium text-orange-500 mt-2 bg-orange-50 dark:bg-orange-500/10 inline-block px-2 py-1 rounded">Chưa kích hoạt</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Thiết lập
                  </button>
                </div>
              </div>

              {/* Active Sessions */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Thiết bị & Phiên đăng nhập</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#121212] border border-blue-600/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Windows PC - Chrome</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Đang hoạt động (Thiết bị này)</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">iPhone 13 - Safari</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> Hoạt động lần cuối: 2 giờ trước</p>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Đăng xuất thiết bị này">
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