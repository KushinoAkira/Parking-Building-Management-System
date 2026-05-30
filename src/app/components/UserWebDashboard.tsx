import { useState } from "react";
import {
  Car, MapPin, Clock, CreditCard, ChevronRight, Bell, Search, QrCode,
  Home, Ticket, Wallet, History, Tag, ScanLine, Settings, AlertTriangle,
  Plus, ArrowUpRight, ArrowDownLeft, CheckCircle2, X, LogOut, Menu,
  Image as ImageIcon, LayoutDashboard, Shield,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useNavigate } from "react-router";

// ── Data ──────────────────────────────────────────────────────────────────────
const nearbyParking = [
  { name: "Tòa nhà Lotte", address: "54 Liễu Giai, Ba Đình", distance: "500m", total: 120, free: 45, price: "15.000 đ/h" },
  { name: "Vincom Center", address: "191 Bà Triệu, Hai Bà Trưng", distance: "1.2km", total: 200, free: 12, price: "20.000 đ/h" },
  { name: "Aeon Mall Long Biên", address: "Long Biên, Hà Nội", distance: "2.1km", total: 500, free: 5, price: "Miễn phí" },
  { name: "Times City", address: "458 Minh Khai, Hoàng Mai", distance: "3.4km", total: 300, free: 78, price: "10.000 đ/h" },
];

const ticketsData = [
  { id: "TK-1029", plate: "30A-123.45", location: "Vincom Center", slot: "Slot A-42 • Tầng 1", timeIn: "Hôm nay, 08:30", timeOut: null, status: "Đang đỗ", price: "Đang tính..." },
  { id: "TK-1028", plate: "30A-123.45", location: "Tòa nhà Lotte", slot: "Slot B-12 • Tầng 2", timeIn: "Hôm qua, 14:00", timeOut: "Hôm qua, 16:30", status: "Hoàn thành", price: "45.000 đ" },
  { id: "TK-1027", plate: "30A-123.45", location: "Aeon Mall", slot: "Slot C-05 • Tầng 1", timeIn: "12/05/2026, 09:15", timeOut: "12/05/2026, 11:00", status: "Hoàn thành", price: "Miễn phí" },
  { id: "TK-1026", plate: "59A1-234.56", location: "Times City", slot: "Slot D-11 • Tầng 3", timeIn: "10/05/2026, 07:00", timeOut: "10/05/2026, 08:30", status: "Hoàn thành", price: "15.000 đ" },
];

const transactionHistory = [
  { id: 1, type: "Nạp tiền", amount: "+ 200.000 đ", time: "24/05/2026 10:45", method: "Momo", isPositive: true },
  { id: 2, type: "Thanh toán phí", amount: "- 60.000 đ", time: "23/05/2026 15:30", method: "Ví ParkingPro", isPositive: false },
  { id: 3, type: "Thanh toán phí", amount: "- 45.000 đ", time: "20/05/2026 16:30", method: "Ví ParkingPro", isPositive: false },
  { id: 4, type: "Hoàn tiền", amount: "+ 15.000 đ", time: "18/05/2026 09:00", method: "Hệ thống", isPositive: true },
  { id: 5, type: "Nạp tiền", amount: "+ 100.000 đ", time: "15/05/2026 08:15", method: "Vietcombank", isPositive: true },
  { id: 6, type: "Thanh toán phí", amount: "- 20.000 đ", time: "10/05/2026 08:45", method: "Ví ParkingPro", isPositive: false },
];

const myVehicles = [
  { id: 1, plate: "30A-123.45", type: "Ô tô", status: "Đang đỗ", location: "Vincom Center - Slot A-42 (Tầng 1)", time: "08:30 - Hôm nay", isParking: true },
  { id: 2, plate: "59A1-234.56", type: "Xe máy", status: "Không đỗ", location: null, time: null, isParking: false },
  { id: 3, plate: "29C1-999.99", type: "Xe máy", status: "Không đỗ", location: null, time: null, isParking: false },
];

const banks = [
  { id: "vcb", name: "Vietcombank", color: "bg-green-600", text: "VCB" },
  { id: "bidv", name: "BIDV", color: "bg-blue-800", text: "BIDV" },
  { id: "tcb", name: "Techcombank", color: "bg-red-600", text: "TCB" },
  { id: "momo", name: "Momo", color: "bg-pink-500", text: "MoMo" },
  { id: "vnpay", name: "VNPAY", color: "bg-blue-500", text: "VNP" },
  { id: "zalopay", name: "ZaloPay", color: "bg-green-500", text: "Zalo" },
];

