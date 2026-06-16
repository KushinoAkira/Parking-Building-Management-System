import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Camera, Car, LogOut, ShieldAlert, List } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationDropdown } from "./NotificationDropdown";
import { useNavigate } from "react-router";
import { apiGet, apiPost } from "../lib/api";

type Tab = "control" | "violations" | "history";

type AuthState = {
  token: string;
  userId: number;
  fullName: string;
  roleName: string;
};

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

function readAuth(): AuthState | null {
  const raw = localStorage.getItem("pbms_auth") ?? sessionStorage.getItem("pbms_auth");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

function formatTime(value: string) {
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
  const [vPlate, setVPlate] = useState("");
  const [vType, setVType] = useState("WrongZone");
  const [vNote, setVNote] = useState("");

  const auth = readAuth();

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

  async function loadAll() {
    await Promise.all([loadFloors(), loadViolations(), loadHistory()]);
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

  async function processPlate(rawPlate: string) {
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
            paymentMethod: "Cash",
            exitStaffId: auth?.userId,
            exitGate: "Gate-A",
          },
          auth?.token,
        );
        setResult(`Check-out thành công ${normalizedPlate}. Phí: ${out.totalFee.toLocaleString("vi-VN")} đ`);
      } else {
        const checkIn = await apiPost<{ slotId: string }>(
          "/api/parking-sessions/check-in",
          {
            licensePlate: normalizedPlate,
            vehicleTypeId: 2,
            entryStaffId: auth?.userId,
            entryGate: "Gate-A",
          },
          auth?.token,
        );
        setResult(`Check-in thành công ${normalizedPlate} vào slot ${checkIn.slotId}.`);
      }

      setPlate("");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xử lý biển số thất bại.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function submitViolation(e: React.FormEvent) {
    e.preventDefault();
    if (!vPlate.trim()) return;
    try {
      await apiPost(
        "/api/incidents",
        {
          incidentType: vType,
          description: vNote || "From staff dashboard",
          status: "Open",
          penaltyFee: 0,
          reportedById: auth?.userId,
          sessionId: null,
        },
        auth?.token,
      );
      setVPlate("");
      setVType("WrongZone");
      setVNote("");
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
              localStorage.removeItem("pbms_auth");
              sessionStorage.removeItem("pbms_auth");
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
                <input
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="Nhập biển số (VD: 30A-123.45)"
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#121212]"
                />
                <button
                  disabled={loadingAction || !plate.trim()}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
                >
                  {loadingAction ? "Đang xử lý..." : "Xử lý biển số"}
                </button>
              </form>
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

        {activeTab === "history" && (
          <section className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold mb-4">Lịch sử ra vào</h2>
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
                  {history.map((h) => (
                    <tr key={h.sessionId} className="border-b border-gray-100 dark:border-gray-900">
                      <td className="py-2">{h.ticketCode}</td>
                      <td className="py-2 font-mono">{h.licensePlate}</td>
                      <td className="py-2">{h.slotId}</td>
                      <td className="py-2">{formatTime(h.entryTime)}</td>
                      <td className="py-2">{h.exitTime ? formatTime(h.exitTime) : "-"}</td>
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