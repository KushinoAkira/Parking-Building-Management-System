import { useState } from "react";
import { Car, MapPin, Clock, CreditCard, ChevronRight, Bell, Search, QrCode, Home, Ticket, Info, X, CheckCircle2, Wallet, History, Tag, ScanLine, Image as ImageIcon, Settings, AlertTriangle, Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useNavigate } from "react-router";
import { motion, AnimatePresence, Variants } from "motion/react";

const parkingFloors = [
  { name: "Tầng 1", type: "Ô tô & Xe máy", description: "Dành cho khách vãng lai", total: 120, free: 45, price: "15k/h" },
  { name: "Tầng 2", type: "Ô tô", description: "Dành cho thẻ tháng", total: 120, free: 12, price: "20k/h" },
  { name: "Tầng 3", type: "Xe máy", description: "Dành cho thẻ tháng", total: 120, free: 78, price: "5k/h" },
];

const ticketsData = [
  { id: "TK-1029", plate: "30A-123.45", location: "Tầng 1 - Slot A-42", timeIn: "Hôm nay, 08:30", timeOut: null, status: "Đang đỗ", price: "Đang tính..." },
  { id: "TK-1028", plate: "30A-123.45", location: "Tầng 2 - Slot B-12", timeIn: "Hôm qua, 14:00", timeOut: "Hôm qua, 16:30", status: "Hoàn thành", price: "45,000 đ" },
  { id: "TK-1027", plate: "30A-123.45", location: "Tầng 3 - Slot C-05", timeIn: "12/05/2026, 09:15", timeOut: "12/05/2026, 11:00", status: "Hoàn thành", price: "Miễn phí" },
];

const transactionHistory = [
  { id: 1, type: "Nạp tiền", amount: "+ 200.000 đ", time: "24/05/2026 10:45", method: "Momo", isPositive: true },
  { id: 2, type: "Thanh toán phí", amount: "- 60.000 đ", time: "23/05/2026 15:30", method: "Ví ParkingPro", isPositive: false },
  { id: 3, type: "Thanh toán phí", amount: "- 45.000 đ", time: "20/05/2026 16:30", method: "Ví ParkingPro", isPositive: false },
  { id: 4, type: "Hoàn tiền", amount: "+ 15.000 đ", time: "18/05/2026 09:00", method: "Hệ thống", isPositive: true },
  { id: 5, type: "Nạp tiền", amount: "+ 100.000 đ", time: "15/05/2026 08:15", method: "Vietcombank", isPositive: true },
];

const myVehicles = [
  { id: 1, plate: "30A-123.45", type: "Ô tô", status: "Đang đỗ", location: "Tầng 1 - Slot A-42", time: "08:30 - Hôm nay", isParking: true },
  { id: 2, plate: "59A1-234.56", type: "Xe máy", status: "Không đỗ", location: null, time: null, isParking: false },
  { id: 3, plate: "29C1-999.99", type: "Xe máy", status: "Không đỗ", location: null, time: null, isParking: false },
];

const banks = [
  { id: "payos", name: "Thanh toán qua PayOS (VietQR)", color: "bg-blue-600", text: "PAY" },
];

