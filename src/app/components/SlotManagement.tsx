import { useState } from "react";
import { Car, Search, Filter, Info, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const generateSlots = (floor: number, count: number) => {
  return Array.from({ length: count }, (_, i) => {
    const rand = Math.random();
    let status = "free";
    if (rand > 0.9) status = "violation";
    else if (rand > 0.4) status = "occupied";

    return {
      id: `F${floor}-${i + 1}`,
      name: `A-${(i + 1).toString().padStart(2, '0')}`,
      status, // "free" | "occupied" | "violation"
      type: i % 10 === 0 ? "VIP" : "Standard",
      plate: status !== "free" ? `30A-${Math.floor(100 + Math.random() * 899)}.${Math.floor(10 + Math.random() * 89)}` : null,
      checkIn: status !== "free" ? `${Math.floor(6 + Math.random() * 6)}:${Math.floor(10 + Math.random() * 49)} AM` : null,
    };
  });
};

const floors = [
  { id: 1, name: "Tầng 1 (VIP & Tiêu chuẩn)", slots: generateSlots(1, 60) },
  { id: 2, name: "Tầng 2 (Tiêu chuẩn)", slots: generateSlots(2, 60) },
  { id: 3, name: "Tầng 3 (Tiêu chuẩn)", slots: generateSlots(3, 60) },
];

export function SlotManagement() {
  const [activeFloor, setActiveFloor] = useState(floors[0]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<typeof activeFloor.slots[0] | null>(null);

  const filteredSlots = activeFloor.slots.filter(slot => {
    if (filter === "free" && slot.status !== "free") return false;
    if (filter === "occupied" && slot.status !== "occupied") return false;
    if (filter === "violation" && slot.status !== "violation") return false;
    if (searchQuery && slot.plate && !slot.plate.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (searchQuery && !slot.plate && slot.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
    if (searchQuery && !slot.plate) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Slot Xe</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Giám sát và điều khiển các vị trí đỗ xe theo thời gian thực</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm biển số hoặc mã slot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#00C853] focus:ring-1 focus:ring-[#00C853] transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Filter className="w-4 h-4" />
            Bộ lọc
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Main Grid Area */}
        <div className="flex-1 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col min-h-[500px] shadow-sm">
          {/* Tabs & Status Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 gap-4">
            <div className="flex bg-gray-100 dark:bg-[#121212] p-1 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto w-full sm:w-auto">
              {floors.map((floor) => (
                <button
                  key={floor.id}
                  onClick={() => { setActiveFloor(floor); setSelectedSlot(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    activeFloor.id === floor.id
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  {floor.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#121212] p-1 rounded-xl border border-gray-200 dark:border-gray-800 w-full sm:w-auto">
              <button
                onClick={() => setFilter("all")}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === 'all' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Tất cả ({activeFloor.slots.length})
              </button>
              <button
                onClick={() => setFilter("free")}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${filter === 'free' ? 'bg-[#00C853]/15 dark:bg-[#00C853]/20 text-[#00C853]' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <div className="w-2 h-2 rounded-full bg-[#00C853]" />
                Trống ({activeFloor.slots.filter(s => s.status === 'free').length})
              </button>
              <button
                onClick={() => setFilter("occupied")}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${filter === 'occupied' ? 'bg-red-50 dark:bg-red-500/15 text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Đang sử dụng ({activeFloor.slots.filter(s => s.status === 'occupied').length})
              </button>
              <button
                onClick={() => setFilter("violation")}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${filter === 'violation' ? 'bg-yellow-50 dark:bg-yellow-500/15 text-yellow-600' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                Vi phạm ({activeFloor.slots.filter(s => s.status === 'violation').length})
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {filteredSlots.map((slot) => (
                <div
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={`
                    relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer aspect-square
                    ${selectedSlot?.id === slot.id ? 'ring-2 ring-[#00C853] ring-offset-2 ring-offset-white dark:ring-offset-[#1A1A1A] scale-105' : 'hover:scale-105'}
                    ${slot.status === 'occupied'
                      ? "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-500 hover:border-red-300 dark:hover:border-red-500/50"
                      : slot.status === 'violation'
                      ? "border-yellow-300 dark:border-yellow-500/40 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 hover:border-yellow-400 dark:hover:border-yellow-500/60"
                      : "border-[#00C853]/20 dark:border-[#00C853]/30 bg-[#00C853]/5 dark:bg-[#00C853]/10 text-[#00C853] hover:border-[#00C853]/40 hover:bg-[#00C853]/10"
                    }
                  `}
                >
                  {slot.type === "VIP" && (
                    <span className="absolute top-1 right-1 text-[9px] font-bold bg-gray-900/10 dark:bg-white/10 px-1 rounded">VIP</span>
                  )}
                  <div className="text-xs font-bold mb-1 opacity-90">{slot.name}</div>
                  <Car className={`w-7 h-7 transition-all duration-300 ${slot.status !== 'free' ? "opacity-100 scale-100" : "opacity-30 scale-90"}`} />
                  {slot.plate && (
                    <div className="absolute bottom-1 bg-gray-900/80 dark:bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white font-mono">
                      {slot.plate}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {filteredSlots.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 py-16">
                <Search className="w-12 h-12 mb-3 opacity-20" />
                <p>Không tìm thấy slot nào phù hợp.</p>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-full lg:w-80 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col shrink-0 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-[#00C853]" />
            Chi Tiết Slot
          </h2>

          {selectedSlot ? (
            <div className="flex-1 flex flex-col space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{selectedSlot.name}</div>
                  <div className="text-sm text-gray-400 dark:text-gray-500 mt-1">Mã: {selectedSlot.id}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  selectedSlot.type === 'VIP' ? 'bg-yellow-50 dark:bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' : 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                }`}>
                  {selectedSlot.type}
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-[#121212] rounded-xl p-4 border border-gray-100 dark:border-gray-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Trạng thái</span>
                  <div className={`flex items-center gap-1.5 text-sm font-bold ${
                    selectedSlot.status === 'occupied' ? 'text-red-500' :
                    selectedSlot.status === 'violation' ? 'text-yellow-600 dark:text-yellow-500' :
                    'text-[#00C853]'
                  }`}>
                    {selectedSlot.status === 'free' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {selectedSlot.status === 'occupied' ? 'Đang sử dụng' : selectedSlot.status === 'violation' ? 'Vi phạm' : 'Có sẵn'}
                  </div>
                </div>

                {selectedSlot.status !== 'free' && (
                  <>
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Biển số xe</span>
                      <span className="text-gray-900 dark:text-white font-mono font-bold bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded-lg text-sm">
                        {selectedSlot.plate}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Giờ vào</span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {selectedSlot.checkIn}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-auto pt-4 space-y-3">
                {selectedSlot.status !== 'free' ? (
                  <>
                    <button className="w-full border-2 border-red-200 dark:border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold py-2.5 rounded-xl transition-colors text-sm">
                      Ghi nhận Check-out
                    </button>
                    {selectedSlot.status === 'violation' && (
                      <button className="w-full bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 font-bold py-2.5 rounded-xl transition-colors text-sm border border-yellow-200 dark:border-yellow-500/30">
                        Xử lý vi phạm
                      </button>
                    )}
                    <button className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium py-2.5 rounded-xl transition-colors text-sm">
                      Xem lịch sử vị trí
                    </button>
                  </>
                ) : (
                  <button className="w-full bg-[#00C853] text-white hover:bg-[#00C853]/90 font-bold py-2.5 rounded-xl transition-colors text-sm shadow-md shadow-[#00C853]/20">
                    Khóa Slot / Bảo trì
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Car className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-sm">Chọn một vị trí trên bản đồ<br/>để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