const notifications = [
  { id: 1, title: "Đặt chỗ thành công", desc: "Bạn đã đặt slot A-42 tại Vincom Center.", time: "2 giờ trước", unread: true, icon: CheckCircle2, color: "text-[#00C853]", bg: "bg-[#00C853]/10" },
  { id: 2, title: "Cảnh báo vi phạm", desc: "Xe của bạn đã bị chuyển đến Bãi xe vi phạm do đỗ sai vị trí. Vui lòng liên hệ BQL.", time: "1 giờ trước", unread: true, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
  { id: 3, title: "Giảm 20% phí đỗ xe", desc: "Áp dụng cho lần thanh toán tiếp theo qua ví.", time: "Hôm qua", unread: false, icon: Tag, color: "text-purple-500", bg: "bg-purple-500/10" },
];

type NavId = "home" | "tickets" | "topup" | "history" | "vehicles" | "settings";

const navItems: { id: NavId; label: string; icon: React.ReactNode }[] = [
  { id: "home", label: "Trang chủ", icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: "tickets", label: "Vé của tôi", icon: <Ticket className="w-5 h-5" /> },
  { id: "topup", label: "Nạp tiền", icon: <Wallet className="w-5 h-5" /> },
  { id: "history", label: "Lịch sử GD", icon: <History className="w-5 h-5" /> },
  { id: "vehicles", label: "Xe của tôi", icon: <Car className="w-5 h-5" /> },
  { id: "settings", label: "Cài đặt", icon: <Settings className="w-5 h-5" /> },
];

// ── Sub-components ─────────────────────────────────────────────────────────────
function ActiveSessionCard({ onCheckout }: { onCheckout: () => void }) {
  return (
    <div className="bg-gradient-to-br from-[#00C853] to-[#00A843] rounded-2xl p-6 text-white shadow-xl shadow-[#00C853]/25 relative overflow-hidden">
      <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none">
        <Car className="w-48 h-48" />
      </div>
      <div className="flex items-start justify-between mb-5 relative z-10">
        <div>
          <p className="text-white/70 text-sm mb-1">Phiên đỗ xe hiện tại</p>
          <h3 className="text-2xl font-bold">Vincom Center</h3>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-white/80 text-xs bg-white/20 px-2.5 py-1 rounded-lg font-semibold">Slot A-42</span>
            <span className="text-white/80 text-xs bg-white/20 px-2.5 py-1 rounded-lg font-semibold">Tầng 1</span>
            <span className="text-white/80 text-xs bg-white/20 px-2.5 py-1 rounded-lg font-semibold">Ô tô</span>
          </div>
        </div>
        <div className="bg-white text-[#00C853] p-3 rounded-xl shadow-md shrink-0">
          <QrCode className="w-7 h-7" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 border-t border-white/20 pt-5 mb-5 relative z-10">
        {[
          { label: "Giờ vào", value: "08:30", icon: <Clock className="w-3.5 h-3.5" /> },
          { label: "Biển số", value: "30A-123.45", icon: <Shield className="w-3.5 h-3.5" />, mono: true },
          { label: "Tạm tính", value: "60.000 đ", icon: <CreditCard className="w-3.5 h-3.5" /> },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-white/70 text-xs mb-1 flex items-center gap-1">{item.icon} {item.label}</p>
            <p className={`font-bold text-base ${item.mono ? "font-mono" : ""}`}>{item.value}</p>
          </div>
        ))}
      </div>
      <button
        onClick={onCheckout}
        className="w-full bg-white text-[#00C853] font-bold py-3.5 rounded-xl hover:bg-gray-50 active:scale-[0.99] transition-all shadow-md relative z-10 text-sm"
      >
        Thanh toán &amp; Check-out
      </button>
    </div>
  );
}