export function UserMobileHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [utilityScreen, setUtilityScreen] = useState<string | null>(null);

  const [topupAmount, setTopupAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<string>("Thanh toán qua PayOS (VietQR)");
  const [historyFilter, setHistoryFilter] = useState<string>("Tất cả");

  const notifications = [
    { id: 1, title: "Đặt chỗ thành công", desc: "Bạn đã đặt slot A-42 tại Tầng 1.", time: "2 giờ trước", unread: true, icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-600/10" },
    { id: 2, title: "Cảnh báo vi phạm", desc: "Xe của bạn đã bị chuyển đến Bãi xe vi phạm do đỗ sai vị trí. Vui lòng liên hệ BQL.", time: "1 giờ trước", unread: true, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
    { id: 3, title: "Giảm 20% phí đỗ xe", desc: "Áp dụng cho lần thanh toán tiếp theo qua ví.", time: "Hôm qua", unread: false, icon: Tag, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  const handleCheckout = () => {
    setShowPayment(true);
    setPaymentDone(false);
  };

  const handleConfirmPayment = () => {
    setPaymentDone(true);
    setTimeout(() => setShowPayment(false), 2200);
  };

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
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">Xin chào,</p>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Nguyễn Văn Khách</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
            {/* Balance pill */}
            <div className="mt-3 inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full px-4 py-1.5 shadow-sm">
              <Wallet className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Số dư: <span className="text-blue-600">125.000 đ</span></span>
            </div>
          </div>

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
                      <p className="text-white font-bold text-lg">Tìm chỗ đỗ xe dễ dàng</p>
                    </div>
                  </div>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="text"
                      placeholder="Tìm vị trí đỗ xe..."
                      className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-2xl py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-600 transition-colors shadow-sm"
                    />
                  </div>
                </div>

                {/* Active Session Card */}
                <div className="px-6 mb-6">
                  <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-widest">Phiên Đỗ Xe Hiện Tại</h2>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-5 text-white shadow-xl shadow-blue-600/25 relative overflow-hidden"
                  >
                    <div className="absolute -right-8 -top-8 opacity-10 pointer-events-none">
                      <Car className="w-36 h-36" />
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <h3 className="font-bold text-lg">ParkingPro</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-white/80 text-xs bg-white/20 px-2 py-0.5 rounded-md font-medium">Slot A-42</span>
                          <span className="text-white/80 text-xs bg-white/20 px-2 py-0.5 rounded-md font-medium">Tầng 1</span>
                        </div>
                      </div>
                      <div className="bg-white text-blue-600 p-2.5 rounded-2xl shadow-md">
                        <QrCode className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-5 border-t border-white/20 pt-4 relative z-10">
                      <div>
                        <p className="text-white/70 text-xs mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Giờ vào</p>
                        <p className="font-bold text-sm">08:30</p>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs mb-1 flex items-center gap-1"><Info className="w-3 h-3" /> Biển số</p>
                        <p className="font-mono font-bold text-sm">30A-123.45</p>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs mb-1 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Tạm tính</p>
                        <p className="font-bold text-sm">60,000 đ</p>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCheckout}
                      className="w-full bg-white text-blue-600 font-bold py-3 rounded-2xl hover:bg-gray-50 transition-all shadow-md relative z-10"
                    >
                      Thanh toán & Check-out
                    </motion.button>
                  </motion.div>
                </div>

                {/* Quick Actions */}
                <div className="px-6 mb-6">
                  <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-widest">Tiện ích</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "topup", icon: <CreditCard className="w-5 h-5" />, label: "Nạp tiền", color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10" },
                      { id: "history", icon: <History className="w-5 h-5" />, label: "Lịch sử GD", color: "text-orange-500 bg-orange-50 dark:bg-orange-500/10" },
                      { id: "vehicles", icon: <Car className="w-5 h-5" />, label: "Xe của tôi", color: "text-purple-500 bg-purple-50 dark:bg-purple-500/10" },
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
                    <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Khu Vực Đỗ Xe</h2>
                    <button className="text-blue-600 text-xs font-semibold">Xem tất cả</button>
                  </div>
                  <div className="space-y-3">
                    {parkingFloors.map((park) => {
                      const pct = park.free / park.total;
                      const statusColor = pct > 0.2
                        ? 'text-blue-600 bg-blue-600/10'
                        : pct > 0.05
                        ? 'text-orange-500 bg-orange-50 dark:bg-orange-500/10'
                        : 'text-red-500 bg-red-50 dark:bg-red-500/10';
                      return (
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          key={park.name} 
                          className="bg-white dark:bg-[#121212] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex gap-3 items-center shadow-sm hover:border-blue-600/30 transition-all cursor-pointer"
                        >
                          <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 dark:border-gray-700">
                            <MapPin className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">{park.name}</h3>
                            <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{park.type} • {park.description}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${statusColor}`}>
                                Trống {park.free}/{park.total}
                              </span>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg">
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
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Vé Của Tôi</h2>
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
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${ticket.status === 'Đang đỗ' ? 'bg-blue-600/10 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Car className="w-3 h-3" /> Biển số</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{ticket.plate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Phí</p>
                          <p className={`font-semibold ${ticket.status === 'Đang đỗ' ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>{ticket.price}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Thời gian</p>
                          <p className="font-medium text-gray-900 dark:text-white">{ticket.timeIn} {ticket.timeOut ? ` - ${ticket.timeOut}` : ' (Hiện tại)'}</p>
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
            <span className="text-[10px] font-semibold">Trang chủ</span>
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
            <span className="text-[10px] font-semibold">Vé của tôi</span>
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
                  <p className="text-white font-semibold">Quét mã QR</p>
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

                  <h2 className="text-xl font-bold text-white text-center mb-2">Quét mã QR để nhận vé</h2>
                  <p className="text-gray-400 text-center text-sm mb-12">Hướng camera về phía mã QR tại trạm để tự động nhận vé gửi xe.</p>

                  <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl backdrop-blur-md transition-colors border border-white/10">
                    <ImageIcon className="w-5 h-5" />
                    <span className="font-semibold text-sm">Chụp từ thư viện</span>
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
                 <h2 className="font-bold text-xl text-gray-900 dark:text-white">Cài đặt</h2>
               </div>
               <div className="p-6">
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">Chế độ tối (Dark Mode)</span>
                      <ThemeToggle />
                    </div>
                    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => navigate("/login")}>
                      <span className="text-sm font-semibold text-red-500">Đăng xuất</span>
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
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white">Thanh Toán Thành Công!</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center">Cảm ơn bạn đã sử dụng ParkingPro!</p>
                  </motion.div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">Thanh Toán</h3>
                      <button onClick={() => setShowPayment(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
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
                      <div className="w-48 h-48 bg-white border-4 border-blue-600/20 rounded-3xl flex items-center justify-center shadow-inner relative overflow-hidden">
                        <QrCode className="w-32 h-32 text-gray-800 relative z-10" />
                        <div className="absolute inset-0 bg-blue-600/5 z-0" />
                      </div>
                    </div>
                    <p className="text-center text-sm text-gray-400 mb-6">Mở App Ngân hàng bất kỳ để quét mã VietQR</p>
                    <div className="bg-gray-50 dark:bg-[#121212] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-2.5 mb-4">
                      {[
                        { label: "Bãi đỗ xe", value: "Vincom Center" },
                        { label: "Slot", value: "A-42 (Tầng 1)" },
                        { label: "Thời gian đỗ", value: "3 giờ 12 phút" },
                        { label: "Phí đỗ xe", value: "60,000 đ", green: true },
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
                      Xác nhận — 60,000 đ
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
                <h2 className="font-bold text-xl text-gray-900 dark:text-white">Thông báo</h2>
                <div className="flex items-center gap-3">
                  <button className="text-sm font-semibold text-blue-600">Đọc tất cả</button>
                  <button onClick={() => setShowNotifications(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
                {notifications.map((notif, i) => {
                  const Icon = notif.icon;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={notif.id} 
                      className={`p-4 rounded-2xl border ${notif.unread ? 'bg-white dark:bg-[#1A1A1A] border-gray-100 dark:border-gray-800 shadow-sm' : 'bg-gray-50 dark:bg-[#121212] border-transparent'} flex gap-3`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${notif.bg} ${notif.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className={`text-sm font-bold truncate ${notif.unread ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{notif.title}</h3>
                          {notif.unread && <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{notif.desc}</p>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">{notif.time}</p>
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
          {/* Nạp tiền Panel */}
          {utilityScreen === 'topup' && (
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
                <h2 className="font-bold text-xl text-gray-900 dark:text-white">Nạp tiền vào tài khoản</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'none' }}>
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white mb-6 shadow-lg shadow-blue-600/20">
                  <p className="text-white/80 text-sm mb-1">Số dư hiện tại</p>
                  <h3 className="text-3xl font-bold">125.000 đ</h3>
                </div>

                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Chọn mệnh giá nạp</h4>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[10000, 20000, 50000, 100000, 200000, 500000, 1000000].map(amount => (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      key={amount}
                      onClick={() => { setTopupAmount(amount); setCustomAmount(""); }}
                      className={`py-2 rounded-xl text-sm font-semibold border transition-all ${topupAmount === amount ? 'bg-blue-600/10 border-blue-600 text-blue-600' : 'bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-600/50'}`}
                    >
                      {(amount/1000).toLocaleString('vi-VN')}k
                    </motion.button>
                  ))}
                </div>

                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Hoặc nhập số tiền khác</h4>
                <div className="mb-6 relative">
                  <input
                    type="text"
                    placeholder="Nhập số tiền..."
                    value={customAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setCustomAmount(val ? Number(val).toLocaleString('vi-VN') : "");
                      setTopupAmount(null);
                    }}
                    className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:border-blue-600 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">VND</span>
                </div>

                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Phương thức thanh toán</h4>
                <div className="space-y-3 mb-8">
                  {banks.map(bank => (
                    <label key={bank.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedBank === bank.name ? 'border-blue-600 bg-blue-600/5' : 'bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-gray-700'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-[10px] ${bank.color}`}>
                          {bank.text}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{bank.name}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedBank === bank.name ? 'border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                        {selectedBank === bank.name && <motion.div layoutId="bank-select" className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                      </div>
                      <input type="radio" className="hidden" name="bank" checked={selectedBank === bank.name} onChange={() => setSelectedBank(bank.name)} />
                    </label>
                  ))}
                </div>

                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-600/90 transition-all shadow-lg shadow-blue-600/25"
                >
                  Xác nhận nạp tiền
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
                <h2 className="font-bold text-xl text-gray-900 dark:text-white">Lịch sử giao dịch</h2>
              </div>
              
              <div className="px-6 py-4 bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-gray-800 shrink-0 overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: 'none' }}>
                <div className="flex gap-2">
                  {["Tất cả", "Nạp tiền", "Thanh toán phí", "Hoàn tiền"].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setHistoryFilter(filter)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${historyFilter === filter ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3" style={{ scrollbarWidth: 'none' }}>
                <AnimatePresence mode="popLayout">
                  {transactionHistory.filter(tx => historyFilter === "Tất cả" || tx.type === historyFilter).map((tx, i) => (
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
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{tx.type}</h3>
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
                <h2 className="font-bold text-xl text-gray-900 dark:text-white">Xe của tôi</h2>
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
                        ĐANG ĐỖ
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
                  Thêm xe mới
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Demo back button */}
      <button
        onClick={() => navigate("/login")}
        className="absolute top-8 left-8 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-md font-medium text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        ← Trở về Đăng nhập
      </button>
    </div>
  );
}