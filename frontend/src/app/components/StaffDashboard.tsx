import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Camera, Car, LogOut, ShieldAlert, List, Calendar } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationDropdown } from "./NotificationDropdown";
import { useNavigate } from "react-router";
import { apiGet, apiPost } from "../lib/api";
import { clearAuth, getAuth } from "../lib/auth";

type Tab = "control" | "violations" | "history" | "reservations";

type FloorSlot = {
  slotId: string;
  status: string;
  activeSession?: {
    sessionId: number;
    licensePlate: string;
    entryTime: string;
  } | null;
};

type Floor = {
  zoneId: number;
  zoneCode: string;
  zoneName: string;
  slots: FloorSlot[];
};

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

function formatTime(value: string | Date | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export function StaffDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("control");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [plate, setPlate] = useState("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [activeZoneId, setActiveZoneId] = useState<number | null>(null);
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

  const activeFloor = useMemo(
    () => floors.find((f) => f.zoneId === activeZoneId) ?? floors[0],
    [activeZoneId, floors],
  );

  const counts = useMemo(() => {
    const slots = activeFloor?.slots ?? [];
    return {
      total: slots.length,
      available: slots.filter((s) => s.status === "Available").length,
      occupied: slots.filter((s) => s.status === "Occupied").length,
      reserved: slots.filter((s) => s.status === "Reserved").length,
    };
  }, [activeFloor]);

  async function loadFloors() {
    const data = await apiGet<Floor[]>("/api/portal/staff/floors", auth?.token);
    setFloors(data);
    if (!activeZoneId && data.length > 0) setActiveZoneId(data[0].zoneId);
  }

  async function loadViolations() {
    setViolations(await apiGet<Incident[]>("/api/portal/staff/violations", auth?.token));
  }

  async function loadHistory() {
    setHistory(await apiGet<SessionHistory[]>("/api/portal/staff/history", auth?.token));
  }

  async function loadReservations() {
    setReservations(await apiGet<StaffReservation[]>("/api/portal/staff/reservations", auth?.token));
  }

  async function loadVehicleTypes() {
    try {
      const data = await apiGet<{vehicleTypeId: number, typeName: string}[]>("/api/vehicle-types", auth?.token);
      setVehicleTypes(data);
      if (data.length > 0) setSelectedVehicleType(data[0].vehicleTypeId);
    } catch {
      // Ignore
    }
  }

  async function loadAll() {
    await Promise.all([loadFloors(), loadViolations(), loadHistory(), loadVehicleTypes(), loadReservations()]);
  }

  useEffect(() => {
    if (!auth || auth.roleName.toLowerCase() !== "staff") {
      navigate("/login");
      return;
    }
    loadAll().catch((e) => setError(e instanceof Error ? e.message : "Load dữ liệu thất bại"));
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function processPlate(rawPlate: string, options?: { reservationId?: number; vehicleTypeId?: number }) {
    const normalizedPlate = rawPlate.trim().toUpperCase();
    if (!normalizedPlate) return;
    setLoadingAction(true);
    setError("");
    setResult("");

    try {
      const active = await apiGet<{ sessionId: number } | null>(
        `/api/parking-sessions/active/${encodeURIComponent(normalizedPlate)}`,
        auth?.token,
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
          auth?.token,
        );
        setResult(`Check-out thành công ${normalizedPlate}. Phí: ${out.totalFee.toLocaleString("vi-VN")} đ`);
      } else {
        const vehicleTypeId = options?.vehicleTypeId ?? Number(selectedVehicleType);
        if (!vehicleTypeId) throw new Error("Vui lòng chọn loại xe.");
        const checkIn = await apiPost<{ slotId: string }>(
          "/api/parking-sessions/check-in",
          {
            licensePlate: normalizedPlate,
            vehicleTypeId,
            entryStaffId: auth?.userId,
            entryGate: selectedGate,
            reservationId: options?.reservationId ?? null,
          },
          auth?.token,
        );
        setResult(`Check-in thành công ${normalizedPlate} vào slot ${checkIn.slotId}.`);
      }

      setPlate("");
      setLostTicket(false);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xử lý biển số thất bại.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function processTicketCode() {
    const code = ticketCode.trim();
    if (!code || !auth) return;
    setLoadingAction(true);
    setError("");
    setResult("");
    try {
      const session = await apiGet<{ sessionId: number; licensePlate: string; status: string }>(
        `/api/parking-sessions/ticket/${encodeURIComponent(code)}`,
        auth.token,
      );
      if (session.status === "Active") {
        await processPlate(session.licensePlate);
      } else {
        setResult(`Vé ${code}: biển ${session.licensePlate}, trạng thái ${session.status}.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tìm thấy vé.");
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
        auth?.token,
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
        auth?.token,
      );
      setVPlate("");
      setVType("WrongZone");
      setVNote("");
      setVPenalty("");
      await loadViolations();
      setResult("Đã ghi nhận vi phạm thành công.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tạo vi phạm thất bại.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <header className="h-16 bg-white dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Car className="w-5 h-5 text-blue-600" />
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">Staff Dashboard</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{currentTime.toLocaleString("vi-VN")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationDropdown />
          <button
            onClick={() => {
              clearAuth();
              navigate("/login");
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Đăng xuất"
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
            Kiểm soát xe
          </button>
          <button
            onClick={() => setActiveTab("violations")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === "violations" ? "bg-blue-600 text-white" : "bg-white dark:bg-[#1A1A1A]"}`}
          >
            <ShieldAlert className="w-4 h-4 inline mr-2" />
            Vi phạm
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === "history" ? "bg-blue-600 text-white" : "bg-white dark:bg-[#1A1A1A]"}`}
          >
            <List className="w-4 h-4 inline mr-2" />
            Lịch sử
          </button>
          <button
            onClick={() => setActiveTab("reservations")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === "reservations" ? "bg-blue-600 text-white" : "bg-white dark:bg-[#1A1A1A]"}`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Đặt chỗ
          </button>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
        {result && <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">{result}</div>}

        {activeTab === "control" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800 space-y-4">
              <h2 className="font-semibold">Check-in / Check-out</h2>
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await processPlate(plate);
                }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={selectedVehicleType}
                    onChange={(e) => setSelectedVehicleType(e.target.value ? Number(e.target.value) : "")}
                    className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#121212]"
                    required
                  >
                    <option value="" disabled>Chọn loại xe...</option>
                    {vehicleTypes.map(v => (
                      <option key={v.vehicleTypeId} value={v.vehicleTypeId}>{v.typeName}</option>
                    ))}
                  </select>
                  <select
                    value={selectedGate}
                    onChange={(e) => setSelectedGate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#121212]"
                  >
                    <option value="Gate-A">Cổng A (Vào/Ra)</option>
                    <option value="Gate-B">Cổng B (Vào/Ra)</option>
                    <option value="Gate-VIP">Cổng VIP</option>
                  </select>
                </div>
                <input
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="Nhập biển số (VD: 30A-123.45)"
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#121212]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                    className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#121212] text-sm"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm px-2">
                    <input type="checkbox" checked={lostTicket} onChange={(e) => setLostTicket(e.target.checked)} />
                    Mất vé
                  </label>
                </div>
                <button
                  disabled={loadingAction || !plate.trim()}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
                >
                  {loadingAction ? "Đang xử lý..." : "Xử lý biển số"}
                </button>
              </form>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <h3 className="text-sm font-semibold">Tra cứu mã vé</h3>
                <div className="flex gap-2">
                  <input
                    value={ticketCode}
                    onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                    placeholder="Mã vé (VD: TKT-...)"
                    className="flex-1 border rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#121212] text-sm"
                  />
                  <button
                    type="button"
                    onClick={processTicketCode}
                    disabled={loadingAction || !ticketCode.trim()}
                    className="px-3 py-2 bg-gray-800 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    Tìm
                  </button>
                </div>
              </div>
            </section>

            <section className="lg:col-span-2 bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Sơ đồ zone/slot</h2>
                <div className="text-xs text-gray-500">
                  Tổng {counts.total} | Trống {counts.available} | Chiếm {counts.occupied} | Reserved {counts.reserved}
                </div>
              </div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {floors.map((f) => (
                  <button
                    key={f.zoneId}
                    onClick={() => setActiveZoneId(f.zoneId)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${activeFloor?.zoneId === f.zoneId ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-[#121212]"}`}
                  >
                    {f.zoneName}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-6 md:grid-cols-10 gap-2 max-h-[420px] overflow-auto">
                {(activeFloor?.slots ?? []).map((slot) => (
                  <button
                    key={slot.slotId}
                    onClick={() => slot.activeSession && processPlate(slot.activeSession.licensePlate)}
                    className={`text-xs rounded-lg p-2 border ${
                      slot.status === "Occupied"
                        ? "bg-red-50 text-red-600 border-red-200"
                        : slot.status === "Reserved"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                    title={slot.activeSession?.licensePlate ?? "Available"}
                  >
                    {slot.slotId}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "violations" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold mb-4">Ghi nhận vi phạm</h2>
              <form onSubmit={submitViolation} className="space-y-3">
                <input
                  value={vPlate}
                  onChange={(e) => setVPlate(e.target.value.toUpperCase())}
                  placeholder="Biển số"
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#121212]"
                />
                <select
                  value={vType}
                  onChange={(e) => setVType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#121212]"
                >
                  <option value="WrongZone">Sai vị trí</option>
                  <option value="SlotOccupied">Chiếm slot</option>
                  <option value="Other">Khác</option>
                </select>
                <textarea
                  value={vNote}
                  onChange={(e) => setVNote(e.target.value)}
                  placeholder="Mô tả"
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#121212]"
                />
                <input
                  type="number"
                  min={0}
                  value={vPenalty}
                  onChange={(e) => setVPenalty(e.target.value)}
                  placeholder="Phí phạt (VNĐ)"
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#121212]"
                />
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  Lưu vi phạm
                </button>
              </form>
            </section>

            <section className="lg:col-span-2 bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold mb-4">Danh sách vi phạm</h2>
              <div className="overflow-auto max-h-[520px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                      <th className="py-2">Mã</th>
                      <th className="py-2">Biển số</th>
                      <th className="py-2">Loại</th>
                      <th className="py-2">Thời gian</th>
                      <th className="py-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {violations.map((v) => (
                      <tr key={v.incidentId} className="border-b border-gray-100 dark:border-gray-900">
                        <td className="py-2">INC-{v.incidentId}</td>
                        <td className="py-2 font-mono">{v.plate ?? "-"}</td>
                        <td className="py-2">{v.incidentType}</td>
                        <td className="py-2">{formatTime(v.createdAt)}</td>
                        <td className="py-2">{v.status}</td>
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
            <h2 className="font-semibold mb-4">Đặt chỗ chờ check-in</h2>
            <div className="overflow-auto max-h-[560px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2">Biển số</th>
                    <th className="py-2">Khách</th>
                    <th className="py-2">Loại xe</th>
                    <th className="py-2">Khu / Slot</th>
                    <th className="py-2">Từ</th>
                    <th className="py-2">Trạng thái</th>
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
                      <td className="py-2">{formatTime(r.reservedFrom)}</td>
                      <td className="py-2">{r.status}</td>
                      <td className="py-2">
                        {(r.status === "Confirmed" || r.status === "Pending") && (
                          <button
                            onClick={() => checkInReservation(r)}
                            disabled={loadingAction}
                            className="text-blue-600 hover:underline text-xs font-semibold"
                          >
                            Check-in
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {reservations.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-gray-400">Không có đặt chỗ chờ.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "history" && (
          <section className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Lịch sử ra vào</h2>
              <input
                type="text"
                placeholder="Tìm biển số, vé, slot..."
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm w-64 bg-gray-50 dark:bg-[#121212]"
              />
            </div>
            <div className="overflow-auto max-h-[560px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2">Ticket</th>
                    <th className="py-2">Biển số</th>
                    <th className="py-2">Slot</th>
                    <th className="py-2">Vào</th>
                    <th className="py-2">Ra</th>
                    <th className="py-2">Trạng thái</th>
                    <th className="py-2">Phí</th>
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
                      <td className="py-2">{formatTime(h.entryTime)}</td>
                      <td className="py-2">{formatTime(h.exitTime)}</td>
                      <td className="py-2">{h.status}</td>
                      <td className="py-2">{h.totalFee ? `${h.totalFee.toLocaleString("vi-VN")} đ` : "-"}</td>
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