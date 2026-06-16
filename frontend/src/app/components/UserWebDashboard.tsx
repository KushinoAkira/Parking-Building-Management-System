import { useState } from "react";
import {
  Car, MapPin, Clock, CreditCard, ChevronRight, Bell, Search, QrCode,
  Home, Ticket, Wallet, History, Tag, ScanLine, Settings, AlertTriangle,
  Plus, ArrowUpRight, ArrowDownLeft, CheckCircle2, X, LogOut, Menu,
  Image as ImageIcon, LayoutDashboard, Shield, Bike,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useNavigate } from "react-router";
import { motion, AnimatePresence, Variants } from "motion/react";

// ── Data ──────────────────────────────────────────────────────────────────────
const parkingFloors = [
  { name: "Tầng 1", type: "Xe máy", description: "Dành cho khách vãng lai", total: 120, free: 45, price: "5.000 đ/h" },
  { name: "Tầng 2", type: "Xe máy", description: "Dành cho thẻ tháng", total: 120, free: 12, price: "5.000 đ/h" },
  { name: "Tầng 3", type: "Ô tô", description: "Dành cho thẻ tháng", total: 60, free: 18, price: "20.000 đ/h" },
];

const ticketsData = [
  { id: "TK-1029", plate: "30A-123.45", location: "Tầng 1 - Slot A-42", slot: "Slot A-42 • Tầng 1", timeIn: "Hôm nay, 08:30", timeOut: null, status: "Đang đỗ", price: "Đang tính..." },
  { id: "TK-1028", plate: "30A-123.45", location: "Tầng 2 - Slot B-12", slot: "Slot B-12 • Tầng 2", timeIn: "Hôm qua, 14:00", timeOut: "Hôm qua, 16:30", status: "Hoàn thành", price: "45.000 đ" },
  { id: "TK-1027", plate: "30A-123.45", location: "Tầng 1 - Slot C-05", slot: "Slot C-05 • Tầng 1", timeIn: "12/05/2026, 09:15", timeOut: "12/05/2026, 11:00", status: "Hoàn thành", price: "Miễn phí" },
  { id: "TK-1026", plate: "59A1-234.56", location: "Tầng 3 - Slot D-11", slot: "Slot D-11 • Tầng 3", timeIn: "10/05/2026, 07:00", timeOut: "10/05/2026, 08:30", status: "Hoàn thành", price: "15.000 đ" },
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
  { id: 1, plate: "30A-123.45", type: "Ô tô", status: "Đang đỗ", location: "Tầng 1 - Slot A-42", time: "08:30 - Hôm nay", isParking: true },
  { id: 2, plate: "59A1-234.56", type: "Xe máy", status: "Không đỗ", location: null, time: null, isParking: false },
  { id: 3, plate: "29C1-999.99", type: "Xe máy", status: "Không đỗ", location: null, time: null, isParking: false },
];

const banks = [
  { id: "payos", name: "Thanh toán qua PayOS (VietQR)", color: "bg-blue-600", text: "PAY" },
];

const notifications = [
  { id: 1, title: "Đặt chỗ thành công", desc: "Bạn đã đặt slot A-42 tại Tầng 1.", time: "2 giờ trước", unread: true, icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-600/10" },
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

const pageVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

// ── Sub-components ─────────────────────────────────────────────────────────────
function ActiveSessionCard({ onCheckout }: { onCheckout: () => void }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-600/25 relative overflow-hidden"
    >
      <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none">
        <Car className="w-48 h-48" />
      </div>
      <div className="flex items-start justify-between mb-5 relative z-10">
        <div>
          <p className="text-white/70 text-sm mb-1">Phiên đỗ xe hiện tại</p>
          <h3 className="text-2xl font-bold">ParkingPro</h3>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-white/80 text-xs bg-white/20 px-2.5 py-1 rounded-lg font-semibold">Slot A-42</span>
            <span className="text-white/80 text-xs bg-white/20 px-2.5 py-1 rounded-lg font-semibold">Tầng 1</span>
            <span className="text-white/80 text-xs bg-white/20 px-2.5 py-1 rounded-lg font-semibold">Ô tô</span>
          </div>
        </div>
        <div className="bg-white text-blue-600 p-3 rounded-xl shadow-md shrink-0">
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
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onCheckout}
        className="w-full bg-white text-blue-600 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-all shadow-md relative z-10 text-sm"
      >
        Thanh toán &amp; Check-out
      </motion.button>
    </motion.div>
  );
}

