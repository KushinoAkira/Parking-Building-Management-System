import { useState } from "react";
import { useNavigate } from "react-router";
import { Car, Lock, Phone, Eye, EyeOff, AlertCircle } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const DEMO_ACCOUNTS = [
  {
    label: "Quản lý",
    phone: "0901.000.001",
    password: "manager123",
    role: "manager",
    route: "/manager",
    color: "text-blue-500 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  {
    label: "Nhân viên",
    phone: "0902.000.002",
    password: "staff123",
    role: "staff",
    route: "/staff-dashboard",
    color: "text-orange-500 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  {
    label: "Khách gửi xe",
    phone: "0903.000.003",
    password: "user123",
    role: "user",
    route: "/user-mobile",
    color: "text-[#00C853]",
    dot: "bg-[#00C853]",
  },
];

function normalizePhone(v: string) {
  return v.replace(/[\s.\-]/g, "");
}

export function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isLogin) {
      // Đăng ký demo — chuyển vào user mobile mặc định
      if (password !== confirmPassword) {
        setError("Mật khẩu xác nhận không khớp.");
        return;
      }
      navigate("/user-mobile");
      return;
    }

    const inputPhone = normalizePhone(phone);
    const matched = DEMO_ACCOUNTS.find(
      (a) => normalizePhone(a.phone) === inputPhone && a.password === password
    );

    if (!matched) {
      setError("Số điện thoại hoặc mật khẩu không đúng.");
      return;
    }

    const route = matched.role === "user" ? "/user-web" : matched.route;
    navigate(route);
  };

  const fillDemo = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setPhone(acc.phone);
    setPassword(acc.password);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D0D] flex flex-col transition-colors duration-200 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-48 -right-48 w-96 h-96 bg-[#00C853]/6 dark:bg-[#00C853]/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-[#00C853]/6 dark:bg-[#00C853]/8 rounded-full blur-3xl" />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#00C853] rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-[#00C853]/30">
              <Car className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ParkingPro</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm text-center">
              Hệ thống Quản lý Bãi đỗ xe Thông minh
            </p>
          </div>

          <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl shadow-black/8 dark:shadow-black/40 border border-gray-100 dark:border-gray-800 p-8">
            {/* Tab */}
            <div className="flex bg-gray-100 dark:bg-[#121212] p-1 rounded-2xl mb-7 border border-gray-200 dark:border-gray-800">
              <button
                onClick={() => { setIsLogin(true); setError(""); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  isLogin
                    ? "bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Đăng nhập
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(""); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  !isLogin
                    ? "bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Đăng ký
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Số điện thoại
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(""); }}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#00C853] focus:border-[#00C853] transition-all text-sm"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#00C853] focus:border-[#00C853] transition-all text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#00C853] focus:border-[#00C853] transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-[#00C853] focus:ring-[#00C853]"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Ghi nhớ</span>
                  </label>
                  <a href="#" className="text-sm font-semibold text-[#00C853] hover:text-[#00C853]/80 transition-colors">
                    Quên mật khẩu?
                  </a>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 px-3.5 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-[#00C853] text-white font-bold text-sm hover:bg-[#00C853]/90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00C853] transition-all shadow-lg shadow-[#00C853]/25 mt-2"
              >
                {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
              </button>
            </form>

            {/* Demo accounts */}
            {isLogin && (
              <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wide">
                  Tài khoản Demo — Nhấn để điền nhanh
                </p>
                <div className="space-y-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => fillDemo(acc)}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all group"
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${acc.dot}`} />
                      <span className={`text-sm font-semibold shrink-0 ${acc.color}`}>
                        {acc.label}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono ml-auto group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                        {acc.phone} / {acc.password}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
            © 2026 ParkingPro — Hệ thống quản lý bãi đỗ xe thông minh.
          </p>
        </div>
      </div>
    </div>
  );
}
