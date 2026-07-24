import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Camera, Car, CheckCircle, Clock, CreditCard, LogOut, MapPin, ShieldAlert, List, Calendar, X, Ticket } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { NotificationDropdown } from "./NotificationDropdown";
import { ParkingSlotMap } from "./ParkingSlotMap";
import type { StaffFloor, StaffFloorSlot } from "../lib/parkingFloors";
import { VehicleLocator } from "./VehicleLocator";
import { PlateCameraScanner } from "./PlateCameraScanner";
import { useNavigate } from "react-router";
import { apiGet, apiPost, isNetworkError, isTimeoutError } from "../lib/api";
import { clearAuth, getAuth } from "../lib/auth";
import { stopRealtimeConnection } from "../lib/realtime";
import { preloadOcrWorker, terminateOcrWorker, normalizePlateDisplay } from "../lib/licensePlateOcr";
import { RealtimeEventTypes } from "../lib/realtime";
import { useLocale } from "../lib/i18n/LocaleContext";
import { bookableVehicleTypes, type BookVehicleType } from "../lib/bookZones";
import { toDriverErrorMessage } from "../lib/driverErrors";
import { useStableLoader } from "../lib/hooks/useStableLoader";
import { TAB_ACTIVE, TAB_INACTIVE } from "../lib/uiClasses";
import { ErrorBanner } from "./ErrorBanner";

type Tab = "control" | "locate" | "violations" | "history" | "reservations";

type Incident = {
  incidentId: number;
  incidentType: string;
  description: string | null;
  status: string;
  createdAt: string;
  plate: string | null;
};

type SessionHistory = {
  sessionId: number;
  ticketCode: string;
  licensePlate: string;
  slotId: string;
  entryTime: string;
  exitTime: string | null;
  status: string;
  totalFee: number | null;
  zoneCode: string;
};

type StaffReservation = {
  reservationId: number;
  licensePlate: string;
  userName: string;
  vehicleType: string;
  zoneCode: string | null;
  slotId: string | null;
  reservedFrom: string;
  reservedTo: string;
  status: string;
};

const PAYMENT_METHODS = ["Cash", "BankTransfer", "EWallet"] as const;
const INCIDENT_TYPES = ["WrongZone", "SlotOccupied", "WrongPlate", "Overstay", "Unpaid", "LostTicket", "Other"] as const;

/** Pending checkout context — populated before opening the modal */
type CheckoutPending = {
  sessionId: number;
  licensePlate: string;
  slotId: string;
  entryTime: string;
  coveredBySubscription?: boolean;
  estimatedFee?: number;
};

