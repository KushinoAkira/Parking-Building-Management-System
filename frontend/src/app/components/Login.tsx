import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Car, Lock, User, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck, Check, Circle } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { motion, AnimatePresence } from "motion/react";
import { apiPost } from "../lib/api";
import { getAuth, saveAuth, getRoleHomePath, type AuthPayload } from "../lib/auth";
import { startRealtimeConnection } from "../lib/realtime";
import { useLocale } from "../lib/i18n/LocaleContext";
import { isGoogleSignInConfigured, mountGoogleSignInButton } from "../lib/googleAuth";

const SHOW_DEMO_ACCOUNTS = import.meta.env.DEV;

const DEMO_ACCOUNTS = [
  {
    labelKey: "auth.demoAdmin",
    email: "admin@parking.com",
    password: "Admin@123",
    role: "admin",
    route: "/admin",
  },
  {
    labelKey: "auth.demoManager",
    email: "manager@parking.com",
    password: "Manager@123",
    role: "manager",
    route: "/manager",
  },
  {
    labelKey: "auth.demoStaff",
    email: "staff@parking.com",
    password: "Staff@123",
    role: "staff",
    route: "/staff-dashboard",
  },
  {
    labelKey: "auth.demoDriver",
    email: "user@parking.com",
    password: "User@123",
    role: "user",
    route: "/user-web",
  },
];

function getStorageAuth() {
  const raw = localStorage.getItem("pbms_auth") ?? sessionStorage.getItem("pbms_auth");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { roleName: string };
  } catch {
    return null;
  }
}

