import { useState, useEffect } from "react";
import { Car, Camera, LogOut, CheckCircle, X, Phone, AlertTriangle, PhoneCall, ShieldAlert, List } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationDropdown } from "./NotificationDropdown";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { VehicleHistory } from "./VehicleHistory";

export function StaffDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"control" | "violations" | "history">("control");
  
  // Control State
  const [plate, setPlate] = useState("");
  const [duration, setDuration] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ plate: string; type: "in" | "out"; time: string; slot?: string; isAiRecommended?: boolean } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  type SlotStatus = 'free' | 'occupied' | 'violation';
  const generateFloorSlots = (floorId: number) => {
    const type = floorId <= 2 ? "Xe máy" : "Ô tô";
    const count = floorId <= 2 ? 120 : 60;
    return Array.from({ length: count }, (_, i) => {
      const r = Math.random();
      let status: SlotStatus = 'free';
      if (r > 0.9) status = 'violation';
      else if (r > 0.35) status = 'occupied';
      return { 
        id: i + 1, 
        floorId, 
        status,
        type,
        plate: status !== 'free' ? (type === "Ô tô" ? `30A-${Math.floor(100 + Math.random() * 899)}.${Math.floor(10 + Math.random() * 89)}` : `29-H1 ${Math.floor(100 + Math.random() * 899)}.${Math.floor(10 + Math.random() * 89)}`) : undefined,
        checkIn: status !== 'free' ? `${Math.floor(6 + Math.random() * 6)}:${Math.floor(10 + Math.random() * 49)}` : undefined
      };
    });
  };

  const [floors] = useState([
    { id: 1, name: 'Tầng 1 (Xe máy)', slots: generateFloorSlots(1) },
    { id: 2, name: 'Tầng 2 (Xe máy)', slots: generateFloorSlots(2) },
    { id: 3, name: 'Tầng 3 (Ô tô)', slots: generateFloorSlots(3) }
  ]);
  const [activeFloorId, setActiveFloorId] = useState(1);
  const activeFloor = floors.find(f => f.id === activeFloorId)!;

  // Modal State
  const [selectedSlot, setSelectedSlot] = useState<{ id: number; floorId: number; status: SlotStatus; plate?: string; checkIn?: string } | null>(null);
  const [showSupport, setShowSupport] = useState(false);
  const [showViolationForm, setShowViolationForm] = useState(false);
  const [callingContact, setCallingContact] = useState<string | null>(null);

  // Violations State
  const [violations, setViolations] = useState([
    { id: "VP-001", plate: "30F-555.22", type: "Đỗ sai vị trí", note: "Đỗ vào slot của xe khác", time: "10:30, 29/05/2026", status: "Chưa xử lý" }
  ]);

  // Form State
  const [vPlate, setVPlate] = useState("");
  const [vType, setVType] = useState("Đỗ sai vị trí");
  const [vNote, setVNote] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const simulateScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      const isOut = Math.random() > 0.5;
      const floorId = Math.floor(1 + Math.random() * 3);
      const prefix = String.fromCharCode(64 + floorId);
      const slotNum = Math.floor(1 + Math.random() * 119);
      setScanResult({
        plate: `30A-${Math.floor(100 + Math.random() * 899)}.${Math.floor(10 + Math.random() * 89)}`,
        type: isOut ? "out" : "in",
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        slot: isOut ? undefined : `${prefix}-${slotNum}`,
        isAiRecommended: !isOut,
      });
      setPlate("");
      setDuration("");
    }, 1800);
  };

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate) return;
    const floorId = Math.floor(1 + Math.random() * 3);
    const prefix = String.fromCharCode(64 + floorId);
    const slotNum = Math.floor(1 + Math.random() * 119);
    setScanResult({
      plate,
      type: "in",
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      slot: `${prefix}-${slotNum}`,
      isAiRecommended: true,
    });
    setPlate("");
    setDuration("");
  };

  const handleViolationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vPlate) return;
    const newViolation = {
      id: `VP-00${violations.length + 2}`,
      plate: vPlate,
      type: vType,
      note: vNote,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
      status: "Chưa xử lý"
    };
    setViolations([newViolation, ...violations]);
    setShowViolationForm(false);
    setVPlate("");
    setVType("Đỗ sai vị trí");
    setVNote("");
  };

  const freeCount = activeFloor.slots.filter(s => s.status === 'free').length;
  const occupiedCount = activeFloor.slots.filter(s => s.status === 'occupied').length;
  const violationCount = activeFloor.slots.filter(s => s.status === 'violation').length;

  const tabContentVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex flex-col transition-colors duration-200">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-600/20">
            <Car className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white leading-tight">Trạm Kiểm Soát</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Lối vào 1 — Ca Sáng</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
              {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {currentTime.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
            </span>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />
          <ThemeToggle />
          <NotificationDropdown />
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">
              A
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Nguyễn Văn A</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Nhân viên</p>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 pt-4 flex gap-4">
        <button
          onClick={() => setActiveTab("control")}
          className={`px-4 py-2 font-semibold text-sm rounded-lg transition-colors relative ${activeTab === 'control' ? 'text-white' : 'bg-white dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'}`}
        >
          {activeTab === 'control' && <motion.div layoutId="staff-tab" className="absolute inset-0 bg-blue-600 rounded-lg" style={{ zIndex: 0 }} />}
          <div className="relative z-10 flex items-center">
            <Camera className="w-4 h-4 mr-2" />
            Kiểm Soát Xe
          </div>
        </button>
        <button
          onClick={() => setActiveTab("violations")}
          className={`px-4 py-2 font-semibold text-sm rounded-lg transition-colors relative ${activeTab === 'violations' ? 'text-white' : 'bg-white dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'}`}
        >
          {activeTab === 'violations' && <motion.div layoutId="staff-tab" className="absolute inset-0 bg-blue-600 rounded-lg" style={{ zIndex: 0 }} />}
          <div className="relative z-10 flex items-center">
            <ShieldAlert className="w-4 h-4 mr-2" />
            Bãi Xe Vi Phạm
          </div>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 font-semibold text-sm rounded-lg transition-colors relative ${activeTab === 'history' ? 'text-white' : 'bg-white dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'}`}
        >
          {activeTab === 'history' && <motion.div layoutId="staff-tab" className="absolute inset-0 bg-blue-600 rounded-lg" style={{ zIndex: 0 }} />}
          <div className="relative z-10 flex items-center">
            <List className="w-4 h-4 mr-2" />
            Lịch Sử Ra Vào
          </div>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <AnimatePresence mode="wait">
          {activeTab === "control" && (
            <motion.div 
              key="control"
              variants={tabContentVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex flex-col lg:flex-row gap-6 h-full"
            >
              {/* Left Panel */}
              <div className="lg:w-[340px] flex flex-col gap-5 shrink-0">
                {/* Scanner Card */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-gray-900 dark:text-white">Camera Quét Biển Số</h2>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-600/10 px-2.5 py-1 rounded-full border border-blue-600/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      Trực tuyến
                    </span>
                  </div>

                  <div className="relative aspect-video bg-gray-100 dark:bg-[#0A0A0A] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 mb-4">
                    <AnimatePresence>
                      {isScanning ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 gap-3">
                          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <p className="text-white text-sm font-semibold">Đang nhận diện...</p>
                          <div className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-blue-600 to-transparent" style={{ animation: 'bounce 1s ease-in-out infinite', top: '50%' }} />
                        </motion.div>
                      ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                          <Camera className="w-10 h-10 mb-2 opacity-40" />
                          <p className="text-xs">Chờ xe vào vị trí...</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Corner guides */}
                    <div className="absolute inset-5 pointer-events-none z-30">
                      <div className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-blue-600 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-blue-600 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-blue-600 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-blue-600 rounded-br-lg" />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={simulateScan}
                    disabled={isScanning}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-md shadow-blue-500/20"
                  >
                    <Camera className="w-5 h-5" />
                    Mô phỏng Quét Camera
                  </motion.button>
                </div>

                {/* Manual Entry */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
                  <h2 className="font-bold text-gray-900 dark:text-white mb-3">Nhập Thủ Công</h2>
                  <form onSubmit={handleManualEntry} className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="VD: 30A-123.45"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value.toUpperCase())}
                      className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono text-base uppercase transition-colors"
                    />
                    <input
                      type="number"
                      placeholder="Giờ đỗ (dự kiến)"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono text-base transition-colors"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={!plate}
                      className="w-full bg-blue-600 hover:bg-blue-600/90 text-white px-5 py-3 rounded-xl font-semibold transition-all disabled:opacity-40 shadow-md shadow-blue-600/20 mt-1"
                    >
                      Ghi & Phân Bổ Slot
                    </motion.button>
                  </form>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <motion.button 
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSupport(true)}
                    className="bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors border border-orange-200 dark:border-orange-500/30"
                  >
                    <Phone className="w-6 h-6" />
                    <span className="font-semibold text-sm">Gọi hỗ trợ</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowViolationForm(true)}
                    className="bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors border border-red-200 dark:border-red-500/30"
                  >
                    <AlertTriangle className="w-6 h-6" />
                    <span className="font-semibold text-sm text-center">Ghi nhận<br/>vi phạm</span>
                  </motion.button>
                </div>
              </div>

              {/* Right Panel */}
              <div className="flex-1 flex flex-col gap-5 min-w-0">
                {/* Result Banner */}
                <AnimatePresence mode="popLayout">
                  {scanResult ? (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, scale: 0.95, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      className={`rounded-2xl p-5 border-2 flex items-start gap-5 shadow-sm ${
                        scanResult.type === 'in'
                          ? 'bg-blue-600/5 dark:bg-blue-600/10 border-blue-600/25 dark:border-blue-600/30'
                          : 'bg-blue-50 dark:bg-blue-900/15 border-blue-200 dark:border-blue-500/30'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        scanResult.type === 'in' ? 'bg-blue-600/15 text-blue-600' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      }`}>
                        <CheckCircle className="w-7 h-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                          {scanResult.type === 'in' ? 'Check-in Thành Công' : 'Check-out Thành Công'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg font-mono font-bold text-gray-900 dark:text-white shadow-sm">
                            {scanResult.plate}
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Lúc <span className="font-semibold text-gray-700 dark:text-gray-300">{scanResult.time}</span>
                          </span>
                          {scanResult.slot && (
                            <span className="bg-blue-600/10 text-blue-600 font-bold px-3 py-1.5 rounded-lg text-sm border border-blue-600/20">
                              Slot: {scanResult.slot} {scanResult.isAiRecommended && "✨ (AI Đề xuất)"}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => setScanResult(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors text-gray-400 shrink-0">
                        <X className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty-result"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                      className="bg-white dark:bg-[#1A1A1A] border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 flex items-center justify-center min-h-[100px] text-gray-400 dark:text-gray-500 text-sm"
                    >
                      Chưa có thông tin xe. Hãy quét hoặc nhập biển số để bắt đầu.
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Stats bar */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Tổng Slot", value: activeFloor.slots.length, colorClass: "text-gray-900 dark:text-white", bg: "bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-gray-800" },
                    { label: "Đang Trống", value: freeCount, colorClass: "text-blue-600", bg: "bg-blue-600/5 dark:bg-blue-600/10 border-blue-600/20" },
                    { label: "Đã Chiếm", value: occupiedCount, colorClass: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20" },
                    { label: "Vi Phạm", value: violationCount, colorClass: "text-yellow-600 dark:text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20" },
                  ].map((stat, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={stat.label} 
                      className={`${stat.bg} rounded-2xl border p-4 text-center shadow-sm flex flex-col justify-center`}
                    >
                      <div className={`text-xl sm:text-2xl font-bold ${stat.colorClass}`}>{stat.value}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Slots Grid */}
                <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm flex-1 flex flex-col min-h-[300px]">
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-3">
                    <div className="flex bg-gray-100 dark:bg-[#121212] p-1 rounded-xl border border-gray-200 dark:border-gray-800 w-full sm:w-auto relative">
                      {floors.map(floor => (
                        <button
                          key={floor.id}
                          onClick={() => setActiveFloorId(floor.id)}
                          className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-colors relative z-10 ${
                            activeFloorId === floor.id
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          {activeFloorId === floor.id && (
                            <motion.div layoutId="floor-tab" className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm -z-10" />
                          )}
                          {floor.name}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-blue-600/20 border border-blue-600/30" />
                        Trống
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30" />
                        Đã chiếm
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-500/20 border border-yellow-200 dark:border-yellow-500/30" />
                        Vi phạm
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1">
                    <motion.div 
                      key={activeFloorId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-12 gap-2"
                    >
                      {activeFloor.slots.map((slot) => (
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer select-none ${
                            slot.type === 'Ô tô' ? 'col-span-2 aspect-[2/1]' : 'aspect-square'
                          } ${
                            slot.status === 'occupied'
                              ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-500'
                              : slot.status === 'violation'
                              ? 'bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/40 text-yellow-600 dark:text-yellow-500'
                              : 'bg-blue-600/5 dark:bg-blue-600/10 border border-blue-600/25 text-blue-600'
                          }`}
                        >
                          {String.fromCharCode(64 + activeFloorId)}-{slot.id}
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "violations" && (
            <motion.div 
              key="violations"
              variants={tabContentVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex-1 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm overflow-hidden flex flex-col"
            >
               <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="font-bold text-xl text-gray-900 dark:text-white">Bãi Xe Vi Phạm</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý và theo dõi các xe đỗ sai quy định</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowViolationForm(true)}
                    className="bg-blue-600 hover:bg-blue-600/90 text-white px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 text-sm"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Ghi nhận mới
                  </motion.button>
               </div>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-500 dark:text-gray-400">
                       <th className="py-3 px-4">Mã Phiếu</th>
                       <th className="py-3 px-4">Biển số xe</th>
                       <th className="py-3 px-4">Lỗi vi phạm</th>
                       <th className="py-3 px-4">Thời gian</th>
                       <th className="py-3 px-4">Trạng thái</th>
                     </tr>
                   </thead>
                   <tbody>
                     <AnimatePresence>
                       {violations.length > 0 ? violations.map((v, i) => (
                         <motion.tr 
                           key={v.id} 
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: i * 0.05 }}
                           className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm"
                         >
                           <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{v.id}</td>
                           <td className="py-3 px-4 font-mono font-semibold text-gray-700 dark:text-gray-300">{v.plate}</td>
                           <td className="py-3 px-4">
                             <div className="font-medium text-gray-900 dark:text-white">{v.type}</div>
                             <div className="text-xs text-gray-500 dark:text-gray-400">{v.note}</div>
                           </td>
                           <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{v.time}</td>
                           <td className="py-3 px-4">
                             <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                               {v.status}
                             </span>
                           </td>
                         </motion.tr>
                       )) : (
                         <tr>
                           <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">Không có dữ liệu vi phạm.</td>
                         </tr>
                       )}
                     </AnimatePresence>
                   </tbody>
                 </table>
               </div>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div 
              key="history"
              variants={tabContentVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex-1 overflow-y-auto"
            >
              <VehicleHistory />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Gọi hỗ trợ Modal */}
      <AnimatePresence>
        {showSupport && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#1A1A1A] w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800"
            >
              {callingContact ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="w-20 h-20 bg-green-100 dark:bg-blue-600/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <PhoneCall className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Đang gọi {callingContact}...</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">0987 654 321</p>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCallingContact(null)}
                    className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition-colors"
                  >
                    <Phone className="w-6 h-6 rotate-[135deg]" />
                  </motion.button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white">Gọi hỗ trợ</h3>
                    <button onClick={() => setShowSupport(false)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {['Trạm thu 1', 'Trạm thu 2', 'Trạm thu 3', 'Quản lý (Manager)'].map((contact) => (
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={contact}
                        onClick={() => setCallingContact(contact)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 hover:border-blue-600 hover:shadow-sm rounded-xl transition-all group"
                      >
                        <span className="font-semibold text-gray-900 dark:text-white">{contact}</span>
                        <Phone className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </motion.button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ghi nhận vi phạm Form Modal */}
      <AnimatePresence>
        {showViolationForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#1A1A1A] w-full max-w-md rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">Ghi nhận xe vi phạm</h3>
                <button onClick={() => setShowViolationForm(false)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleViolationSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Biển số xe</label>
                  <input 
                    type="text" 
                    value={vPlate}
                    onChange={(e) => setVPlate(e.target.value)}
                    placeholder="VD: 30A-123.45" 
                    required
                    className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Loại vi phạm</label>
                  <select 
                    value={vType}
                    onChange={(e) => setVType(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors"
                  >
                    <option value="Đỗ sai vị trí">Đỗ sai vị trí</option>
                    <option value="Chiếm 2 slot">Chiếm 2 slot</option>
                    <option value="Đỗ xe máy vào ô tô">Đỗ xe máy vào ô tô</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Ghi chú (Tuỳ chọn)</label>
                  <textarea 
                    value={vNote}
                    onChange={(e) => setVNote(e.target.value)}
                    placeholder="Mô tả thêm..." 
                    className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors h-24 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Ảnh minh họa (Tuỳ chọn)</label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <Camera className="w-6 h-6 mb-2 text-gray-400" />
                    <span className="text-sm font-medium">Chụp hoặc Tải ảnh lên</span>
                  </div>
                </div>
                <div className="pt-2">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-600/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-colors"
                  >
                    Lưu & Chuyển xe vi phạm
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chi Tiết Slot Modal */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#1A1A1A] w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold">
                    A{selectedSlot.id}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">Chi tiết vị trí</h3>
                </div>
                <button onClick={() => setSelectedSlot(null)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Trạng thái</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedSlot.status === 'occupied' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' :
                    selectedSlot.status === 'violation' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' :
                    'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                  }`}>
                    {selectedSlot.status === 'free' ? 'Trống' : selectedSlot.status === 'occupied' ? 'Đang sử dụng' : 'Vi phạm'}
                  </span>
                </div>

                {selectedSlot.status !== 'free' ? (
                  <>
                    <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400">Biển số xe</span>
                      <span className="font-mono font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">
                        {selectedSlot.plate}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400">Giờ vào</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedSlot.checkIn}
                      </span>
                    </div>
                    
                    <div className="pt-2 flex gap-3">
                      <button className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 font-semibold py-2.5 rounded-xl transition-colors border border-red-200 dark:border-red-500/30">
                        Check-out
                      </button>
                      {selectedSlot.status === 'violation' && (
                        <button className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:hover:bg-yellow-500/20 dark:text-yellow-500 font-semibold py-2.5 rounded-xl transition-colors border border-yellow-200 dark:border-yellow-500/30">
                          Xử phạt
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    <Car className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Vị trí này đang trống</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}