function NearbyParking() {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-gray-900 dark:text-white">Khu vực đỗ xe</h2>
        <button className="text-blue-600 text-sm font-semibold hover:underline">Xem tất cả</button>
      </div>
      <div className="space-y-3">
        {parkingFloors.map((park) => {
          const pct = park.free / park.total;
          const statusColor =
            pct > 0.2 ? "text-blue-600 bg-blue-600/10"
            : pct > 0.05 ? "text-orange-500 bg-orange-50 dark:bg-orange-500/10"
            : "text-red-500 bg-red-50 dark:bg-red-500/10";
          return (
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              key={park.name}
              className="bg-white dark:bg-[#1E1E1E] p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex gap-4 items-center hover:border-blue-600/30 transition-colors cursor-pointer group shadow-sm"
            >
              <div className="w-11 h-11 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center shrink-0 border border-gray-100 dark:border-gray-700 group-hover:bg-blue-600/10 transition-colors">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{park.name}</h3>
                <p className="text-gray-400 text-xs mt-0.5">{park.type} • {park.description}</p>
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
            </motion.div>
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
        { label: "Điểm tích lũy", value: "1.240", sub: "điểm", color: "text-blue-600", bg: "bg-blue-600/10" },
      ].map((s, i) => (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          key={s.label} 
          className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm"
        >
          <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
            <span className={`text-lg font-black ${s.color}`}>•</span>
          </div>
          <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{s.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ── Page Content ───────────────────────────────────────────────────────────────
function HomeContent({ onCheckout }: { onCheckout: () => void }) {
  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="grid grid-cols-1 xl:grid-cols-3 gap-6"
    >
      {/* Left column: session + nearby */}
      <div className="xl:col-span-2 space-y-6">
        <ActiveSessionCard onCheckout={onCheckout} />
        <NearbyParking />
      </div>
      {/* Right column: quick stats + search */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Tìm vị trí đỗ</h2>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Nhập tầng hoặc số slot..."
              className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-600 transition-colors"
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-3 w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-600/90 transition-all shadow-md shadow-blue-600/20"
          >
            Tìm kiếm
          </motion.button>
        </div>
        <QuickStats />
      </div>
    </motion.div>
  );
}

function TicketsContent() {
  const [filter, setFilter] = useState<"Tất cả" | "Đang đỗ" | "Hoàn thành">("Tất cả");
  const filtered = ticketsData.filter((t) => filter === "Tất cả" || t.status === filter);
  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit">
      <div className="flex items-center gap-3 mb-6 flex-wrap relative">
        {(["Tất cả", "Đang đỗ", "Hoàn thành"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all relative z-10 ${filter === f ? "text-white" : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"}`}
          >
            {filter === f && <motion.div layoutId="ticket-filter" className="absolute inset-0 bg-blue-600 rounded-full shadow-md shadow-blue-600/20 -z-10" />}
            {filter !== f && <div className="absolute inset-0 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-full -z-10" />}
            {f}
          </button>
        ))}
      </div>
      <motion.div layout className={`grid gap-4 ${filtered.length > 0 ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-white dark:bg-[#1E1E1E] rounded-2xl border border-dashed border-gray-200 dark:border-gray-800"
            >
              <img src="/assets/empty_state.png" alt="No tickets" className="w-48 h-48 object-contain mb-4 opacity-90" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chưa có vé xe nào</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Không có dữ liệu trong bộ lọc này.</p>
            </motion.div>
          ) : (
            filtered.map((ticket, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              key={ticket.id}
              className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm relative overflow-hidden hover:border-blue-600/30 transition-colors"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${ticket.status === "Đang đỗ" ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`} />
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold text-gray-400">{ticket.id}</span>
                  <h3 className="font-bold text-gray-900 dark:text-white mt-0.5">{ticket.location}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ticket.slot}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 ${ticket.status === "Đang đỗ" ? "bg-blue-600/10 text-blue-600" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}
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
                  <p className={`font-semibold ${ticket.status === "Đang đỗ" ? "text-blue-600" : "text-gray-900 dark:text-white"}`}>{ticket.price}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 flex items-center gap-1 mb-0.5"><Clock className="w-3 h-3" /> Thời gian</p>
                  <p className="font-medium text-gray-900 dark:text-white text-xs">{ticket.timeIn}{ticket.timeOut ? ` → ${ticket.timeOut}` : " (Hiện tại)"}</p>
                </div>
              </div>
            </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function TopupContent() {
  const [topupAmount, setTopupAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState("Thanh toán qua PayOS (VietQR)");
  const [done, setDone] = useState(false);

  const handleConfirm = () => {
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-6 shadow-lg shadow-blue-600/20 flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm mb-1">Số dư hiện tại</p>
          <h3 className="text-3xl font-black">125.000 đ</h3>
        </div>
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
          <Wallet className="w-7 h-7 text-white" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div 
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-100 dark:border-gray-800 p-12 flex flex-col items-center gap-4 shadow-sm"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center"
            >
              <CheckCircle2 className="w-11 h-11 text-blue-600" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nạp tiền thành công!</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Số dư ví của bạn đã được cập nhật.</p>
          </motion.div>
        ) : (
          <motion.div 
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Chọn mệnh giá nạp</h4>
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                {[10000, 20000, 50000, 100000, 200000, 500000].map((amount) => (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    key={amount}
                    onClick={() => { setTopupAmount(amount); setCustomAmount(""); }}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${topupAmount === amount ? "bg-blue-600/10 border-blue-600 text-blue-600" : "bg-gray-50 dark:bg-[#121212] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-600/50"}`}
                  >
                    {(amount / 1000).toLocaleString("vi-VN")}k
                  </motion.button>
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
                  className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 pr-14 text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 transition-colors text-sm"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">VND</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col shadow-sm">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Phương thức thanh toán</h4>
              <div className="space-y-2.5 flex-1">
                {banks.map((bank) => (
                  <label
                    key={bank.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedBank === bank.name ? "border-blue-600 bg-blue-600/5" : "bg-gray-50 dark:bg-[#121212] border-gray-200 dark:border-gray-700 hover:border-blue-600/40"}`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0 ${bank.color}`}>
                      {bank.text}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white text-sm flex-1">{bank.name}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedBank === bank.name ? "border-blue-600" : "border-gray-300 dark:border-gray-600"}`}>
                      {selectedBank === bank.name && <motion.div layoutId="bank-indicator" className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                    </div>
                    <input type="radio" className="hidden" name="bank" checked={selectedBank === bank.name} onChange={() => setSelectedBank(bank.name)} />
                  </label>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                disabled={!topupAmount && !customAmount}
                className="mt-5 w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-600/90 transition-all shadow-lg shadow-blue-600/20 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Xác nhận nạp tiền{topupAmount ? ` — ${topupAmount.toLocaleString("vi-VN")} đ` : ""}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function HistoryContent() {
  const [historyFilter, setHistoryFilter] = useState("Tất cả");
  const filtered = transactionHistory.filter((tx) => historyFilter === "Tất cả" || tx.type === historyFilter);
  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="max-w-2xl mx-auto">
      <div className="flex gap-2 flex-wrap mb-6">
        {["Tất cả", "Nạp tiền", "Thanh toán phí", "Hoàn tiền"].map((f) => (
          <button
            key={f}
            onClick={() => setHistoryFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all relative z-10 ${historyFilter === f ? "text-white" : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"}`}
          >
            {historyFilter === f && <motion.div layoutId="history-filter" className="absolute inset-0 bg-blue-600 rounded-full shadow-md shadow-blue-600/20 -z-10" />}
            {historyFilter !== f && <div className="absolute inset-0 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-full -z-10" />}
            {f}
          </button>
        ))}
      </div>
      <motion.div layout className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-12 flex flex-col items-center justify-center text-center"
            >
              <img src="/assets/empty_state.png" alt="No history" className="w-40 h-40 object-contain mb-4 opacity-90" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chưa có lịch sử giao dịch</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Giao dịch của bạn sẽ hiển thị tại đây.</p>
            </motion.div>
          ) : (
            filtered.map((tx, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              key={tx.id}
              className={`flex items-center gap-4 p-4 ${i < filtered.length - 1 ? "border-b border-gray-50 dark:border-gray-800" : ""} hover:bg-gray-50 dark:hover:bg-[#262626] transition-colors`}
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${tx.isPositive ? "bg-blue-600/10 text-blue-600" : "bg-red-500/10 text-red-500"}`}>
                {tx.isPositive ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{tx.type}</h3>
                <p className="text-gray-400 text-xs mt-0.5">{tx.time} • {tx.method}</p>
              </div>
              <span className={`font-bold text-base shrink-0 ${tx.isPositive ? "text-blue-600" : "text-gray-900 dark:text-white"}`}>
                {tx.amount}
              </span>
            </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function VehiclesContent() {
  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="max-w-2xl mx-auto">
      <div className="space-y-4 mb-4">
        {myVehicles.map((vehicle, i) => (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            key={vehicle.id}
            className={`bg-white dark:bg-[#1E1E1E] p-5 rounded-xl border-2 transition-colors shadow-sm ${vehicle.isParking ? "border-blue-600" : "border-gray-100 dark:border-gray-800"} relative overflow-hidden`}
          >
            {vehicle.isParking && (
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                ĐANG ĐỖ
              </div>
            )}
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${vehicle.isParking ? "bg-blue-600/10 text-blue-600" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                {vehicle.type === "Xe máy" ? <Bike className="w-6 h-6" /> : <Car className="w-6 h-6" />}
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
          </motion.div>
        ))}
      </div>
      <motion.button 
        whileTap={{ scale: 0.98 }}
        className="w-full bg-blue-600/10 text-blue-600 border-2 border-blue-600 border-dashed font-bold py-4 rounded-xl hover:bg-blue-600/20 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Thêm xe mới
      </motion.button>
    </motion.div>
  );
}

function SettingsContent() {
  const navigate = useNavigate();
  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit" className="max-w-lg mx-auto space-y-3">
      {[
        { label: "Chế độ tối (Dark Mode)", right: <ThemeToggle /> },
        { label: "Ngôn ngữ", right: <span className="text-sm text-gray-500 dark:text-gray-400 font-semibold">Tiếng Việt</span> },
        { label: "Thông báo đẩy", right: <span className="text-sm text-blue-600 font-semibold">Bật</span> },
      ].map((item, i) => (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          key={item.label} 
          className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex justify-between items-center shadow-sm"
        >
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</span>
          {item.right}
        </motion.div>
      ))}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={() => navigate("/login")}
        className="w-full bg-white dark:bg-[#1E1E1E] rounded-xl p-4 border border-red-100 dark:border-red-900/30 flex justify-between items-center hover:bg-red-50 dark:hover:bg-red-500/5 transition-colors shadow-sm"
      >
        <span className="text-sm font-bold text-red-500">Đăng xuất</span>
        <LogOut className="w-4 h-4 text-red-400" />
      </motion.button>
    </motion.div>
  );
}

// ── QR Scanner Modal ──────────────────────────────────────────────────────────
function QRScannerModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-[#111] rounded-3xl p-8 w-full max-w-sm relative shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-white font-bold text-xl text-center mb-6">Quét mã QR</h2>
        <div className="relative w-56 h-56 mx-auto mb-6">
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-blue-600 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-blue-600 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-blue-600 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-blue-600 rounded-br-xl" />
          <motion.div 
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-0.5 bg-blue-600 shadow-[0_0_8px_#00C853] top-1/2 -translate-y-1/2" 
          />
          <div className="absolute inset-4 bg-white/5 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <ScanLine className="w-10 h-10 text-blue-600/50" />
          </div>
        </div>
        <p className="text-gray-400 text-center text-sm mb-4">Hướng camera về phía mã QR tại trạm để nhận vé gửi xe.</p>
        <button className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-xl transition-colors border border-white/10 text-sm font-semibold">
          <ImageIcon className="w-4 h-4" />
          Chụp từ thư viện ảnh
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ onClose }: { onClose: () => void }) {
  const [done, setDone] = useState(false);
  const confirm = () => { setDone(true); setTimeout(onClose, 2200); };
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        exit={{ y: 50 }}
        className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-8 w-full max-w-md shadow-2xl relative"
      >
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div 
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center py-6 gap-4"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center"
              >
                <CheckCircle2 className="w-11 h-11 text-blue-600" />
              </motion.div>
              <h3 className="font-bold text-2xl text-gray-900 dark:text-white">Thanh Toán Thành Công!</h3>
              <p className="text-gray-400 text-sm text-center">Cảm ơn bạn đã sử dụng ParkingPro!</p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">Thanh Toán</h3>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex justify-center mb-4">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#121212] px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Thanh toán tự động qua</span>
                  <span className="text-blue-600 font-black text-lg tracking-tight">payOS</span>
                </div>
              </div>
              <div className="flex justify-center mb-4">
                <div className="w-40 h-40 bg-white border-4 border-blue-600/20 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden">
                  <QrCode className="w-24 h-24 text-gray-800 relative z-10" />
                  <div className="absolute inset-0 bg-blue-600/5 z-0" />
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 mb-5">Mở App Ngân hàng bất kỳ để quét mã VietQR</p>
              <div className="bg-gray-50 dark:bg-[#121212] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 space-y-3 mb-5">
                {[
                  { label: "Bãi đỗ xe", value: "Vincom Center" },
                  { label: "Slot", value: "A-42 (Tầng 1)" },
                  { label: "Thời gian đỗ", value: "3 giờ 12 phút" },
                  { label: "Phí đỗ xe", value: "60.000 đ", green: true },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{row.label}</span>
                    <span className={`text-sm font-bold ${row.green ? "text-blue-600" : "text-gray-900 dark:text-white"}`}>{row.value}</span>
                  </div>
                ))}
              </div>
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={confirm} 
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-600/90 transition-all shadow-lg shadow-blue-600/20"
              >
                Xác nhận — 60.000 đ
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ── Notification Drawer ───────────────────────────────────────────────────────
function NotifDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex-1 bg-black/20 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="w-full max-w-sm bg-white dark:bg-[#1A1A1A] h-full shadow-2xl flex flex-col border-l border-gray-100 dark:border-gray-800 absolute right-0"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-xl text-gray-900 dark:text-white">Thông báo</h2>
          <div className="flex items-center gap-3">
            <button className="text-sm font-semibold text-blue-600">Đọc tất cả</button>
            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.map((notif, i) => {
            const Icon = notif.icon;
            return (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={notif.id} 
                className={`p-4 rounded-2xl border flex gap-3 ${notif.unread ? "bg-white dark:bg-[#1E1E1E] border-gray-100 dark:border-gray-800 shadow-sm" : "bg-gray-50 dark:bg-[#121212] border-transparent"}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notif.bg} ${notif.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-sm font-bold ${notif.unread ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>{notif.title}</h3>
                    {notif.unread && <div className="w-2 h-2 rounded-full bg-blue-600 mt-1 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{notif.desc}</p>
                  <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{notif.time}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
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
    <div className="flex h-screen bg-gray-50 dark:bg-[#121212] font-sans overflow-hidden transition-colors relative z-0">
      
      {/* Ambient Background Blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Sidebar */}
      <motion.aside 
        animate={{ width: sidebarOpen ? 256 : 64 }}
        className="shrink-0 bg-white dark:bg-[#1A1A1A] border-r border-gray-100 dark:border-gray-800 flex flex-col sticky top-0 h-screen overflow-hidden z-20"
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
            <Car className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-black text-gray-900 dark:text-white text-lg whitespace-nowrap"
              >
                ParkingPro
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left relative overflow-hidden group ${activeNav === item.id ? "text-blue-600" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
            >
              {activeNav === item.id && (
                <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-blue-600/10 dark:bg-blue-600/20 rounded-xl" />
              )}
              {activeNav !== item.id && (
                <div className="absolute inset-0 bg-gray-50 dark:bg-[#262626] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              <span className="shrink-0 relative z-10">{item.icon}</span>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-sm font-semibold whitespace-nowrap relative z-10"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </nav>

        {/* QR button */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQR(true)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-600/90 transition-all overflow-hidden`}
          >
            <QrCode className="w-5 h-5 shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-sm whitespace-nowrap"
                >
                  Quét QR
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => navigate("/login")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all overflow-hidden"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-sm font-semibold whitespace-nowrap"
                >
                  Đăng xuất
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-3">
            <img src="/assets/avatar.png" alt="Avatar" className="hidden sm:block w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800" />
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{pageTitles[activeNav]}</h1>
              <p className="text-xs text-gray-400">Xin chào, <span className="font-semibold text-gray-600 dark:text-gray-300">Nguyễn Văn Khách</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Balance pill */}
            <div className="hidden sm:flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-4 py-2">
              <Wallet className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-600">125.000 đ</span>
            </div>

            <ThemeToggle />

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowNotif(true)}
              className="relative p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
            </motion.button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeNav === "home" && <HomeContent key="home" onCheckout={() => setShowPayment(true)} />}
            {activeNav === "tickets" && <TicketsContent key="tickets" />}
            {activeNav === "topup" && <TopupContent key="topup" />}
            {activeNav === "history" && <HistoryContent key="history" />}
            {activeNav === "vehicles" && <VehiclesContent key="vehicles" />}
            {activeNav === "settings" && <SettingsContent key="settings" />}
          </AnimatePresence>
        </main>
      </div>

      {/* ── Overlays ── */}
      <AnimatePresence>
        {showNotif && <NotifDrawer key="notif" onClose={() => setShowNotif(false)} />}
        {showQR && <QRScannerModal key="qr" onClose={() => setShowQR(false)} />}
        {showPayment && <PaymentModal key="payment" onClose={() => setShowPayment(false)} />}
      </AnimatePresence>
    </div>
  );
}
