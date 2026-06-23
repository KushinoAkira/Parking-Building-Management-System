import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Car, MapPin, Clock, CreditCard, ChevronRight, Bell, Search, QrCode, Home, Ticket, Info, X, CheckCircle2, Wallet, History, Tag, ScanLine, Image as ImageIcon, Settings, AlertTriangle, Plus, ArrowUpRight, ArrowDownLeft, Calendar, MessageSquare, Loader2 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { useNavigate } from "react-router";
import { motion, AnimatePresence, Variants } from "motion/react";
import { apiGet, apiPost, formatApiError, isNetworkError, isTimeoutError } from "../lib/api";
import { clearAuth, getAuth } from "../lib/auth";
import { useLocale } from "../lib/i18n/LocaleContext";
import { useRealtimeRefresh } from "../lib/RealtimeContext";
import { RealtimeEventTypes } from "../lib/realtime";
import { DriverWalletPanel } from "./DriverWalletPanel";
import type { DriverTransaction } from "../lib/walletApi";
import {
  bookableVehicleTypes,
  normalizeBookZoneId,
  zonesForVehicleType,
  type BookVehicleType,
  type BookZone,
} from "../lib/bookZones";

const TX_FILTERS = ["all", "topup", "payment", "refund"] as const;
type TxFilter = (typeof TX_FILTERS)[number];