export function StaffDashboard() {
  const navigate = useNavigate();
  const { t, formatMoney, formatDateTime, ts, tp, tv } = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>("control");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [plate, setPlate] = useState("");
  const [result, setResult] = useState<string>("");
  const [actionError, setActionError] = useState("");
  const [apiOffline, setApiOffline] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [floors, setFloors] = useState<StaffFloor[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<number | null>(null);
  const [violations, setViolations] = useState<Incident[]>([]);
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [historyFilter, setHistoryFilter] = useState("");
  
  const [vehicleTypes, setVehicleTypes] = useState<BookVehicleType[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<number | "">("");
  const [selectedGate, setSelectedGate] = useState<string>("Gate-A");

  const staffVehicleTypes = bookableVehicleTypes(vehicleTypes);
  
  const [vPlate, setVPlate] = useState("");
  const [vType, setVType] = useState("WrongZone");
  const [vNote, setVNote] = useState("");
  const [vPenalty, setVPenalty] = useState("");
  const [ticketCode, setTicketCode] = useState("");
  const [reservations, setReservations] = useState<StaffReservation[]>([]);

  // ── Checkout modal state ──────────────────────────────────────────────────
  const [checkoutPending, setCheckoutPending] = useState<CheckoutPending | null>(null);
  const [modalPaymentMethod, setModalPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>("Cash");
  const [modalLostTicket, setModalLostTicket] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  // ─────────────────────────────────────────────────────────────────────────

  const auth = getAuth();
  const authToken = auth?.token ?? "";
  const authRole = auth?.roleName?.toLowerCase() ?? "";
  const staffError = (e: unknown, fallback: string) => toDriverErrorMessage(e, t, fallback);

  async function loadFloors() {
    const data = await apiGet<StaffFloor[]>("/api/portal/staff/floors", authToken);
    setFloors(data);
    if (data.length > 0) setActiveFloorId((id) => id ?? data[0].floorId);
  }

  async function loadViolations() {
    setViolations(await apiGet<Incident[]>("/api/portal/staff/violations", authToken));
  }

  async function loadHistory() {
    setHistory(await apiGet<SessionHistory[]>("/api/portal/staff/history", authToken));
  }

  async function loadReservations() {
    setReservations(await apiGet<StaffReservation[]>("/api/portal/staff/reservations", authToken));
  }

  async function loadVehicleTypes() {
    const data = await apiGet<BookVehicleType[]>("/api/vehicle-types?status=Active", authToken);
    setVehicleTypes(data);
    const bookable = bookableVehicleTypes(data);
    if (bookable.length > 0) {
      setSelectedVehicleType((prev) =>
        bookable.some((v) => v.vehicleTypeId === prev) ? prev : bookable[0].vehicleTypeId,
      );
    }
  }

  const loadAll = useCallback(async (opts?: { quiet?: boolean }) => {
    try {
      await loadFloors();
      setApiOffline(false);
      if (!opts?.quiet) setActionError("");
    } catch (e) {
      if (!opts?.quiet) {
        if (isNetworkError(e) || isTimeoutError(e)) setApiOffline(true);
        else setActionError(staffError(e, t("staff.loadFailed")));
      }
      return;
    }
    await Promise.allSettled([
      loadViolations(),
      loadHistory(),
      loadVehicleTypes(),
      loadReservations(),
    ]);
  }, [authToken, t]);

  const { reload, reloadQuiet } = useStableLoader(loadAll, [
    RealtimeEventTypes.SlotUpdated,
    RealtimeEventTypes.SessionCheckedIn,
    RealtimeEventTypes.SessionCheckedOut,
    RealtimeEventTypes.ReservationUpdated,
    RealtimeEventTypes.IncidentUpdated,
  ]);

  useEffect(() => {
    if (!authToken || authRole !== "staff") {
      navigate("/login");
      return;
    }
    reload().catch((e) => {
      if (isNetworkError(e) || isTimeoutError(e)) setApiOffline(true);
      else setActionError(staffError(e, t("staff.loadFailed")));
    });
    preloadOcrWorker(authToken).catch(() => {});
  }, [navigate, authToken, authRole, t, reload]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Check-in: always creates a new session ──────────────────────────────
  async function doCheckIn(rawPlate: string, options?: { reservationId?: number; vehicleTypeId?: number }): Promise<boolean> {
    // rawApiPlate: strip all whitespace for DB/API matching (backend normalizes the same way)
    const rawApiPlate = rawPlate.trim().toUpperCase().replace(/\s+/g, "");
    // displayPlate: formatted for UI messages only
    const displayPlate = normalizePlateDisplay(rawPlate).trim().toUpperCase() || rawApiPlate;
    if (!rawApiPlate) return false;
    setLoadingAction(true);
    setActionError("");
    setResult("");
    try {
      let vehicleTypeId = options?.vehicleTypeId;
      let reservationId = options?.reservationId ?? null;

      if (!reservationId) {
        // Auto-lookup active reservation for this plate using the stripped plate
        const reservation = await apiGet<{ reservationId: number; vehicleTypeId: number; status: string } | null>(
          `/api/reservations/by-plate/${encodeURIComponent(rawApiPlate)}`,
          authToken,
        ).catch(() => null);

        if (reservation?.reservationId) {
          reservationId = reservation.reservationId;
          vehicleTypeId = vehicleTypeId ?? reservation.vehicleTypeId;
        }
      }

      vehicleTypeId = vehicleTypeId ?? Number(selectedVehicleType);
      if (!vehicleTypeId) throw new Error(t("staff.selectVehicleError"));
      const checkIn = await apiPost<{ slotId: string }>(
        "/api/parking-sessions/check-in",
        {
          licensePlate: rawApiPlate,
          vehicleTypeId,
          entryStaffId: auth?.userId,
          entryGate: selectedGate,
          reservationId,
        },
        authToken,
      );
      
      const successMsg = t("staff.checkinSuccess", { plate: displayPlate, slot: checkIn.slotId });
      setResult(reservationId ? `${successMsg} (Từ đặt chỗ)` : successMsg);
      
      setPlate("");
      await reloadQuiet();
      return true;
    } catch (e) {
      setActionError(staffError(e, t("staff.plateFailed")));
      return false;
    } finally {
      setLoadingAction(false);
    }
  }

  // ── Open checkout modal: fetch active session then show modal ─────────────
  async function openCheckoutModal(rawPlate: string) {
    const rawApiPlate = rawPlate.trim().toUpperCase().replace(/\s+/g, "");
    if (!rawApiPlate) return;
    setLoadingAction(true);
    setActionError("");
    setResult("");
    try {
      const active = await apiGet<{
        sessionId: number;
        licensePlate: string;
        slotId: string;
        entryTime: string;
        coveredBySubscription?: boolean;
        estimatedFee?: number;
      } | null>(
        `/api/parking-sessions/active/${encodeURIComponent(rawApiPlate)}`,
        authToken,
      ).catch(() => null);

      if (!active?.sessionId) {
        setActionError(t("staff.noActiveSession") || `No active session found for ${rawApiPlate}`);
        return;
      }
      setModalPaymentMethod("Cash");
      setModalLostTicket(false);
      setModalError("");
      setCheckoutPending({
        sessionId:   active.sessionId,
        licensePlate: active.licensePlate,
        slotId:      active.slotId,
        entryTime:   active.entryTime,
        coveredBySubscription: active.coveredBySubscription,
        estimatedFee: active.estimatedFee,
      });
    } catch (e) {
      setActionError(staffError(e, t("staff.plateFailed")));
    } finally {
      setLoadingAction(false);
    }
  }

  // ── Open modal from occupied slot (already has session data) ──────────────
  function openCheckoutModalFromSlot(slot: StaffFloorSlot) {
    if (!slot.activeSession) return;
    if (!slot.activeSession.sessionId) {
      // sessionId not embedded in slot data — look it up via plate
      void openCheckoutModal(slot.activeSession.licensePlate);
      return;
    }
    setModalPaymentMethod("Cash");
    setModalLostTicket(false);
    setModalError("");
    setCheckoutPending({
      sessionId:    slot.activeSession.sessionId,
      licensePlate: slot.activeSession.licensePlate,
      slotId:       slot.slotId,
      entryTime:    slot.activeSession.entryTime,
    });
  }

  // ── Confirm checkout from modal ───────────────────────────────────────────
  async function confirmCheckout() {
    if (!checkoutPending || !auth) return;
    setModalLoading(true);
    setModalError("");
    try {
      const out = await apiPost<{ totalFee: number; coveredBySubscription?: boolean }>(
        `/api/parking-sessions/${checkoutPending.sessionId}/check-out`,
        {
          paymentMethod: modalPaymentMethod,
          exitStaffId:   auth.userId,
          exitGate:      selectedGate,
          lostTicket:    modalLostTicket,
        },
        authToken,
      );
      setCheckoutPending(null);
      setResult(t("staff.checkoutSuccess", {
        plate: checkoutPending.licensePlate,
        fee: formatMoney(out.totalFee),
      }));
      await reloadQuiet();
    } catch (e) {
      setModalError(staffError(e, t("staff.plateFailed")));
    } finally {
      setModalLoading(false);
    }
  }

  // ── Smart plate submit: check-in if no active session, else open modal ───
  async function processPlate(rawPlate: string, options?: { reservationId?: number; vehicleTypeId?: number }): Promise<boolean> {
    const rawApiPlate = rawPlate.trim().toUpperCase().replace(/\s+/g, "");
    if (!rawApiPlate) return false;
    setLoadingAction(true);
    setActionError("");
    setResult("");
    try {
      const active = await apiGet<{ sessionId: number } | null>(
        `/api/parking-sessions/active/${encodeURIComponent(rawApiPlate)}`,
        authToken,
      ).catch(() => null);

      if (active?.sessionId) {
        // Has active session → open confirmation modal instead of auto-checkout
        setLoadingAction(false);
        await openCheckoutModal(rawApiPlate);
        return true;
      } else {
        return await doCheckIn(rawPlate, options);
      }
    } catch (e) {
      setActionError(staffError(e, t("staff.plateFailed")));
      return false;
    } finally {
      setLoadingAction(false);
    }
  }

  // ── Ticket code search: find session info only, open modal if active ─────
  async function processTicketCode() {
    const code = ticketCode.trim();
    if (!code || !auth) return;
    setLoadingAction(true);
    setActionError("");
    setResult("");
    try {
      const session = await apiGet<{
        sessionId: number;
        licensePlate: string;
        slotId: string;
        entryTime: string;
        status: string;
        coveredBySubscription?: boolean;
        estimatedFee?: number;
      }>(
        `/api/parking-sessions/ticket/${encodeURIComponent(code)}`,
        authToken,
      );
      if (session.status === "Active") {
        // Show checkout modal — do NOT auto-checkout
        setModalPaymentMethod("Cash");
        setModalLostTicket(false);
        setModalError("");
        setCheckoutPending({
          sessionId:            session.sessionId,
          licensePlate:         session.licensePlate,
          slotId:               session.slotId,
          entryTime:            session.entryTime,
          coveredBySubscription: session.coveredBySubscription,
          estimatedFee:          session.estimatedFee,
        });
        setTicketCode("");
      } else {
        setResult(t("staff.ticketResult", { code, plate: session.licensePlate, status: ts(session.status) }));
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t("staff.ticketNotFound"));
    } finally {
      setLoadingAction(false);
    }
  }

  async function checkInReservation(r: StaffReservation) {
    const vt = staffVehicleTypes.find(
      (v) =>
        v.typeCode.toLowerCase() === r.vehicleType.toLowerCase() ||
        v.typeName.toLowerCase() === r.vehicleType.toLowerCase(),
    );
    await doCheckIn(r.licensePlate, {
      reservationId: r.reservationId,
      vehicleTypeId: vt?.vehicleTypeId ?? Number(selectedVehicleType),
    });
  }

  async function submitViolation(e: React.FormEvent) {
    e.preventDefault();
    if (!vPlate.trim()) return;
    try {
      // Find active session for this plate to link the violation
      const active = await apiGet<{ sessionId: number } | null>(
        `/api/parking-sessions/active/${encodeURIComponent(vPlate.trim().toUpperCase())}`,
        authToken,
      ).catch(() => null);

      await apiPost(
        "/api/incidents",
        {
          incidentType: vType,
          description: vNote || "From staff dashboard",
          penaltyFee: Number(vPenalty) || 0,
          reportedById: auth?.userId,
          sessionId: active?.sessionId ?? null,
        },
        authToken,
      );
      setVPlate("");
      setVType("WrongZone");
      setVNote("");
      setVPenalty("");
      await loadViolations();
      setResult(t("staff.violationSuccess"));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t("staff.violationFailed"));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <header className="h-16 bg-white dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Car className="w-5 h-5 text-blue-600" />
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">{t("staff.title")}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(currentTime)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LocaleSwitcher compact />
          <ThemeToggle />
          <NotificationDropdown />
          <button
            onClick={() => {
              clearAuth();
              void stopRealtimeConnection();
              void terminateOcrWorker();
              navigate("/login");
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            title={t("common.logout")}
          >
            <LogOut className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <div className="flex gap-3">
          {([
            { id: "control" as const, icon: Camera, label: t("staff.control") },
            { id: "locate" as const, icon: MapPin, label: t("staff.locateTab") },
            { id: "violations" as const, icon: ShieldAlert, label: t("staff.violationsTab") },
            { id: "history" as const, icon: List, label: t("staff.historyTab") },
            { id: "reservations" as const, icon: Calendar, label: t("staff.reservationsTab") },
          ]).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === id ? TAB_ACTIVE : TAB_INACTIVE}`}
            >
              <Icon className="w-4 h-4 inline mr-2" />
              {label}
            </button>
          ))}
        </div>

        <ErrorBanner offline={apiOffline && floors.length === 0} offlineMessage={t("common.networkError")} />
        <ErrorBanner error={actionError} />
        {result && activeTab !== "control" && (
          <div className="text-sm text-green-700 bg-green-50 dark:bg-green-500/10 p-3 rounded-lg">{result}</div>
        )}

        {activeTab === "control" && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-[360px] shrink-0 space-y-4">
              <PlateCameraScanner
                authToken={authToken}
                disabled={loadingAction}
                scanPlate={plate}
                onScanPlateChange={setPlate}
                onScan={processPlate}
              />

              <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
                <h2 className="font-bold text-gray-900 dark:text-white mb-3">{t("staff.manualEntry")}</h2>
                <form
                  className="space-y-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await processPlate(plate);
                  }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedVehicleType}
                      onChange={(e) => setSelectedVehicleType(e.target.value ? Number(e.target.value) : "")}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-gray-50 dark:bg-[#121212] text-sm"
                      required
                    >
                      <option value="" disabled>{t("staff.selectVehicle")}</option>
                      {staffVehicleTypes.map((v) => (
                        <option key={v.vehicleTypeId} value={v.vehicleTypeId}>{tv(v.typeCode)}</option>
                      ))}
                    </select>
                    <select
                      value={selectedGate}
                      onChange={(e) => setSelectedGate(e.target.value)}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-gray-50 dark:bg-[#121212] text-sm"
                    >
                      <option value="Gate-A">{t("staff.gateA")}</option>
                      <option value="Gate-B">{t("staff.gateB")}</option>
                      <option value="Gate-VIP">{t("staff.gateVip")}</option>
                    </select>
                  </div>
                  <input
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    placeholder={t("staff.platePlaceholder")}
                    className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 font-mono uppercase"
                  />
                  <button
                    disabled={loadingAction || !plate.trim()}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
                  >
                    {loadingAction ? t("staff.processing") : t("staff.writePlate")}
                  </button>
                </form>
              </div>

              <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">{t("staff.ticketSearch")}</h3>
                <div className="flex gap-2">
                  <input
                    value={ticketCode}
                    onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                    placeholder={t("staff.ticketPlaceholder")}
                    className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-gray-50 dark:bg-[#121212] text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={processTicketCode}
                    disabled={loadingAction || !ticketCode.trim()}
                    className="px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                  >
                    {t("staff.find")}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-4">
              <AnimatePresence mode="popLayout">
                {result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl p-4 border-2 border-blue-600/25 bg-blue-600/5 dark:bg-blue-600/10 flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-600 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <p className="flex-1 text-sm font-medium text-gray-900 dark:text-white pt-2">{result}</p>
                    <button type="button" onClick={() => setResult("")} className="p-2 text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-center text-sm text-gray-400"
                  >
                    {t("staff.noResultYet")}
                  </motion.div>
                )}
              </AnimatePresence>

              <ParkingSlotMap
                floors={floors}
                activeFloorId={activeFloorId}
                onFloorChange={setActiveFloorId}
                onOccupiedSlotClick={openCheckoutModalFromSlot}
              />
            </div>
          </div>
        )}

        {/* ── Checkout Confirmation Modal ─────────────────────────────────── */}
        <AnimatePresence>
          {checkoutPending && (
            <motion.div
              key="checkout-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={(e) => { if (e.target === e.currentTarget && !modalLoading) setCheckoutPending(null); }}
            >
              <motion.div
                key="checkout-modal"
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ type: "spring", duration: 0.35 }}
                className="w-full max-w-md bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-red-500" />
                    <h2 className="font-bold text-gray-900 dark:text-white">{t("staff.checkoutConfirm") || "Xác nhận Check-out"}</h2>
                  </div>
                  <button
                    onClick={() => !modalLoading && setCheckoutPending(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Session info */}
                <div className="px-5 py-4 space-y-3">
                  <div className="bg-gray-50 dark:bg-[#121212] rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">{t("common.plate") || "Biển số"}</span>
                      <span className="font-mono font-bold text-base">{checkoutPending.licensePlate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">{t("common.slot") || "Vị trí"}</span>
                      <span className="font-semibold">{checkoutPending.slotId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{t("slots.checkInLabel") || "Giờ vào"}</span>
                      <span className="text-xs">{formatDateTime(checkoutPending.entryTime)}</span>
                    </div>
                    {checkoutPending.estimatedFee !== undefined && (
                      <div className="flex justify-between items-center pt-1 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-gray-500">{t("staff.estimatedFee") || "Phí ước tính"}</span>
                        <span className="font-bold text-blue-600">{formatMoney(checkoutPending.estimatedFee)}</span>
                      </div>
                    )}
                  </div>

                  {/* Subscription badge */}
                  {checkoutPending.coveredBySubscription && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                      <Ticket className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        {t("staff.subscriptionCovered") || "Đã mua vé tháng — phí gửi xe miễn phí"}
                      </span>
                    </div>
                  )}

                  {/* Payment method */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {t("staff.paymentMethod") || "Phương thức thanh toán"}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {PAYMENT_METHODS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setModalPaymentMethod(m)}
                          className={`py-2 rounded-xl text-sm font-semibold border transition-all ${
                            modalPaymentMethod === m
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white dark:bg-[#121212] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400"
                          }`}
                        >
                          {tp(m)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lost ticket */}
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={modalLostTicket}
                      onChange={(e) => setModalLostTicket(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{t("staff.lostTicket") || "Mất vé"}</span>
                  </label>

                  {/* Error */}
                  {modalError && (
                    <div className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl">{modalError}</div>
                  )}

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => !modalLoading && setCheckoutPending(null)}
                      disabled={modalLoading}
                      className="py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                    >
                      {t("common.cancel") || "Hủy"}
                    </button>
                    <button
                      type="button"
                      onClick={confirmCheckout}
                      disabled={modalLoading}
                      className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      {modalLoading ? (t("staff.processing") || "Đang xử lý...") : (t("slots.checkoutBtn") || "Xác nhận Checkout")}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {activeTab === "locate" && <VehicleLocator authToken={authToken} />}

        {activeTab === "violations" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold mb-4">{t("staff.recordViolation")}</h2>
              <form onSubmit={submitViolation} className="space-y-3">
                <input
                  value={vPlate}
                  onChange={(e) => setVPlate(e.target.value.toUpperCase())}
                  placeholder={t("common.plate")}
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#121212]"
                />
                <select
                  value={vType}
                  onChange={(e) => setVType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#121212]"
                >
                  {INCIDENT_TYPES.map((type) => (
                    <option key={type} value={type}>{t(`incident.${type}`)}</option>
                  ))}
                </select>
                <textarea
                  value={vNote}
                  onChange={(e) => setVNote(e.target.value)}
                  placeholder={t("staff.description")}
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#121212]"
                />
                <input
                  type="number"
                  min={0}
                  value={vPenalty}
                  onChange={(e) => setVPenalty(e.target.value)}
                  placeholder={t("staff.penaltyFee")}
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#121212]"
                />
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  {t("staff.saveViolation")}
                </button>
              </form>
            </section>

            <section className="lg:col-span-2 bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold mb-4">{t("staff.violationList")}</h2>
              <div className="overflow-auto max-h-[520px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                      <th className="py-2">{t("staff.code")}</th>
                      <th className="py-2">{t("common.plate")}</th>
                      <th className="py-2">{t("staff.type")}</th>
                      <th className="py-2">{t("common.time")}</th>
                      <th className="py-2">{t("common.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {violations.map((v) => (
                      <tr key={v.incidentId} className="border-b border-gray-100 dark:border-gray-900">
                        <td className="py-2">INC-{v.incidentId}</td>
                        <td className="py-2 font-mono">{v.plate ?? "-"}</td>
                        <td className="py-2">{t(`incident.${v.incidentType}`)}</td>
                        <td className="py-2">{formatDateTime(v.createdAt)}</td>
                        <td className="py-2">{ts(v.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === "reservations" && (
          <section className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold mb-4">{t("staff.reservationsTitle")}</h2>
            <div className="overflow-auto max-h-[560px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2">{t("common.plate")}</th>
                    <th className="py-2">{t("staff.customer")}</th>
                    <th className="py-2">{t("common.vehicleType")}</th>
                    <th className="py-2">{t("staff.zoneSlot")}</th>
                    <th className="py-2">{t("staff.from")}</th>
                    <th className="py-2">{t("common.status")}</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.reservationId} className="border-b border-gray-100 dark:border-gray-900">
                      <td className="py-2 font-mono">{r.licensePlate}</td>
                      <td className="py-2">{r.userName}</td>
                      <td className="py-2">{r.vehicleType}</td>
                      <td className="py-2">{r.zoneCode ?? "-"} {r.slotId ?? ""}</td>
                      <td className="py-2">{formatDateTime(r.reservedFrom)}</td>
                      <td className="py-2">{ts(r.status)}</td>
                      <td className="py-2">
                        {(r.status === "Confirmed" || r.status === "Pending") && (
                          <button
                            onClick={() => checkInReservation(r)}
                            disabled={loadingAction}
                            className="text-blue-600 hover:underline text-xs font-semibold"
                          >
                            {t("staff.checkIn")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {reservations.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-gray-400">{t("staff.reservationsEmpty")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "history" && (
          <section className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">{t("staff.historyTitle")}</h2>
              <input
                type="text"
                placeholder={t("staff.historySearch")}
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm w-64 bg-gray-50 dark:bg-[#121212]"
              />
            </div>
            <div className="overflow-auto max-h-[560px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2">{t("common.ticket")}</th>
                    <th className="py-2">{t("common.plate")}</th>
                    <th className="py-2">{t("common.slot")}</th>
                    <th className="py-2">{t("staff.entryTime")}</th>
                    <th className="py-2">{t("staff.exitTime")}</th>
                    <th className="py-2">{t("common.status")}</th>
                    <th className="py-2">{t("common.fee")}</th>
                  </tr>
                </thead>
                <tbody>
                  {history
                    .filter(h => !historyFilter || 
                      h.licensePlate.includes(historyFilter.toUpperCase()) || 
                      h.ticketCode.includes(historyFilter) || 
                      h.slotId.includes(historyFilter))
                    .map((h) => (
                    <tr key={h.sessionId} className="border-b border-gray-100 dark:border-gray-900">
                      <td className="py-2">{h.ticketCode}</td>
                      <td className="py-2 font-mono">{h.licensePlate}</td>
                      <td className="py-2">{h.slotId}</td>
                      <td className="py-2">{formatDateTime(h.entryTime)}</td>
                      <td className="py-2">{formatDateTime(h.exitTime)}</td>
                      <td className="py-2">{ts(h.status)}</td>
                      <td className="py-2">{h.totalFee != null ? formatMoney(h.totalFee) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}