function NearbyParking() {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-gray-900 dark:text-white">Bãi đỗ gần bạn</h2>
        <button className="text-[#00C853] text-sm font-semibold hover:underline">Xem tất cả</button>
      </div>
      <div className="space-y-3">
        {nearbyParking.map((park) => {
          const pct = park.free / park.total;
          const statusColor =
            pct > 0.2 ? "text-[#00C853] bg-[#00C853]/10"
            : pct > 0.05 ? "text-orange-500 bg-orange-50 dark:bg-orange-500/10"
            : "text-red-500 bg-red-50 dark:bg-red-500/10";
          return (
            <div
              key={park.name}
              className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex gap-4 items-center hover:border-[#00C853]/30 transition-colors cursor-pointer group"
            >
              <div className="w-11 h-11 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center shrink-0 border border-gray-100 dark:border-gray-700 group-hover:bg-[#00C853]/10 transition-colors">
                <MapPin className="w-5 h-5 text-[#00C853]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{park.name}</h3>
                <p className="text-gray-400 text-xs mt-0.5">{park.distance} • {park.address}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${statusColor}`}>
                    Trống {park.free}/{park.total}
                  </span>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg">
                    {park.price}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickStats() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[
        { label: "Lần đỗ xe", value: "28", sub: "tháng này", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
        { label: "Tổng chi tiêu", value: "420k", sub: "tháng này", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
        { label: "Xe đăng ký", value: "3", sub: "phương tiện", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
        { label: "Điểm tích lũy", value: "1.240", sub: "điểm", color: "text-[#00C853]", bg: "bg-[#00C853]/10" },
      ].map((s) => (
        <div key={s.label} className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4 border border-gray-100 dark:border-gray-800">
          <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
            <span className={`text-lg font-black ${s.color}`}>•</span>
          </div>
          <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ── Page Content ───────────────────────────────────────────────────────────────
function HomeContent({ onCheckout }: { onCheckout: () => void }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left column: session + nearby */}
      <div className="xl:col-span-2 space-y-6">
        <ActiveSessionCard onCheckout={onCheckout} />
        <NearbyParking />
      </div>
      {/* Right column: quick stats + search */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-5 border border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Tìm bãi đỗ xe</h2>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Nhập tên bãi hoặc địa chỉ..."
              className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#00C853] transition-colors"
            />
          </div>
          <button className="mt-3 w-full py-3 rounded-xl bg-[#00C853] text-white font-bold text-sm hover:bg-[#00C853]/90 transition-all shadow-md shadow-[#00C853]/20">
            Tìm kiếm
          </button>
        </div>
        <QuickStats />
      </div>
    </div>
  );
}

function TicketsContent() {
  const [filter, setFilter] = useState<"Tất cả" | "Đang đỗ" | "Hoàn thành">("Tất cả");
  const filtered = ticketsData.filter((t) => filter === "Tất cả" || t.status === filter);
  return (
    <div>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {(["Tất cả", "Đang đỗ", "Hoàn thành"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filter === f ? "bg-[#00C853] text-white shadow-md shadow-[#00C853]/20" : "bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#00C853]/40"}`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((ticket) => (
          <div
            key={ticket.id}
            className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm relative overflow-hidden hover:border-[#00C853]/30 transition-colors"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${ticket.status === "Đang đỗ" ? "bg-[#00C853]" : "bg-gray-200 dark:bg-gray-700"}`} />
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold text-gray-400">{ticket.id}</span>
                <h3 className="font-bold text-gray-900 dark:text-white mt-0.5">{ticket.location}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ticket.slot}</p>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 ${ticket.status === "Đang đỗ" ? "bg-[#00C853]/10 text-[#00C853]" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}
              >
                {ticket.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5"><Car className="w-3 h-3" /> Biển số</p>
                <p className="font-semibold text-gray-900 dark:text-white font-mono">{ticket.plate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5"><CreditCard className="w-3 h-3" /> Phí</p>
                <p className={`font-semibold ${ticket.status === "Đang đỗ" ? "text-[#00C853]" : "text-gray-900 dark:text-white"}`}>{ticket.price}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5"><Clock className="w-3 h-3" /> Thời gian</p>
                <p className="font-medium text-gray-900 dark:text-white text-xs">{ticket.timeIn}{ticket.timeOut ? ` → ${ticket.timeOut}` : " (Hiện tại)"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopupContent() {
  const [topupAmount, setTopupAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState("Momo");
  const [done, setDone] = useState(false);

  const handleConfirm = () => {
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-[#00C853] to-[#00A843] rounded-2xl p-6 text-white mb-6 shadow-lg shadow-[#00C853]/20 flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm mb-1">Số dư hiện tại</p>
          <h3 className="text-3xl font-black">125.000 đ</h3>
        </div>
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
          <Wallet className="w-7 h-7 text-white" />
        </div>
      </div>

      {done ? (
        <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-100 dark:border-gray-800 p-12 flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-[#00C853]/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-11 h-11 text-[#00C853]" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nạp tiền thành công!</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Số dư ví của bạn đã được cập nhật.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">Chọn mệnh giá nạp</h4>
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {[10000, 20000, 50000, 100000, 200000, 500000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => { setTopupAmount(amount); setCustomAmount(""); }}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${topupAmount === amount ? "bg-[#00C853]/10 border-[#00C853] text-[#00C853]" : "bg-gray-50 dark:bg-[#121212] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#00C853]/50"}`}
                >
                  {(amount / 1000).toLocaleString("vi-VN")}k
                </button>
              ))}
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Hoặc nhập số tiền khác</h4>
            <div className="relative">
              <input
                type="text"
                placeholder="Nhập số tiền..."
                value={customAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setCustomAmount(val ? Number(val).toLocaleString("vi-VN") : "");
                  setTopupAmount(null);
                }}
                className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 pr-14 text-gray-900 dark:text-white focus:outline-none focus:border-[#00C853] transition-colors text-sm"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">VND</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col">
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">Phương thức thanh toán</h4>
            <div className="space-y-2.5 flex-1">
              {banks.map((bank) => (
                <label
                  key={bank.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedBank === bank.name ? "border-[#00C853] bg-[#00C853]/5" : "bg-gray-50 dark:bg-[#121212] border-gray-200 dark:border-gray-700 hover:border-[#00C853]/40"}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0 ${bank.color}`}>
                    {bank.text}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white text-sm flex-1">{bank.name}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedBank === bank.name ? "border-[#00C853]" : "border-gray-300 dark:border-gray-600"}`}>
                    {selectedBank === bank.name && <div className="w-2.5 h-2.5 rounded-full bg-[#00C853]" />}
                  </div>
                  <input type="radio" className="hidden" name="bank" checked={selectedBank === bank.name} onChange={() => setSelectedBank(bank.name)} />
                </label>
              ))}
            </div>
            <button
              onClick={handleConfirm}
              disabled={!topupAmount && !customAmount}
              className="mt-5 w-full bg-[#00C853] text-white font-bold py-3.5 rounded-xl hover:bg-[#00C853]/90 active:scale-[0.99] transition-all shadow-lg shadow-[#00C853]/20 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Xác nhận nạp tiền{topupAmount ? ` — ${topupAmount.toLocaleString("vi-VN")} đ` : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryContent() {
  const [historyFilter, setHistoryFilter] = useState("Tất cả");
  const filtered = transactionHistory.filter((tx) => historyFilter === "Tất cả" || tx.type === historyFilter);
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-2 flex-wrap mb-6">
        {["Tất cả", "Nạp tiền", "Thanh toán phí", "Hoàn tiền"].map((f) => (
          <button
            key={f}
            onClick={() => setHistoryFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${historyFilter === f ? "bg-[#00C853] text-white shadow-md shadow-[#00C853]/20" : "bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#00C853]/40"}`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {filtered.map((tx, i) => (
          <div
            key={tx.id}
            className={`flex items-center gap-4 p-4 ${i < filtered.length - 1 ? "border-b border-gray-50 dark:border-gray-800" : ""} hover:bg-gray-50 dark:hover:bg-[#262626] transition-colors`}
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${tx.isPositive ? "bg-[#00C853]/10 text-[#00C853]" : "bg-red-500/10 text-red-500"}`}>
              {tx.isPositive ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">{tx.type}</h3>
              <p className="text-gray-400 text-xs mt-0.5">{tx.time} • {tx.method}</p>
            </div>
            <span className={`font-bold text-base shrink-0 ${tx.isPositive ? "text-[#00C853]" : "text-gray-900 dark:text-white"}`}>
              {tx.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VehiclesContent() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-4 mb-4">
        {myVehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className={`bg-white dark:bg-[#1E1E1E] p-5 rounded-xl border-2 transition-colors ${vehicle.isParking ? "border-[#00C853]" : "border-gray-100 dark:border-gray-800"} relative overflow-hidden`}
          >
            {vehicle.isParking && (
              <div className="absolute top-0 right-0 bg-[#00C853] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                ĐANG ĐỖ
              </div>
            )}
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-13 h-13 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${vehicle.isParking ? "bg-[#00C853]/10 text-[#00C853]" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-mono text-xl font-black text-gray-900 dark:text-white">{vehicle.plate}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{vehicle.type}</p>
              </div>
            </div>
            {vehicle.isParking && (
              <div className="bg-gray-50 dark:bg-[#121212] rounded-xl p-3.5 space-y-2 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{vehicle.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{vehicle.time}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <button className="w-full bg-[#00C853]/10 text-[#00C853] border-2 border-[#00C853] border-dashed font-bold py-4 rounded-xl hover:bg-[#00C853]/20 transition-all flex items-center justify-center gap-2">
        <Plus className="w-5 h-5" />
        Thêm xe mới
      </button>
    </div>
  );
}

function SettingsContent() {
  const navigate = useNavigate();
  return (
    <div className="max-w-lg mx-auto space-y-3">
      {[
        { label: "Chế độ tối (Dark Mode)", right: <ThemeToggle /> },
        { label: "Ngôn ngữ", right: <span className="text-sm text-gray-500 dark:text-gray-400 font-semibold">Tiếng Việt</span> },
        { label: "Thông báo đẩy", right: <span className="text-sm text-[#00C853] font-semibold">Bật</span> },
      ].map((item) => (
        <div key={item.label} className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</span>
          {item.right}
        </div>
      ))}
      <button
        onClick={() => navigate("/login")}
        className="w-full bg-white dark:bg-[#1E1E1E] rounded-xl p-4 border border-red-100 dark:border-red-900/30 flex justify-between items-center hover:bg-red-50 dark:hover:bg-red-500/5 transition-colors"
      >
        <span className="text-sm font-bold text-red-500">Đăng xuất</span>
        <LogOut className="w-4 h-4 text-red-400" />
      </button>
    </div>
  );
}

// ── QR Scanner Modal ──────────────────────────────────────────────────────────
function QRScannerModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] rounded-3xl p-8 w-full max-w-sm relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-white font-bold text-xl text-center mb-6">Quét mã QR</h2>
        <div className="relative w-56 h-56 mx-auto mb-6">
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#00C853] rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#00C853] rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#00C853] rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#00C853] rounded-br-xl" />
          <div className="absolute left-0 right-0 h-0.5 bg-[#00C853] shadow-[0_0_8px_#00C853] top-1/2 -translate-y-1/2 animate-bounce" />
          <div className="absolute inset-4 bg-white/5 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <ScanLine className="w-10 h-10 text-[#00C853]/50" />
          </div>
        </div>
        <p className="text-gray-400 text-center text-sm mb-4">Hướng camera về phía mã QR tại trạm để nhận vé gửi xe.</p>
        <button className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-xl transition-colors border border-white/10 text-sm font-semibold">
          <ImageIcon className="w-4 h-4" />
          Chụp từ thư viện ảnh
        </button>
      </div>
    </div>
  );
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ onClose }: { onClose: () => void }) {
  const [done, setDone] = useState(false);
  const confirm = () => { setDone(true); setTimeout(onClose, 2200); };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
        {done ? (
          <div className="flex flex-col items-center py-6 gap-4">
            <div className="w-20 h-20 bg-[#00C853]/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-11 h-11 text-[#00C853]" />
            </div>
            <h3 className="font-bold text-2xl text-gray-900 dark:text-white">Thanh Toán Thành Công!</h3>
            <p className="text-gray-400 text-sm text-center">Cảm ơn bạn đã sử dụng ParkingPro!</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-gray-900 dark:text-white">Thanh Toán</h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center mb-5">
              <div className="w-40 h-40 bg-white border-4 border-[#00C853]/20 rounded-2xl flex items-center justify-center shadow-inner">
                <QrCode className="w-24 h-24 text-gray-800" />
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mb-5">Quét QR bằng ứng dụng ngân hàng hoặc ví điện tử</p>
            <div className="bg-gray-50 dark:bg-[#121212] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 space-y-3 mb-5">
              {[
                { label: "Bãi đỗ xe", value: "Vincom Center" },
                { label: "Slot", value: "A-42 (Tầng 1)" },
                { label: "Thời gian đỗ", value: "3 giờ 12 phút" },
                { label: "Phí đỗ xe", value: "60.000 đ", green: true },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{row.label}</span>
                  <span className={`text-sm font-bold ${row.green ? "text-[#00C853]" : "text-gray-900 dark:text-white"}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <button onClick={confirm} className="w-full bg-[#00C853] text-white font-bold py-4 rounded-xl hover:bg-[#00C853]/90 active:scale-[0.99] transition-all shadow-lg shadow-[#00C853]/20">
              Xác nhận — 60.000 đ
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Notification Drawer ───────────────────────────────────────────────────────
function NotifDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1" onClick={onClose} />
      <div className="w-full max-w-sm bg-white dark:bg-[#1A1A1A] h-full shadow-2xl flex flex-col border-l border-gray-100 dark:border-gray-800 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-xl text-gray-900 dark:text-white">Thông báo</h2>
          <div className="flex items-center gap-3">
            <button className="text-sm font-semibold text-[#00C853]">Đọc tất cả</button>
            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.map((notif) => {
            const Icon = notif.icon;
            return (
              <div key={notif.id} className={`p-4 rounded-2xl border flex gap-3 ${notif.unread ? "bg-white dark:bg-[#1E1E1E] border-gray-100 dark:border-gray-800 shadow-sm" : "bg-gray-50 dark:bg-[#121212] border-transparent"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notif.bg} ${notif.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-sm font-bold ${notif.unread ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>{notif.title}</h3>
                    {notif.unread && <div className="w-2 h-2 rounded-full bg-[#00C853] mt-1 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{notif.desc}</p>
                  <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{notif.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function UserWebDashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<NavId>("home");
  const [showNotif, setShowNotif] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const pageTitles: Record<NavId, string> = {
    home: "Trang chủ",
    tickets: "Vé của tôi",
    topup: "Nạp tiền",
    history: "Lịch sử giao dịch",
    vehicles: "Xe của tôi",
    settings: "Cài đặt",
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0D0D0D] flex transition-colors duration-200">
      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? "w-64" : "w-16"} shrink-0 bg-white dark:bg-[#1A1A1A] border-r border-gray-100 dark:border-gray-800 flex flex-col transition-all duration-300 sticky top-0 h-screen`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#00C853] rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-[#00C853]/30">
            <Car className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && <span className="font-black text-gray-900 dark:text-white text-lg">ParkingPro</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${activeNav === item.id ? "bg-[#00C853]/10 text-[#00C853]" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#262626] hover:text-gray-900 dark:hover:text-white"}`}
            >
              <span className="shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-semibold">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* QR button */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setShowQR(true)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-[#00C853] text-white font-semibold hover:bg-[#00C853]/90 transition-all`}
          >
            <QrCode className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="text-sm">Quét QR</span>}
          </button>
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => navigate("/login")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="text-sm font-semibold">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <h1 className="font-bold text-gray-900 dark:text-white text-lg">{pageTitles[activeNav]}</h1>
            <p className="text-xs text-gray-400">Xin chào, <span className="font-semibold text-gray-600 dark:text-gray-300">Nguyễn Văn Khách</span></p>
          </div>

          <div className="flex items-center gap-3">
            {/* Balance pill */}
            <div className="hidden sm:flex items-center gap-2 bg-[#00C853]/10 border border-[#00C853]/20 rounded-full px-4 py-2">
              <Wallet className="w-4 h-4 text-[#00C853]" />
              <span className="text-sm font-bold text-[#00C853]">125.000 đ</span>
            </div>

            <ThemeToggle />

            <button
              onClick={() => setShowNotif(true)}
              className="relative p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeNav === "home" && <HomeContent onCheckout={() => setShowPayment(true)} />}
          {activeNav === "tickets" && <TicketsContent />}
          {activeNav === "topup" && <TopupContent />}
          {activeNav === "history" && <HistoryContent />}
          {activeNav === "vehicles" && <VehiclesContent />}
          {activeNav === "settings" && <SettingsContent />}
        </main>
      </div>

      {/* ── Overlays ── */}
      {showNotif && <NotifDrawer onClose={() => setShowNotif(false)} />}
      {showQR && <QRScannerModal onClose={() => setShowQR(false)} />}
      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} />}
    </div>
  );
}