function ValidationItem({ isValid, text, isShield = false }: { isValid: boolean; text: string; isShield?: boolean }) {
  const isStrongActive = isShield && isValid;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-2 transition-all duration-300 mt-1.5`}
    >
      {isValid ? (
        isShield ? (
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
        )
      ) : (
        <XCircle className="w-4 h-4 text-red-400 dark:text-red-500 shrink-0" />
      )}
      
      {isStrongActive ? (
        <motion.span 
          animate={{ backgroundPosition: ["200% center", "-200% center"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="text-xs font-bold tracking-wide uppercase bg-gradient-to-r from-blue-700 via-cyan-400 to-blue-700 dark:from-blue-400 dark:via-white dark:to-blue-400 bg-[length:200%_auto] text-transparent bg-clip-text"
        >
          {text}
        </motion.span>
      ) : (
        <span className={`text-xs transition-all duration-300 ${
          isValid 
            ? "text-green-600 dark:text-green-400 font-medium" 
            : "text-gray-500 dark:text-gray-400 font-medium"
        }`}>
          {text}
        </span>
      )}
    </motion.div>
  );
}

export function Login() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [remember, setRemember] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const rememberRef = useRef(remember);
  rememberRef.current = remember;

  useEffect(() => {
    const auth = getAuth();
    if (!auth) return;
    navigate(getRoleHomePath(auth.roleName), { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!isLogin || !isGoogleSignInConfigured() || !googleBtnRef.current) return;

    let cancelled = false;
    void mountGoogleSignInButton(
      googleBtnRef.current,
      async (idToken) => {
        if (cancelled) return;
        setError("");
        setSuccess("");
        try {
          setIsSubmitting(true);
          const auth = await apiPost<AuthPayload>("/api/auth/google", { idToken });
          saveAuth(auth, rememberRef.current);
          void startRealtimeConnection();
          navigate(getRoleHomePath(auth.roleName), { replace: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "";
          if (msg === "ACCOUNT_EXISTS_LINK_GOOGLE") {
            setError(t("auth.googleAccountExistsLink"));
          } else if (msg === "STAFF_PASSWORD_ONLY") {
            setError(t("auth.staffPasswordOnly"));
          } else {
            setError(msg || t("auth.loginGoogleFailed"));
          }
        } finally {
          setIsSubmitting(false);
        }
      },
      () => {
        if (!cancelled) setError(t("auth.loginGoogleFailed"));
      },
    );

    return () => {
      cancelled = true;
    };
  }, [isLogin, navigate, t]);

  // Validation Logic
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showEmailValidation = email.length > 0;

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isStrong = hasLength && hasUpper && hasLower && hasNumber;
  const showPasswordValidation = password.length > 0;

  const conditionsMet = [hasLength, hasUpper, hasLower, hasNumber].filter(Boolean).length;
  let strengthLabel = t("auth.strengthWeak");
  let strengthColor = "text-[#F56565]";
  let progressWidth = "25%";
  let progressColor = "bg-[#F56565]";
  if (conditionsMet === 4) {
    strengthLabel = t("auth.strengthStrong");
    strengthColor = "text-[#48BB78]";
    progressWidth = "100%";
    progressColor = "bg-[#48BB78]";
  } else if (conditionsMet >= 2) {
    strengthLabel = t("auth.strengthMedium");
    strengthColor = "text-[#ECC94B]";
    progressWidth = "60%";
    progressColor = "bg-[#ECC94B]";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isLogin) {
      const trimmedFullName = fullName.trim();
      if (!trimmedFullName) {
        setError(t("auth.fullNameRequired"));
        return;
      }
      if (!isEmailValid || !isStrong) {
        setError(t("auth.validationCheck"));
        setSuccess("");
        return;
      }
      if (password !== confirmPassword) {
        setError(t("auth.passwordMismatch"));
        setSuccess("");
        return;
      }
      try {
        setIsSubmitting(true);
        await apiPost("/api/auth/register", {
          fullName: trimmedFullName,
          email,
          password,
          phone: null,
        });
        setSuccess(t("auth.registerSuccess"));
        setIsLogin(true);
        setFullName("");
        setPassword("");
        setConfirmPassword("");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("auth.registerFailed"));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      setIsSubmitting(true);
      const auth = await apiPost<AuthPayload>("/api/auth/login", { email, password });
      saveAuth(auth, remember);
      void startRealtimeConnection();
      navigate(getRoleHomePath(auth.roleName), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginFailedCredentials"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError("");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0F1C]">
      {/* Left Column - Image Background */}
      <div className="hidden lg:block lg:w-[55%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0A0F1C] z-10" />
        <img 
          src="/assets/login_bg.png" 
          alt="Smart Parking Building" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-[45%] flex flex-col relative z-20">
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <LocaleSwitcher compact />
          <ThemeToggle />
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 xl:px-16 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[380px] bg-white dark:bg-[#1A1A1A] rounded-[24px] px-6 py-4 shadow-2xl shadow-black/20"
          >
            {/* Header */}
            <div className="flex flex-col items-center mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center mb-2">
                <Car className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">{t("auth.appName")}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-[10px]">
                {t("auth.tagline")}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-gray-100 dark:bg-[#121212] p-1 rounded-xl mb-2 relative">
              <button
                onClick={() => { setIsLogin(true); setError(""); setSuccess(""); setConfirmPassword(""); setFullName(""); }}
                className={`relative flex-1 py-2 text-sm font-bold rounded-lg transition-colors z-10 ${
                  isLogin ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {t("auth.login")}
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(""); setSuccess(""); setConfirmPassword(""); }}
                className={`relative flex-1 py-2 text-sm font-bold rounded-lg transition-colors z-10 ${
                  !isLogin ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {t("auth.register")}
              </button>
              <motion.div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-[#1A1A1A] rounded-lg shadow-sm"
                initial={false}
                animate={{ x: isLogin ? 4 : '100%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-2">
              {/* Full Name Input (Register only) */}
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-xs font-bold text-gray-900 dark:text-gray-200 mb-1.5">
                      {t("auth.fullName")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-[18px] w-[18px] text-gray-400" />
                        <div className="h-[22px] w-[1.5px] bg-gray-300 dark:bg-gray-600 mx-3" />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => { setFullName(e.target.value); setError(""); setSuccess(""); }}
                        className="block w-full pl-14 pr-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-full bg-gray-50/50 dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-[#1A1A1A] focus:ring-0 focus:border-blue-600 dark:focus:border-blue-500 transition-all text-sm outline-none"
                        placeholder={t("auth.fullNamePlaceholder")}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold text-gray-900 dark:text-gray-200 mb-1.5">
                  {t("auth.emailUsername")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-[18px] w-[18px] text-gray-400" />
                    <div className="h-[22px] w-[1.5px] bg-gray-300 dark:bg-gray-600 mx-3" />
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); setSuccess(""); }}
                    className="block w-full pl-14 pr-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-full bg-gray-50/50 dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-[#1A1A1A] focus:ring-0 focus:border-blue-600 dark:focus:border-blue-500 transition-all text-sm outline-none"
                    placeholder={t("auth.emailPlaceholder")}
                  />
                </div>
                <AnimatePresence>
                  {!isLogin && showEmailValidation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 pl-1 space-y-1 overflow-hidden"
                    >
                      <ValidationItem isValid={isEmailValid} text={t("auth.emailValid")} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Password Input */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-900 dark:text-gray-200 mb-1.5">
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-[18px] w-[18px] text-gray-400" />
                    <div className="h-[22px] w-[1.5px] bg-gray-300 dark:bg-gray-600 mx-3" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); setSuccess(""); }}
                    className="block w-full pl-14 pr-12 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-full bg-gray-50/50 dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-[#1A1A1A] focus:ring-0 focus:border-blue-600 dark:focus:border-blue-500 transition-all text-sm outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
                <AnimatePresence>
                  {!isLogin && showPasswordValidation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 overflow-hidden"
                    >
                      <div className="mt-1 pl-1">
                        <h4 className="text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-wider">{t("auth.passwordRequireTitle")}</h4>
                        <div className="space-y-2 mb-4">
                          <div className={`flex items-center gap-2 text-sm transition-colors duration-300 ${hasLength ? 'text-[#48BB78]' : 'text-gray-400'}`}>
                            {hasLength ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                            <span>{t("auth.passwordLength")}</span>
                          </div>
                          <div className={`flex items-center gap-2 text-sm transition-colors duration-300 ${hasLower ? 'text-[#48BB78]' : 'text-gray-400'}`}>
                            {hasLower ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                            <span>{t("auth.passwordLowerHint")}</span>
                          </div>
                          <div className={`flex items-center gap-2 text-sm transition-colors duration-300 ${hasUpper ? 'text-[#48BB78]' : 'text-gray-400'}`}>
                            {hasUpper ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                            <span>{t("auth.passwordUpperHint")}</span>
                          </div>
                          <div className={`flex items-center gap-2 text-sm transition-colors duration-300 ${hasNumber ? 'text-[#48BB78]' : 'text-gray-400'}`}>
                            {hasNumber ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                            <span>{t("auth.passwordNumberHint")}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold tracking-wider mb-2">
                          <span className="text-gray-400 uppercase">{t("auth.strength")}</span>
                          <span className={`${strengthColor} transition-colors duration-300 uppercase`}>{strengthLabel}</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700/50 rounded-full overflow-hidden flex">
                          <motion.div 
                            className={`h-full ${progressColor} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: progressWidth }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Confirm Password Input (Only for Register) */}
                <AnimatePresence>
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-xs font-bold text-gray-900 dark:text-gray-200 mb-1.5">
                        {t("auth.confirmPassword")}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="h-[18px] w-[18px] text-gray-400" />
                          <div className="h-[22px] w-[1.5px] bg-gray-300 dark:bg-gray-600 mx-3" />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setError(""); setSuccess(""); }}
                          className="block w-full pl-14 pr-12 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-full bg-gray-50/50 dark:bg-[#121212] text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-[#1A1A1A] focus:ring-0 focus:border-blue-600 dark:focus:border-blue-500 transition-all text-sm outline-none"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Remember Me & Forgot Password */}
              <AnimatePresence>
                {isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                            className="peer w-4 h-4 rounded appearance-none border border-gray-300 dark:border-gray-600 checked:bg-blue-600 checked:border-blue-600 transition-colors cursor-pointer"
                          />
                          <CheckCircle2 className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100" />
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-300">{t("auth.remember")}</span>
                      </label>
                      <a href="#" className="text-xs font-bold text-blue-600 hover:underline">
                        {t("auth.forgotPassword")}
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="text-xs text-red-500 font-medium text-center bg-red-50 dark:bg-red-500/10 py-2 rounded-lg border border-red-200 dark:border-red-500/20">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-xs text-green-600 dark:text-green-500 font-medium text-center bg-green-50 dark:bg-green-500/10 py-2 rounded-lg border border-green-200 dark:border-green-500/20">
                  {success}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 mt-4 disabled:opacity-60"
              >
                {isSubmitting ? t("common.loading") : isLogin ? t("auth.login") : t("auth.register")}
              </button>

              <AnimatePresence>
                {isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
                      <span className="flex-shrink-0 mx-4 text-xs text-gray-400">{t("auth.orDivider")}</span>
                      <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
                    </div>

                    {isGoogleSignInConfigured() ? (
                      <div
                        ref={googleBtnRef}
                        className={`w-full flex justify-center min-h-[40px] ${isSubmitting ? "pointer-events-none opacity-60" : ""}`}
                      />
                    ) : (
                      <button
                        type="button"
                        disabled
                        title={t("auth.loginGoogleNotConfigured")}
                        className="w-full py-2 rounded-xl bg-white dark:bg-[#121212] text-gray-400 dark:text-gray-500 font-bold text-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        {t("auth.loginGoogle")}
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <AnimatePresence>
              {isLogin && SHOW_DEMO_ACCOUNTS && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {DEMO_ACCOUNTS.map((acc, idx) => (
                      <button
                        key={acc.role}
                        type="button"
                        onClick={() => fillDemo(acc)}
                        className="text-[10px] text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left bg-gray-50 dark:bg-[#121212] p-1.5 rounded-lg border border-gray-200 dark:border-gray-800"
                      >
                        <div className="font-bold">{t(acc.labelKey)}</div>
                        <div className="truncate opacity-80">{acc.email}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="w-full text-center py-2 text-[10px] text-gray-500 dark:text-gray-400 font-medium z-20">
          {t("auth.copyright")}
        </div>
      </div>
    </div>
  );
}
