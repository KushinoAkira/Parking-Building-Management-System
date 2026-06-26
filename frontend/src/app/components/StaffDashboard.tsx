import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, Car, CheckCircle, LogOut, ShieldAlert, List, Calendar, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { NotificationDropdown } from "./NotificationDropdown";
import { ParkingSlotMap } from "./ParkingSlotMap";
import type { StaffFloor } from "../lib/parkingFloors";
import { PlateCameraScanner } from "./PlateCameraScanner";
import { useNavigate } from "react-router";
import { apiGet, apiPost, isNetworkError, isTimeoutError } from "../lib/api";
import { clearAuth, getAuth } from "../lib/auth";
import { stopRealtimeConnection } from "../lib/realtime";
import { preloadOcrWorker, terminateOcrWorker, normalizePlateDisplay } from "../lib/licensePlateOcr";
import { useRealtimeRefresh } from "../lib/RealtimeContext";
import { RealtimeEventTypes } from "../lib/realtime";
import { useLocale } from "../lib/i18n/LocaleContext";

type Tab = "control" | "violations" | "history" | "reservations";

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

export function StaffDashboard() {
  const navigate = useNavigate();
  const { t, formatMoney, formatDateTime, ts, tp } = useLocale();
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
  
  const [vehicleTypes, setVehicleTypes] = useState<{vehicleTypeId: number, typeName: string}[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<number | "">("");
  const [selectedGate, setSelectedGate] = useState<string>("Gate-A");
  
  const [vPlate, setVPlate] = useState("");
  const [vType, setVType] = useState("WrongZone");
  const [vNote, setVNote] = useState("");
  const [vPenalty, setVPenalty] = useState("");
  const [lostTicket, setLostTicket] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>("Cash");
  const [ticketCode, setTicketCode] = useState("");
  const [reservations, setReservations] = useState<StaffReservation[]>([]);

  const auth = getAuth();
  const authToken = auth?.token ?? "";
  const authRole = auth?.roleName?.toLowerCase() ?? "";

  function staffErrorMessage(e: unknown, fallback: string) {
    if (isNetworkError(e)) return t("common.networkError");
    if (isTimeoutError(e)) return t("common.timeoutError");
    return e instanceof Error ? e.message : fallback;
  }

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
    try {
      const data = await apiGet<{vehicleTypeId: number, typeName: string}[]>("/api/vehicle-types", authToken);
      setVehicleTypes(data);
      if (data.length > 0) setSelectedVehicleType(data[0].vehicleTypeId);
    } catch {
      // Ignore
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
        else setActionError(staffErrorMessage(e, t("staff.loadFailed")));
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

  const loadAllRef = useRef(loadAll);
  loadAllRef.current = loadAll;

  useEffect(() => {
    if (!authToken || authRole !== "staff") {
      navigate("/login");
      return;
    }
    loadAllRef.current().catch((e) => {
      if (isNetworkError(e) || isTimeoutError(e)) setApiOffline(true);
      else setActionError(staffErrorMessage(e, t("staff.loadFailed")));
    });
    preloadOcrWorker(authToken).catch(() => {});
  }, [navigate, authToken, authRole, t]);

  useRealtimeRefresh(
    [
      RealtimeEventTypes.SlotUpdated,
      RealtimeEventTypes.SessionCheckedIn,
      RealtimeEventTypes.SessionCheckedOut,
      RealtimeEventTypes.ReservationUpdated,
      RealtimeEventTypes.IncidentUpdated,
    ],
    () => {
      loadAllRef.current({ quiet: true }).catch(() => {});
    },
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function processPlate(rawPlate: string, options?: { reservationId?: number; vehicleTypeId?: number }): Promise<boolean> {
    const normalizedPlate = normalizePlateDisplay(rawPlate).trim().toUpperCase();
    if (!normalizedPlate) return false;
    setLoadingAction(true);
    setActionError("");
    setResult("");

    try {
      const active = await apiGet<{ sessionId: number } | null>(
        `/api/parking-sessions/active/${encodeURIComponent(normalizedPlate)}`,
        authToken,
      ).catch(() => null);

      if (active?.sessionId) {
        const out = await apiPost<{ totalFee: number }>(
          `/api/parking-sessions/${active.sessionId}/check-out`,
          {
            paymentMethod,
            exitStaffId: auth?.userId,
            exitGate: selectedGate,
            lostTicket,
          },
          authToken,
        );
        setResult(t("staff.checkoutSuccess", { plate: normalizedPlate, fee: formatMoney(out.totalFee) }));
      } else {
        const vehicleTypeId = options?.vehicleTypeId ?? Number(selectedVehicleType);
        if (!vehicleTypeId) throw new Error(t("staff.selectVehicleError"));
        const checkIn = await apiPost<{ slotId: string }>(
          "/api/parking-sessions/check-in",
          {
            licensePlate: normalizedPlate,
            vehicleTypeId,
            entryStaffId: auth?.userId,
            entryGate: selectedGate,
            reservationId: options?.reservationId ?? null,
          },
          authToken,
        );
        setResult(t("staff.checkinSuccess", { plate: normalizedPlate, slot: checkIn.slotId }));
      }

      setPlate("");
      setLostTicket(false);
      await loadAllRef.current({ quiet: true });
      return true;
    } catch (e) {
      setActionError(staffErrorMessage(e, t("staff.plateFailed")));
      return false;
    } finally {
      setLoadingAction(false);
    }
  }

  async function processTicketCode() {
    const code = ticketCode.trim();
    if (!code || !auth) return;
    setLoadingAction(true);
    setActionError("");
    setResult("");
    try {
      const session = await apiGet<{ sessionId: number; licensePlate: string; status: string }>(
        `/api/parking-sessions/ticket/${encodeURIComponent(code)}`,
        authToken,
      );
      if (session.status === "Active") {
        await processPlate(session.licensePlate);
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
    const vt = vehicleTypes.find((v) => v.typeName.toLowerCase().includes(r.vehicleType.toLowerCase()));
    await processPlate(r.licensePlate, {
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
          <button
            onClick={() => setActiveTab("control")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === "control" ? "bg-blue-600 text-white" : "bg-white dark:bg-[#1A1A1A]"}`}
          >
            <Camera className="w-4 h-4 inline mr-2" />
            {t("staff.control")}
          </button>
          <button
            onClick={() => setActiveTab("violations")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === "violations" ? "bg-blue-600 text-white" : "bg-white dark:bg-[#1A1A1A]"}`}
          >
            <ShieldAlert className="w-4 h-4 inline mr-2" />
            {t("staff.violationsTab")}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === "history" ? "bg-blue-600 text-white" : "bg-white dark:bg-[#1A1A1A]"}`}
          >
            <List className="w-4 h-4 inline mr-2" />
            {t("staff.historyTab")}
          </button>
          <button
            onClick={() => setActiveTab("reservations")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === "reservations" ? "bg-blue-600 text-white" : "bg-white dark:bg-[#1A1A1A]"}`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            {t("staff.reservationsTab")}
          </button>
        </div>

        {(apiOffline && floors.length === 0) && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg break-words">
            {t("common.networkError")}
          </div>
        )}
        {actionError && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg break-words">{actionError}</div>
        )}
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
                      {vehicleTypes.map((v) => (
                        <option key={v.vehicleTypeId} value={v.vehicleTypeId}>{v.typeName}</option>
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
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-gray-50 dark:bg-[#121212] text-sm"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>{tp(m)}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm px-2 border border-gray-200 dark:border-gray-700 rounded-xl">
                      <input type="checkbox" checked={lostTicket} onChange={(e) => setLostTicket(e.target.checked)} />
                      {t("staff.lostTicket")}
                    </label>
                  </div>
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
                onOccupiedSlotClick={(slot) => {
                  if (slot.activeSession) processPlate(slot.activeSession.licensePlate);
                }}
              />
            </div>
          </div>
        )}

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