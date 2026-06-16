import { useEffect, useMemo, useState } from "react";
import { Car, Home, Ticket, Wallet, History, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { apiGet, apiPost } from "../lib/api";

export function UserWebDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"home" | "tickets" | "history" | "settings">("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [home, setHome] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const authRaw = localStorage.getItem("pbms_auth") ?? sessionStorage.getItem("pbms_auth");
  const auth = authRaw ? (JSON.parse(authRaw) as { token: string; userId: number; roleName: string }) : null;
  const userId = auth?.userId ?? 0;

  useEffect(() => {
    if (!auth || auth.roleName.toLowerCase() !== "driver") {
      navigate("/login");
      return;
    }
    setLoading(true);
    Promise.all([
      apiGet(`/api/portal/driver/${userId}/home`, auth.token),
      apiGet(`/api/portal/driver/${userId}/tickets`, auth.token),
      apiGet(`/api/portal/driver/${userId}/transactions`, auth.token),
    ])
      .then(([h, t, tx]) => {
        setHome(h);
        setTickets(t as any[]);
        setTransactions(tx as any[]);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Load dữ liệu thất bại"))
      .finally(() => setLoading(false));
  }, [navigate]);

  const activeSession = home?.activeSession;

  const completedTickets = useMemo(
    () => tickets.filter((t) => t.status === "Completed"),
    [tickets],
  );

  async function handleCheckout() {
    if (!activeSession) return;
    try {
      await apiPost(
        `/api/parking-sessions/${activeSession.sessionId}/check-out`,
        { paymentMethod: "EWallet", exitGate: "Driver-App" },
        auth?.token,
      );
      const [h, t, tx] = await Promise.all([
        apiGet(`/api/portal/driver/${userId}/home`, auth?.token),
        apiGet(`/api/portal/driver/${userId}/tickets`, auth?.token),
        apiGet(`/api/portal/driver/${userId}/transactions`, auth?.token),
      ]);
      setHome(h);
      setTickets(t as any[]);
      setTransactions(tx as any[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout thất bại");
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
      </header>

      <main className="p-6 space-y-5">
        <div className="flex gap-2">
          {[
            { id: "home", label: "Trang chủ", icon: <Home className="w-4 h-4 inline mr-1" /> },
            { id: "tickets", label: "Vé", icon: <Ticket className="w-4 h-4 inline mr-1" /> },
            { id: "history", label: "Giao dịch", icon: <History className="w-4 h-4 inline mr-1" /> },
            { id: "settings", label: "Cài đặt", icon: <Settings className="w-4 h-4 inline mr-1" /> },
          ].map((x) => (
            <button
              key={x.id}
              onClick={() => setTab(x.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === x.id ? "bg-blue-600 text-white" : "bg-white dark:bg-[#1A1A1A]"}`}
            >
              {x.icon}
              {x.label}
            </button>
          ))}
        </div>

        {loading && <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>}
        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

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
                  <button onClick={handleCheckout} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg">
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

        {!loading && tab === "settings" && (
          <section className="bg-white dark:bg-[#1A1A1A] rounded-xl p-5 border border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold mb-3">Cài đặt</h2>
            <div className="space-y-2 text-sm">
              <p>Flow này đã nối backend cho home/tickets/history.</p>
              <p>Nạp tiền ví / PayOS vẫn là tính năng mở rộng ngoài schema hiện tại.</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