export function UserMobileHome() {
  const navigate = useNavigate();
  const { t, formatMoney, formatDateTime, tp, tv } = useLocale();
  const auth = getAuth();
  const authToken = auth?.token ?? "";
  const authRole = auth?.roleName?.toLowerCase() ?? "";
  const userId = auth?.userId ?? 0;
  const [activeTab, setActiveTab] = useState("home");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [utilityScreen, setUtilityScreen] = useState<string | null>(null);

  const [historyFilter, setHistoryFilter] = useState<TxFilter>("all");
  const [bookPlate, setBookPlate] = useState("");
  const [bookVehicleTypeId, setBookVehicleTypeId] = useState<number>(1);
  const [bookZoneId, setBookZoneId] = useState<number | "">("");
  const [bookSubmitting, setBookSubmitting] = useState(false);
  const [bookMessage, setBookMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState("Suggestion");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [vehicleTypes, setVehicleTypes] = useState<BookVehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiOffline, setApiOffline] = useState(false);
  const [home, setHome] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<DriverTransaction[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [parkingFloors, setParkingFloors] = useState<BookZone[]>([]);

  const [notifications, setNotifications] = useState<any[]>([]);

  const activeSession = home?.activeSession;
  const userName = home?.user?.fullName ?? "Driver";

  const ticketsData = useMemo(
    () =>
      tickets.map((ticket) => ({
        id: ticket.ticketCode ?? `TK-${ticket.sessionId}`,
        plate: ticket.licensePlate ?? "-",
        location: `${ticket.zoneCode ?? "-"} - ${t("common.slot")} ${ticket.slotId ?? "-"}`,
        timeIn: formatDateTime(ticket.entryTime),
        timeOut: ticket.exitTime ? formatDateTime(ticket.exitTime) : null,
        status: ticket.status === "Active" ? t("driver.parkingStatus") : t("driver.completedStatus"),
        price: ticket.totalFee != null ? formatMoney(ticket.totalFee) : t("driver.feeCalculating"),
        isActive: ticket.status === "Active",
      })),
    [tickets, t, formatMoney, formatDateTime],
  );

  const transactionHistory = useMemo(
    () =>
      transactions.map((tx) => {
        const isTopUp = tx.type === "topup";
        return {
          id: `${tx.type}-${tx.id}`,
          type: (isTopUp ? "topup" : "payment") as TxFilter,
          typeLabel: isTopUp ? t("driver.txFilterTopUp") : t("driver.txPaymentFee"),
          amount: isTopUp ? `+ ${formatMoney(tx.amount)}` : `- ${formatMoney(tx.amount)}`,
          time: formatDateTime(tx.paymentTime),
          method: tp(tx.paymentMethod ?? "EWallet"),
          isPositive: isTopUp,
        };
      }),
    [transactions, t, formatMoney, formatDateTime, tp],
  );

  const myVehicles = useMemo(() => {
    const map = new Map<string, {
      id: number;
      plate: string;
      type: string;
      status: string;
      location: string | null;
      time: string | null;
      isParking: boolean;
    }>();
    tickets.forEach((ticket) => {
      if (!ticket.licensePlate || map.has(ticket.licensePlate)) return;
      const isParking = ticket.status === "Active";
      map.set(ticket.licensePlate, {
        id: ticket.sessionId,
        plate: ticket.licensePlate,
        type: ticket.vehicleTypeCode ?? t("common.vehicleType"),
        status: isParking ? t("driver.parkingStatus") : t("driver.notParking"),
        location: isParking ? `${ticket.zoneCode ?? "-"} - ${t("common.slot")} ${ticket.slotId ?? "-"}` : null,
        time: isParking && ticket.entryTime ? formatDateTime(ticket.entryTime) : null,
        isParking,
      });
    });
    return Array.from(map.values());
  }, [tickets, t, formatDateTime]);

  function driverErrorMessage(e: unknown, fallback: string) {
    return formatApiError(e, {
      network: t("common.networkError"),
      timeout: t("common.timeoutError"),
      fallback,
    });
  }

  const loadData = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!authToken || !userId) return;
    try {
      const homeRes = await apiGet(`/api/portal/driver/${userId}/home`, authToken);
      setHome(homeRes);
      setWalletBalance((homeRes as { user?: { walletBalance?: number } })?.user?.walletBalance ?? 0);
      setApiOffline(false);
      if (!opts?.quiet) setError("");
      const plate = (homeRes as { activeSession?: { licensePlate?: string } })?.activeSession?.licensePlate;
      if (plate) setBookPlate((prev) => prev || plate);
    } catch (e) {
      if (!opts?.quiet) {
        if (isNetworkError(e) || isTimeoutError(e)) setApiOffline(true);
        else setError(driverErrorMessage(e, t("driver.loadFailed")));
      }
      return;
    }

    const [ticketsRes, txRes, zonesRes, notifsRes, vtRes] = await Promise.allSettled([
      apiGet(`/api/portal/driver/${userId}/tickets`, authToken),
      apiGet(`/api/portal/driver/${userId}/transactions`, authToken),
      apiGet("/api/zones?status=Active", authToken),
      apiGet(`/api/portal/driver/${userId}/notifications`, authToken),
      apiGet<{ vehicleTypeId: number; typeName: string; typeCode: string }[]>("/api/vehicle-types", authToken),
    ]);
    if (ticketsRes.status === "fulfilled") setTickets(ticketsRes.value as any[]);
    if (txRes.status === "fulfilled") setTransactions(txRes.value as DriverTransaction[]);
    if (zonesRes.status === "fulfilled") setParkingFloors(Array.isArray(zonesRes.value) ? (zonesRes.value as BookZone[]) : []);
    if (notifsRes.status === "fulfilled") setNotifications(Array.isArray(notifsRes.value) ? notifsRes.value : []);
    if (vtRes.status === "fulfilled") setVehicleTypes(Array.isArray(vtRes.value) ? (vtRes.value as BookVehicleType[]) : []);
  }, [authToken, userId, t]);

  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;

  useEffect(() => {
    if (!authToken || authRole !== "driver") {
      navigate("/login");
      return;
    }

    setLoading(true);
    loadDataRef.current()
      .catch((e) => {
        if (isNetworkError(e) || isTimeoutError(e)) setApiOffline(true);
        else setError(driverErrorMessage(e, t("driver.loadFailed")));
      })
      .finally(() => setLoading(false));
  }, [navigate, authToken, authRole, t]);

  useRealtimeRefresh(
    [
      RealtimeEventTypes.SessionCheckedOut,
      RealtimeEventTypes.WalletTopUpCompleted,
    ],
    () => {
      loadDataRef.current({ quiet: true }).catch(() => {});
    },
  );

  const handleCheckout = () => {
    if (!activeSession) {
      setError(t("driver.noSession"));
      return;
    }
    setShowPayment(true);
    setPaymentDone(false);
  };

  const handleConfirmPayment = async () => {
    if (!authToken || !activeSession) return;
    try {
      await apiPost(
        `/api/parking-sessions/${activeSession.sessionId}/check-out`,
        { paymentMethod: "EWallet", exitGate: "Driver-Mobile" },
        authToken,
      );
      await loadDataRef.current({ quiet: true });
      setPaymentDone(true);
      setTimeout(() => setShowPayment(false), 1800);
    } catch (e) {
      setError(driverErrorMessage(e, t("driver.checkoutFailed")));
    }
  };

  const parkingAreas = useMemo(() => {
    return parkingFloors.map((zone) => {
      const total = zone.capacity ?? 0;
      const free = zone.availableSlots ?? 0;
      return {
        zoneId: zone.zoneId,
        zoneCode: zone.zoneCode,
        floorName: zone.zoneName ?? zone.zoneCode,
        vehicleTypeCode: zone.vehicleTypeCode ?? zone.vehicleType,
        totalSlots: total,
        availableSlots: free,
      };
    });
  }, [parkingFloors]);

  const bookingVehicleTypes = useMemo(() => bookableVehicleTypes(vehicleTypes), [vehicleTypes]);
  const bookingZones = useMemo(
    () => zonesForVehicleType(parkingFloors, bookVehicleTypeId),
    [parkingFloors, bookVehicleTypeId],
  );

  useEffect(() => {
    if (bookingVehicleTypes.length === 0) return;
    if (!bookingVehicleTypes.some((vt) => vt.vehicleTypeId === bookVehicleTypeId)) {
      setBookVehicleTypeId(bookingVehicleTypes[0].vehicleTypeId);
    }
  }, [bookingVehicleTypes, bookVehicleTypeId]);

  useEffect(() => {
    setBookZoneId((prev) => normalizeBookZoneId(prev, bookingZones));
  }, [bookVehicleTypeId, bookingZones]);

  async function handleBookSlot() {
    if (!authToken || !userId || !bookPlate.trim()) {
      setBookMessage(t("driver.bookPlateRequired"));
      return;
    }
    setBookSubmitting(true);
    setBookMessage("");
    try {
      const from = new Date();
      from.setHours(from.getHours() + 1);
      const to = new Date(from);
      to.setHours(to.getHours() + 2);
      const created = await apiPost<{ reservationId: number }>(
        "/api/reservations",
        {
          userId,
          vehicleTypeId: bookVehicleTypeId,
          zoneId: bookZoneId || null,
          slotId: null,
          licensePlate: bookPlate.trim(),
          reservedFrom: from.toISOString(),
          reservedTo: to.toISOString(),
        },
        authToken,
      );
      await apiPost(`/api/reservations/${created.reservationId}/confirm`, {}, authToken);
      setBookMessage(t("driver.bookSuccessExtended"));
      await loadDataRef.current({ quiet: true });
    } catch (e) {
      setBookMessage(driverErrorMessage(e, t("driver.bookFailed")));
    } finally {
      setBookSubmitting(false);
    }
  }

  async function handleSendFeedback() {
    if (!authToken || !userId || !feedbackContent.trim()) {
      setFeedbackMessage(t("driver.feedbackValidation"));
      return;
    }
    setFeedbackSubmitting(true);
    setFeedbackMessage("");
    try {
      await apiPost(
        "/api/feedbacks",
        {
          userId,
          sessionId: activeSession?.sessionId ?? null,
          feedbackType: feedbackType,
          content: feedbackContent.trim(),
        },
        authToken,
      );
      setFeedbackContent("");
      setFeedbackMessage(t("driver.feedbackSuccess"));
    } catch (e) {
      setFeedbackMessage(driverErrorMessage(e, t("driver.feedbackFailed")));
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  const screenVariants: Variants = {
    hidden: { x: "100%", opacity: 0 },
    show: { x: 0, opacity: 1, transition: { type: "spring", bounce: 0, duration: 0.4 } },
    exit: { x: "100%", opacity: 0, transition: { type: "spring", bounce: 0, duration: 0.3 } }
  };

  const tabVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  const modalVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.2, duration: 0.5 } },
    exit: { opacity: 0, y: 50, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0D0D0D] flex justify-center items-center p-4 transition-colors duration-200">

      {/* Mobile Device Frame */}
      <div className="w-[390px] h-[844px] bg-white dark:bg-[#121212] rounded-[44px] shadow-2xl overflow-hidden border-8 border-gray-900 relative flex flex-col z-0">
        
        {/* Ambient Blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-600/30 blur-[80px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-[10%] left-[-10%] w-48 h-48 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none -z-10" />

        {/* Dynamic Island */}
        <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-50 pointer-events-none">
          <div className="w-32 h-7 bg-gray-900 rounded-b-2xl" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-24" style={{ scrollbarWidth: 'none' }}>

          {/* Header */}
          <div className="pt-10 pb-5 px-6 bg-gradient-to-b from-blue-600/10 dark:from-blue-600/5 to-transparent relative z-10 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src="/assets/avatar.png" alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm" />
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-600 border-2 border-white dark:border-gray-800 rounded-full" />
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">{t("driver.hello")}</p>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{userName}</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LocaleSwitcher compact />
                <ThemeToggle />
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowNotifications(true)} 
                  className="relative p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowSettings(true)} 
                  className="relative p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full px-4 py-1.5 shadow-sm">
                <Wallet className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("driver.wallet.balance")}: <span className="text-blue-600">{formatMoney(walletBalance)}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUtilityScreen("topup")}
                className="inline-flex items-center gap-1 bg-blue-600 text-white rounded-full px-4 py-1.5 text-sm font-semibold shadow-sm"
              >
                <Plus className="w-4 h-4" /> {t("driver.wallet.topUp")}
              </button>
            </div>
          </div>
          {loading && <div className="px-6 mb-4 text-sm text-gray-500">{t("driver.loading")}</div>}
          {(apiOffline && !home) && (
            <div className="mx-6 mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-400">
              {t("common.networkError")}
            </div>
          )}
          {error && <div className="mx-6 mb-4 rounded-xl bg-red-50 dark:bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>}

          <AnimatePresence mode="wait">
            {activeTab === "home" && (
              <motion.div 
                key="home"
                variants={tabVariants}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                {/* Search */}
                <div className="px-6 mb-5">
                  <div className="w-full h-32 rounded-2xl overflow-hidden mb-5 relative shadow-md">
                    <img src="/assets/hero_parking.png" alt="Smart Parking" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                      <p className="text-white font-bold text-lg">{t("driver.findParkingEasy")}</p>
                    </div>
                  </div>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="text"
                      placeholder={t("driver.searchParking")}
                      className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-2xl py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-600 transition-colors shadow-sm"
                    />
                  </div>
                </div>

                {/* Active Session Card */}
                <div className="px-6 mb-6">
                  <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-widest">{t("driver.currentSessionTitle")}</h2>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-5 text-white shadow-xl shadow-blue-600/25 relative overflow-hidden"
                  >
                    <div className="absolute -right-8 -top-8 opacity-10 pointer-events-none">
                      <Car className="w-36 h-36" />
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <h3 className="font-bold text-lg">{t("auth.appName")}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-white/80 text-xs bg-white/20 px-2 py-0.5 rounded-md font-medium">{t("common.slot")} {activeSession?.slotId ?? "--"}</span>
                          <span className="text-white/80 text-xs bg-white/20 px-2 py-0.5 rounded-md font-medium">{activeSession?.zoneCode ?? "--"}</span>
                        </div>
                      </div>
                      <div className="bg-white text-blue-600 p-2.5 rounded-2xl shadow-md">
                        <QrCode className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-5 border-t border-white/20 pt-4 relative z-10">
                      <div>
                        <p className="text-white/70 text-xs mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {t("driver.entryTimeLabel")}</p>
                        <p className="font-bold text-sm">{activeSession?.entryTime ? formatDateTime(activeSession.entryTime).split(", ").pop() ?? "--:--" : "--:--"}</p>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs mb-1 flex items-center gap-1"><Info className="w-3 h-3" /> {t("common.plate")}</p>
                        <p className="font-mono font-bold text-sm">{activeSession?.licensePlate ?? "--"}</p>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs mb-1 flex items-center gap-1"><CreditCard className="w-3 h-3" /> {t("driver.estimatedFeeLabel")}</p>
                        <p className="font-bold text-sm">{formatMoney(activeSession?.estimatedFee)}</p>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCheckout}
                      className="w-full bg-white text-blue-600 font-bold py-3 rounded-2xl hover:bg-gray-50 transition-all shadow-md relative z-10"
                    >
                      {activeSession ? t("driver.checkout") : t("driver.noSession")}
                    </motion.button>
                  </motion.div>
                </div>

                {/* Quick Actions */}
                <div className="px-6 mb-6">
                  <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-widest">{t("driver.utilities")}</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "topup", icon: <Wallet className="w-5 h-5" />, label: t("driver.utilityTopUp"), color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
                      { id: "book", icon: <Calendar className="w-5 h-5" />, label: t("driver.utilityBook"), color: "text-green-500 bg-green-50 dark:bg-green-500/10" },
                      { id: "feedback", icon: <MessageSquare className="w-5 h-5" />, label: t("driver.utilityFeedback"), color: "text-pink-500 bg-pink-50 dark:bg-pink-500/10" },
                      { id: "history", icon: <History className="w-5 h-5" />, label: t("driver.utilityTxHistory"), color: "text-orange-500 bg-orange-50 dark:bg-orange-500/10" },
                      { id: "vehicles", icon: <Car className="w-5 h-5" />, label: t("driver.utilityMyVehicles"), color: "text-purple-500 bg-purple-50 dark:bg-purple-500/10" },
                    ].map((action) => (
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        key={action.id} 
                        onClick={() => setUtilityScreen(action.id)} 
                        className="flex flex-col items-center gap-2 p-3.5 bg-white dark:bg-[#121212] rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-600/40 transition-all shadow-sm"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${action.color}`}>
                          {action.icon}
                        </div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">{action.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Nearby Parking */}
                <div className="px-6 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t("driver.parkingAreas")}</h2>
                    <button className="text-blue-600 text-xs font-semibold">{t("driver.viewAll")}</button>
                  </div>
                  <div className="space-y-3">
                    {parkingAreas.map((park) => {
                      const total = park.totalSlots ?? 0;
                      const free = park.availableSlots ?? 0;
                      const pct = total > 0 ? free / total : 0;
                      const statusColor = pct > 0.2
                        ? 'text-blue-600 bg-blue-600/10'
                        : pct > 0.05
                        ? 'text-orange-500 bg-orange-50 dark:bg-orange-500/10'
                        : 'text-red-500 bg-red-50 dark:bg-red-500/10';
                      return (
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          key={park.floorName ?? park.zoneCode} 
                          className="bg-white dark:bg-[#121212] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex gap-3 items-center shadow-sm hover:border-blue-600/30 transition-all cursor-pointer"
                        >
                          <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 dark:border-gray-700">
                            <MapPin className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">{park.floorName ?? park.zoneCode}</h3>
                            <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{park.zoneCode ?? t("driver.zoneArea")} • {park.vehicleTypeCode ?? t("common.vehicleType")}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${statusColor}`}>
                                {t("driver.freeSlots", { free, total })}
                              </span>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg">
                                {t("driver.live")}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "ticket" && (
              <motion.div 
                key="ticket"
                variants={tabVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="px-6"
              >
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t("driver.myTicketsTitle")}</h2>
                <div className="space-y-4">
                  {ticketsData.map((ticket, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={ticket.id} 
                      className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600" />
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{ticket.id}</span>
                          <h3 className="font-bold text-gray-900 dark:text-white mt-1">{ticket.location}</h3>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${ticket.isActive ? 'bg-blue-600/10 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Car className="w-3 h-3" /> {t("common.plate")}</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{ticket.plate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><CreditCard className="w-3 h-3" /> {t("common.fee")}</p>
                          <p className={`font-semibold ${ticket.isActive ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>{ticket.price}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {t("driver.timeLabel")}</p>
                          <p className="font-medium text-gray-900 dark:text-white">{ticket.timeIn} {ticket.timeOut ? ` - ${ticket.timeOut}` : ` ${t("driver.currently")}`}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Bottom Nav */}
        <div className="absolute bottom-0 inset-x-0 bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 px-8 py-3 flex justify-between items-center z-40 rounded-b-[36px]">
          <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}>
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-semibold">{t("driver.home")}</span>
          </button>
          <div className="relative -top-6">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowQRScanner(true)} 
              className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/40 flex items-center justify-center hover:bg-blue-600/90 transition-all border-4 border-white dark:border-[#1A1A1A]"
            >
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                <QrCode className="w-7 h-7" />
              </motion.div>
            </motion.button>
          </div>
          <button onClick={() => setActiveTab("ticket")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'ticket' ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}>
            <Ticket className="w-6 h-6" />
            <span className="text-[10px] font-semibold">{t("driver.myTicketsTab")}</span>
          </button>
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-gray-300 dark:bg-gray-700 rounded-full z-50" />

        {/* QR Scanner Full Screen Modal */}
        <AnimatePresence>
          {showQRScanner && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black z-50 flex flex-col rounded-[36px] overflow-hidden"
            >
              {/* Camera View Simulation */}
              <div className="absolute inset-0 opacity-40">
                <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black"></div>
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="pt-12 px-6 flex justify-between items-center">
                  <button onClick={() => setShowQRScanner(false)} className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md">
                    <X className="w-6 h-6" />
                  </button>
                  <p className="text-white font-semibold">{t("driver.scanQR")}</p>
                  <div className="w-10"></div> {/* Spacer */}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-8">
                  <div className="relative w-64 h-64 mb-8">
                    {/* Scanner Frame */}
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-blue-600 rounded-tl-xl"></div>
                    <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-blue-600 rounded-tr-xl"></div>
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-blue-600 rounded-bl-xl"></div>
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-blue-600 rounded-br-xl"></div>
                    
                    {/* Scanning Line Animation */}
                    <motion.div 
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-0.5 bg-blue-600 shadow-[0_0_8px_#00C853] top-1/2 -translate-y-1/2"
                    />
                    
                    <div className="absolute inset-4 bg-white/5 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <ScanLine className="w-12 h-12 text-blue-600/50" />
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-white text-center mb-2">{t("driver.scanQRTitle")}</h2>
                  <p className="text-gray-400 text-center text-sm mb-12">{t("driver.scanQRDesc")}</p>

                  <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl backdrop-blur-md transition-colors border border-white/10">
                    <ImageIcon className="w-5 h-5" />
                    <span className="font-semibold text-sm">{t("driver.pickFromGallery")}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
             <motion.div 
               variants={screenVariants}
               initial="hidden"
               animate="show"
               exit="exit"
               className="absolute inset-0 bg-gray-50 dark:bg-[#121212] z-50 flex flex-col rounded-[36px]"
             >
               <div className="pt-12 pb-4 px-6 bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 shadow-sm shrink-0">
                 <button onClick={() => setShowSettings(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400">
                   <X className="w-5 h-5" />
                 </button>
                 <h2 className="font-bold text-xl text-gray-900 dark:text-white">{t("driver.settingsTitle")}</h2>
               </div>
               <div className="p-6">
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{t("driver.darkMode")}</span>
                      <ThemeToggle />
                    </div>
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
                      <LocaleSwitcher />
                    </div>
                    <div
                      className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => {
                        localStorage.removeItem("pbms_auth");
                        sessionStorage.removeItem("pbms_auth");
                        navigate("/login");
                      }}
                    >
                      <span className="text-sm font-semibold text-red-500">{t("common.logout")}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
               </div>
             </motion.div>
          )}
        </AnimatePresence>

        {/* Payment Modal */}
        <AnimatePresence>
          {showPayment && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end rounded-[36px]"
            >
              <motion.div 
                variants={modalVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="w-full bg-white dark:bg-[#1A1A1A] rounded-t-3xl p-6 shadow-2xl"
              >
                {paymentDone ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-6 gap-4"
                  >
                    <div className="w-16 h-16 bg-blue-600/15 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-9 h-9 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t("driver.paymentSuccessTitle")}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center">{t("driver.paymentThanks")}</p>
                  </motion.div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t("driver.paymentTitle")}</h3>
                      <button onClick={() => setShowPayment(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex justify-center mb-4">
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#121212] px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800">
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t("driver.autoPayVia")}</span>
                        <span className="text-blue-600 font-black text-lg tracking-tight">payOS</span>
                      </div>
                    </div>
                    <div className="flex justify-center mb-4">
                      <div className="w-48 h-48 bg-white border-4 border-blue-600/20 rounded-3xl flex items-center justify-center shadow-inner relative overflow-hidden">
                        <QrCode className="w-32 h-32 text-gray-800 relative z-10" />
                        <div className="absolute inset-0 bg-blue-600/5 z-0" />
                      </div>
                    </div>
                    <p className="text-center text-sm text-gray-400 mb-6">{t("driver.scanVietQR")}</p>
                    <div className="bg-gray-50 dark:bg-[#121212] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-2.5 mb-4">
                      {[
                        { label: t("driver.parkingLot"), value: "Vincom Center" },
                        { label: t("common.slot"), value: activeSession ? `${activeSession.zoneCode} - ${activeSession.slotId}` : "--" },
                        { label: t("driver.entryTimeLabel"), value: formatDateTime(activeSession?.entryTime) },
                        { label: t("driver.parkingFeeLabel"), value: formatMoney(activeSession?.estimatedFee), green: true },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between items-center">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{row.label}</span>
                          <span className={`text-sm font-bold ${row.green ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleConfirmPayment}
                      className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl hover:bg-blue-600/90 transition-all shadow-lg shadow-blue-600/25"
                    >
                      {t("driver.confirmPay", { fee: formatMoney(activeSession?.estimatedFee) })}
                    </motion.button>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Notification Panel */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div 
              variants={screenVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="absolute inset-0 bg-gray-50 dark:bg-[#121212] z-50 flex flex-col rounded-[36px]"
            >
              {/* Header */}
              <div className="pt-12 pb-4 px-6 bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-sm shrink-0">
                <h2 className="font-bold text-xl text-gray-900 dark:text-white">{t("notifications.title")}</h2>
                <div className="flex items-center gap-3">
                  <button className="text-sm font-semibold text-blue-600">{t("notifications.markAllRead")}</button>
                  <button onClick={() => setShowNotifications(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
                {notifications.map((notif, i) => {
                  const Icon = notif.type === 'session' ? Car : (notif.type === 'promotion' ? Tag : Bell);
                  return (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={notif.id} 
                      className={`p-4 rounded-2xl border ${notif.unread ? 'bg-white dark:bg-[#1A1A1A] border-gray-100 dark:border-gray-800 shadow-sm' : 'bg-gray-50 dark:bg-[#121212] border-transparent'} flex gap-3`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notif.type === 'session' ? 'bg-blue-600/10 text-blue-600' : 'bg-purple-500/10 text-purple-500'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className={`text-sm font-bold truncate ${notif.unread ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{notif.title}</h3>
                          {notif.unread && <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{notif.desc}</p>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">{formatDateTime(notif.time)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Utility Screens */}
        <AnimatePresence>
          {utilityScreen === "topup" && (
            <motion.div
              variants={screenVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="absolute inset-0 bg-gray-50 dark:bg-[#121212] z-50 flex flex-col rounded-[36px]"
            >
              <div className="pt-12 pb-4 px-6 bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 shadow-sm shrink-0">
                <button onClick={() => setUtilityScreen(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="font-bold text-xl text-gray-900 dark:text-white">{t("driver.wallet.topUpTitle")}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "none" }}>
                <DriverWalletPanel
                  userId={userId}
                  authToken={authToken}
                  balance={walletBalance}
                  onBalanceChange={setWalletBalance}
                  onSuccess={() => loadDataRef.current({ quiet: true }).catch(() => {})}
                  compact
                />
              </div>
            </motion.div>
          )}

          {/* Đặt chỗ Panel */}
          {utilityScreen === 'book' && (
            <motion.div
              variants={screenVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="absolute inset-0 bg-gray-50 dark:bg-[#121212] z-50 flex flex-col rounded-[36px]"
            >
              <div className="pt-12 pb-4 px-6 bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 shadow-sm shrink-0">
                <button onClick={() => setUtilityScreen(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="font-bold text-xl text-gray-900 dark:text-white">{t("driver.bookTitle")}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ scrollbarWidth: 'none' }}>
                <input
                  placeholder={t("driver.bookPlate")}
                  value={bookPlate}
                  onChange={(e) => setBookPlate(e.target.value.toUpperCase())}
                  className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 text-gray-900 dark:text-white"
                />
                <select
                  value={bookVehicleTypeId}
                  onChange={(e) => setBookVehicleTypeId(Number(e.target.value))}
                  className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 text-gray-900 dark:text-white"
                >
                  {bookingVehicleTypes.map((vt) => (
                    <option key={vt.vehicleTypeId} value={vt.vehicleTypeId}>{tv(vt.typeCode)}</option>
                  ))}
                </select>
                <select
                  value={bookZoneId}
                  onChange={(e) => setBookZoneId(e.target.value ? Number(e.target.value) : "")}
                  disabled={bookingZones.length === 0}
                  className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 text-gray-900 dark:text-white disabled:opacity-60"
                >
                  <option value="">{t("driver.autoZone")}</option>
                  {bookingZones.map((z) => (
                    <option key={z.zoneId} value={z.zoneId}>
                      {z.zoneName ?? z.zoneCode}
                      {z.availableSlots != null ? ` (${t("driver.freeCount", { count: z.availableSlots })})` : ""}
                    </option>
                  ))}
                </select>
                {bookingZones.length === 0 && (
                  <p className="text-xs text-amber-600">{t("driver.noZonesForVehicle")}</p>
                )}
                {bookMessage && (
                  <p className={`text-sm ${bookMessage === t("driver.bookSuccessExtended") || bookMessage === t("driver.bookSuccess") ? "text-green-600" : bookMessage ? "text-red-500" : ""}`}>{bookMessage}</p>
                )}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBookSlot}
                  disabled={bookSubmitting}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl disabled:opacity-60 flex justify-center gap-2"
                >
                  {bookSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("driver.confirmBook")}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Phản hồi Panel */}
          {utilityScreen === 'feedback' && (
            <motion.div
              variants={screenVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="absolute inset-0 bg-gray-50 dark:bg-[#121212] z-50 flex flex-col rounded-[36px]"
            >
              <div className="pt-12 pb-4 px-6 bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 shadow-sm shrink-0">
                <button onClick={() => setUtilityScreen(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="font-bold text-xl text-gray-900 dark:text-white">{t("driver.sendFeedback")}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ scrollbarWidth: 'none' }}>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 text-gray-900 dark:text-white"
                >
                  <option value="Suggestion">{t("driver.suggestion")}</option>
                  <option value="Complaint">{t("driver.complaint")}</option>
                  <option value="Praise">{t("driver.praise")}</option>
                </select>
                <textarea
                  rows={5}
                  placeholder={t("driver.feedbackContentPlaceholder")}
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 text-gray-900 dark:text-white resize-none"
                />
                {feedbackMessage && (
                  <p className={`text-sm ${feedbackMessage === t("driver.feedbackSuccess") ? "text-green-600" : "text-red-500"}`}>{feedbackMessage}</p>
                )}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSendFeedback}
                  disabled={feedbackSubmitting}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl disabled:opacity-60 flex justify-center gap-2"
                >
                  {feedbackSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("driver.submitFeedback")}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Lịch sử giao dịch Panel */}
          {utilityScreen === 'history' && (
            <motion.div 
              variants={screenVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="absolute inset-0 bg-gray-50 dark:bg-[#121212] z-50 flex flex-col rounded-[36px]"
            >
              <div className="pt-12 pb-4 px-6 bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 shadow-sm shrink-0">
                <button onClick={() => setUtilityScreen(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="font-bold text-xl text-gray-900 dark:text-white">{t("driver.txHistory")}</h2>
              </div>
              
              <div className="px-6 py-4 bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-gray-800 shrink-0 overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: 'none' }}>
                <div className="flex gap-2">
                  {TX_FILTERS.map((filter) => {
                    const labelKey = filter === "all" ? "driver.txFilterAll" : filter === "topup" ? "driver.txFilterTopUp" : filter === "payment" ? "driver.txFilterPayment" : "driver.txFilterRefund";
                    return (
                    <button
                      key={filter}
                      onClick={() => setHistoryFilter(filter)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${historyFilter === filter ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                      {t(labelKey)}
                    </button>
                  );})}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3" style={{ scrollbarWidth: 'none' }}>
                <AnimatePresence mode="popLayout">
                  {transactionHistory.filter(tx => historyFilter === "all" || tx.type === historyFilter).map((tx, i) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      transition={{ delay: i * 0.05 }}
                      key={tx.id} 
                      className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-4 shadow-sm"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${tx.isPositive ? 'bg-blue-600/10 text-blue-600' : 'bg-red-500/10 text-red-500'}`}>
                        {tx.isPositive ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{tx.typeLabel}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{tx.time} • {tx.method}</p>
                      </div>
                      <div className={`font-bold text-base shrink-0 ${tx.isPositive ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>
                        {tx.amount}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Xe của tôi Panel */}
          {utilityScreen === 'vehicles' && (
            <motion.div 
              variants={screenVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="absolute inset-0 bg-gray-50 dark:bg-[#121212] z-50 flex flex-col rounded-[36px]"
            >
              <div className="pt-12 pb-4 px-6 bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 shadow-sm shrink-0">
                <button onClick={() => setUtilityScreen(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <h2 className="font-bold text-xl text-gray-900 dark:text-white">{t("driver.myVehiclesTitle")}</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ scrollbarWidth: 'none' }}>
                {myVehicles.map((vehicle, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={vehicle.id} 
                    className={`bg-white dark:bg-[#1A1A1A] p-5 rounded-2xl border-2 transition-colors shadow-sm relative overflow-hidden ${vehicle.isParking ? 'border-blue-600' : 'border-gray-100 dark:border-gray-800'}`}
                  >
                    {vehicle.isParking && (
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                        {t("driver.parkingNow")}
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${vehicle.isParking ? 'bg-blue-600/10 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                          <Car className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-mono text-lg font-bold text-gray-900 dark:text-white">{vehicle.plate}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{vehicle.type}</p>
                        </div>
                      </div>
                    </div>
                    
                    {vehicle.isParking && (
                      <div className="bg-gray-50 dark:bg-[#121212] rounded-xl p-3 space-y-2 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{vehicle.location}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{vehicle.time}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="p-6 bg-white dark:bg-[#1A1A1A] border-t border-gray-100 dark:border-gray-800 shrink-0">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-blue-600/10 text-blue-600 border-2 border-blue-600 border-dashed font-bold py-4 rounded-2xl hover:bg-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  {t("driver.addVehicle")}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Demo back button */}
      <button
        onClick={() => {
          clearAuth();
          navigate("/login");
        }}
        className="absolute top-8 left-8 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-md font-medium text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        ← {t("common.backToLogin")}
      </button>
    </div>
  );
}