import { useEffect, useMemo, useState } from "react";
import { Car, Home, Ticket, History, LogOut, Calendar, MessageSquare, XCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { apiGet, apiPost } from "../lib/api";
import { clearAuth, getAuth } from "../lib/auth";

type ReservationRow = {
  reservationId: number;
  licensePlate: string;
  zoneCode: string | null;
  slotId: string | null;
  reservedFrom: string;
  reservedTo: string;
  status: string;
};

const PAYMENT_METHODS = ["Cash", "BankTransfer", "EWallet"] as const;

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function UserWebDashboard() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [tab, setTab] = useState<"home" | "tickets" | "history" | "book" | "reservations" | "feedback">("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [home, setHome] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [bookPlate, setBookPlate] = useState("");
  const [bookVehicleTypeId, setBookVehicleTypeId] = useState(1);
  const [bookZoneId, setBookZoneId] = useState<number | "">("");
  const [bookFrom, setBookFrom] = useState("");
  const [bookTo, setBookTo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>("EWallet");
  const [currentFee, setCurrentFee] = useState<number | null>(null);
  const [feedbackType, setFeedbackType] = useState("Suggestion");
  const [feedbackContent, setFeedbackContent] = useState("");

  const userId = auth?.userId ?? 0;

  async function loadFeeEstimate(sessionId: number) {
    if (!auth) return;
    try {
      const fee = await apiGet<{ totalFee: number }>(
        `/api/parking-sessions/${sessionId}/estimate-fee`,
        auth.token,
      );
      setCurrentFee(fee.totalFee);
    } catch {
      setCurrentFee(null);
    }
  }

  async function loadAll() {
    if (!auth) return;
    const [h, t, tx, vt, zoneList, resList] = await Promise.all([
      apiGet(`/api/portal/driver/${userId}/home`, auth.token),
      apiGet(`/api/portal/driver/${userId}/tickets`, auth.token),
      apiGet(`/api/portal/driver/${userId}/transactions`, auth.token),
      apiGet("/api/vehicle-types", auth.token),
      apiGet("/api/zones?status=Active", auth.token),
      apiGet<ReservationRow[]>(`/api/reservations?userId=${userId}`, auth.token),
    ]);
    setHome(h);
    setTickets(t as any[]);
    setTransactions(tx as any[]);
    setVehicleTypes(vt as any[]);
    setZones(zoneList as any[]);
    setReservations(resList);
    if (!bookPlate && (h as any)?.activeSession?.licensePlate) {
      setBookPlate((h as any).activeSession.licensePlate);
    }
    const active = (h as any)?.activeSession;
    if (active?.sessionId) await loadFeeEstimate(active.sessionId);
    else setCurrentFee(null);
  }

  useEffect(() => {
    const from = new Date();
    from.setHours(from.getHours() + 1, 0, 0, 0);
    const to = new Date(from);
    to.setHours(to.getHours() + 2);
    setBookFrom(toLocalInputValue(from));
    setBookTo(toLocalInputValue(to));
  }, []);

  useEffect(() => {
    if (!auth || auth.roleName.toLowerCase() !== "driver") {
      navigate("/login");
      return;
    }
    setLoading(true);
    loadAll()
      .catch((e) => setError(e instanceof Error ? e.message : "Load dữ liệu thất bại"))
      .finally(() => setLoading(false));
  }, [navigate]);

  const activeSession = home?.activeSession;

  const completedTickets = useMemo(
    () => tickets.filter((t) => t.status === "Completed"),
    [tickets],
  );

  async function handleCheckout() {
    if (!activeSession || !auth) return;
    try {
      await apiPost(
        `/api/parking-sessions/${activeSession.sessionId}/check-out`,
        { paymentMethod, exitGate: "Driver-Web" },
        auth.token,
      );
      setMessage("Thanh toán & check-out thành công!");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout thất bại");
    }
  }

  async function handleBook() {
    if (!auth || !bookPlate.trim() || !bookFrom || !bookTo) {
      setMessage("Vui lòng nhập đủ thông tin đặt chỗ.");
      return;
    }
    setMessage("");
     try {
      const created = await apiPost<{ reservationId: number }>(
        "/api/reservations",
        {
          userId: auth.userId,
          vehicleTypeId: bookVehicleTypeId,
          zoneId: bookZoneId || null,
          slotId: null,
          licensePlate: bookPlate.trim(),
          // reservedFrom: new Date(bookFrom).toISOString(),
          // reservedTo: new Date(bookTo).toISOString(),
          reservedFrom: bookFrom,
          reservedTo: bookTo,
        },
        auth.token,
      );
      await apiPost(`/api/reservations/${created.reservationId}/confirm`, {}, auth.token);
      setMessage("Đặt chỗ thành công!");
      await loadAll();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Đặt chỗ thất bại");
    }
  }

  async function handleCancelReservation(id: number) {
    if (!auth) return;
    try {
      await apiPost(`/api/reservations/${id}/cancel`, {}, auth.token);
      setMessage("Đã hủy đặt chỗ.");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hủy đặt chỗ thất bại");
    }
  }

  async function handleFeedback() {
    if (!auth || !feedbackContent.trim()) {
      setMessage("Vui lòng nhập nội dung.");
      return;
    }
    setMessage("");
    try {
      await apiPost(
        "/api/feedbacks",
        {
          userId: auth.userId,
          sessionId: activeSession?.sessionId ?? null,
          feedbackType,
          content: feedbackContent.trim(),
        },
        auth.token,
      );
      setFeedbackContent("");
      setMessage("Phản hồi đã được gửi. Cảm ơn bạn!");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Gửi phản hồi thất bại");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <header className="h-16 bg-white dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Car className="w-5 h-5 text-blue-600" />
          <h1 className="font-semibold text-gray-900 dark:text-white">Driver Portal</h1>
        </div>
        <button
          onClick={() => { clearAuth(); navigate("/login"); }}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Đăng xuất"
        >
          <LogOut className="w-5 h-5 text-gray-500" />
        </button>
      </header>

      <main className="p-6 space-y-5">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "home", label: "Trang chủ", icon: <Home className="w-4 h-4 inline mr-1" /> },
            { id: "tickets", label: "Vé", icon: <Ticket className="w-4 h-4 inline mr-1" /> },
            { id: "history", label: "Giao dịch", icon: <History className="w-4 h-4 inline mr-1" /> },
            { id: "book", label: "Đặt chỗ", icon: <Calendar className="w-4 h-4 inline mr-1" /> },
            { id: "reservations", label: "Lịch đặt", icon: <Calendar className="w-4 h-4 inline mr-1" /> },
            { id: "feedback", label: "Phản hồi", icon: <MessageSquare className="w-4 h-4 inline mr-1" /> },
          ].map((x) => (
            <button
              key={x.id}
              onClick={() => { setTab(x.id as any); setMessage(""); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === x.id ? "bg-blue-600 text-white" : "bg-white dark:bg-[#1A1A1A]"}`}
            >
              {x.icon}
              {x.label}
            </button>
          ))}
        </div>

        {loading && <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>}
        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
        {message && <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">{message}</div>}

        {!loading && tab === "home" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold mb-3">Thông tin tài khoản</h2>
              <p className="text-sm">Họ tên: <strong>{home?.user?.fullName ?? "-"}</strong></p>
              <p className="text-sm">Email: <strong>{home?.user?.email ?? "-"}</strong></p>
              <p className="text-sm">Số điện thoại: <strong>{home?.user?.phone ?? "-"}</strong></p>
            </section>

            <section className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold mb-3">Phiên đỗ hiện tại</h2>
              {activeSession ? (
                <>
                  <p className="text-sm">Biển số: <strong>{activeSession.licensePlate}</strong></p>
                  <p className="text-sm">Vé: <strong>{activeSession.ticketCode}</strong></p>
                  <p className="text-sm">Vị trí: <strong>{activeSession.zoneCode} - {activeSession.slotId}</strong></p>
                  <p className="text-sm">Vào lúc: <strong>{new Date(activeSession.entryTime).toLocaleString("vi-VN")}</strong></p>
                  <p className="text-sm">Phí ước tính: <strong>{currentFee != null ? `${currentFee.toLocaleString("vi-VN")} đ` : "Đang tính..."}</strong></p>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                    className="mt-3 w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m === "Cash" ? "Tiền mặt" : m === "BankTransfer" ? "Chuyển khoản" : "Ví điện tử"}</option>
                    ))}
                  </select>
                  <button onClick={handleCheckout} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg w-full">
                    Thanh toán & Check-out
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-500">Bạn chưa có phiên đỗ active.</p>
              )}
            </section>
          </div>
        )}

        {!loading && tab === "tickets" && (
          <section className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold mb-3">Tất cả vé</h2>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2">Ticket</th>
                    <th className="py-2">Biển số</th>
                    <th className="py-2">Slot</th>
                    <th className="py-2">Trạng thái</th>
                    <th className="py-2">Phí</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.sessionId} className="border-b border-gray-100 dark:border-gray-900">
                      <td className="py-2">{t.ticketCode}</td>
                      <td className="py-2 font-mono">{t.licensePlate}</td>
                      <td className="py-2">{t.zoneCode} - {t.slotId}</td>
                      <td className="py-2">{t.status}</td>
                      <td className="py-2">{t.totalFee ? `${t.totalFee.toLocaleString("vi-VN")} đ` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!loading && tab === "history" && (
          <section className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold mb-3">Lịch sử giao dịch</h2>
            <p className="text-sm text-gray-500 mb-2">Tổng vé đã hoàn thành: {completedTickets.length}</p>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2">Payment ID</th>
                    <th className="py-2">Ticket</th>
                    <th className="py-2">Số tiền</th>
                    <th className="py-2">Phương thức</th>
                    <th className="py-2">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.paymentId} className="border-b border-gray-100 dark:border-gray-900">
                      <td className="py-2">{tx.paymentId}</td>
                      <td className="py-2">{tx.ticketCode}</td>
                      <td className="py-2">{tx.amount.toLocaleString("vi-VN")} đ</td>
                      <td className="py-2">{tx.paymentMethod}</td>
                      <td className="py-2">{new Date(tx.paymentTime).toLocaleString("vi-VN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!loading && tab === "book" && (
          <section className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800 max-w-lg space-y-3">
            <h2 className="font-semibold mb-1">Đặt chỗ trước</h2>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700"
              placeholder="Biển số"
              value={bookPlate}
              onChange={(e) => setBookPlate(e.target.value.toUpperCase())}
            />
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700"
              value={bookVehicleTypeId}
              onChange={(e) => setBookVehicleTypeId(Number(e.target.value))}
            >
              {vehicleTypes.map((vt) => (
                <option key={vt.vehicleTypeId} value={vt.vehicleTypeId}>{vt.typeName}</option>
              ))}
            </select>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700"
              value={bookZoneId}
              onChange={(e) => setBookZoneId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Tự động chọn khu</option>
              {zones.map((z) => (
                <option key={z.zoneId} value={z.zoneId}>{z.zoneName ?? z.zoneCode}</option>
              ))}
            </select>
            <label className="text-xs text-gray-500">Từ</label>
            <input
              type="datetime-local"
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700"
              value={bookFrom}
              onChange={(e) => setBookFrom(e.target.value)}
            />
            <label className="text-xs text-gray-500">Đến</label>
            <input
              type="datetime-local"
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700"
              value={bookTo}
              onChange={(e) => setBookTo(e.target.value)}
            />
            <button onClick={handleBook} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold w-full">
              Xác nhận đặt chỗ
            </button>
          </section>
        )}

        {!loading && tab === "reservations" && (
          <section className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold mb-3">Lịch đặt chỗ của bạn</h2>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2">Biển số</th>
                    <th className="py-2">Khu</th>
                    <th className="py-2">Từ</th>
                    <th className="py-2">Đến</th>
                    <th className="py-2">Trạng thái</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.reservationId} className="border-b border-gray-100 dark:border-gray-900">
                      <td className="py-2 font-mono">{r.licensePlate}</td>
                      <td className="py-2">{r.zoneCode ?? "Tự động"} {r.slotId ? `- ${r.slotId}` : ""}</td>
                      <td className="py-2">{new Date(r.reservedFrom).toLocaleString("vi-VN")}</td>
                      <td className="py-2">{new Date(r.reservedTo).toLocaleString("vi-VN")}</td>
                      <td className="py-2">{r.status}</td>
                      <td className="py-2">
                        {(r.status === "Confirmed" || r.status === "Pending") && (
                          <button
                            onClick={() => handleCancelReservation(r.reservationId)}
                            className="text-red-600 hover:underline flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Hủy
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {reservations.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-gray-400">Chưa có đặt chỗ.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!loading && tab === "feedback" && (
          <section className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800 max-w-lg space-y-3">
            <h2 className="font-semibold mb-1">Gửi phản hồi</h2>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700"
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
            >
              <option value="Suggestion">Góp ý</option>
              <option value="Complaint">Khiếu nại</option>
              <option value="Praise">Khen ngợi</option>
            </select>
            <textarea
              rows={4}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700"
              placeholder="Nội dung..."
              value={feedbackContent}
              onChange={(e) => setFeedbackContent(e.target.value)}
            />
            <button onClick={handleFeedback} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
              Gửi phản hồi
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
