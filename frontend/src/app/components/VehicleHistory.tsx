import { useState } from "react";
import { Search, Filter, Calendar, Car, ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

const generateHistoryData = () => {
  const data = [];
  const areas = ["A", "B", "C"];
  
  // Specific records for stable visual testing
  data.push({ id: "HIS-1001", plate: "30A-123.45", timeIn: "08:15 05/06/2026", timeOut: "17:30 05/06/2026", duration: "9h 15m", slot: "A15", status: "Đã rời đi", fee: "50.000đ" });
  data.push({ id: "HIS-1002", plate: "29C-987.65", timeIn: "09:00 05/06/2026", timeOut: null, duration: "Đang tính", slot: "B12", status: "Đang gửi", fee: "Đang tính" });
  data.push({ id: "HIS-1003", plate: "51F-555.55", timeIn: "07:45 05/06/2026", timeOut: "10:15 05/06/2026", duration: "2h 30m", slot: "A02", status: "Đã rời đi", fee: "15.000đ" });
  
  // Generate random records
  for (let i = 4; i <= 80; i++) {
    const isParking = Math.random() > 0.5; // 50% chance currently parking
    const status = isParking ? "Đang gửi" : "Đã rời đi";
    const slot = `${areas[Math.floor(Math.random() * areas.length)]}${Math.floor(1 + Math.random() * 50)}`;
    const plate = `${Math.floor(30 + Math.random() * 69)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(100 + Math.random() * 899)}.${Math.floor(10 + Math.random() * 89)}`;
    const hourIn = Math.floor(6 + Math.random() * 8);
    const minIn = Math.floor(Math.random() * 60);
    const timeIn = `${hourIn.toString().padStart(2, '0')}:${minIn.toString().padStart(2, '0')} 05/06/2026`;
    
    let timeOut = null;
    let duration = "Đang tính";
    let fee = "Đang tính";
    
    if (!isParking) {
      const hourOut = hourIn + Math.floor(1 + Math.random() * 6);
      const minOut = Math.floor(Math.random() * 60);
      timeOut = `${hourOut.toString().padStart(2, '0')}:${minOut.toString().padStart(2, '0')} 05/06/2026`;
      duration = `${hourOut - hourIn}h ${Math.abs(minOut - minIn)}m`;
      fee = `${(hourOut - hourIn) * 15}.000đ`;
    }
    
    data.push({
      id: `HIS-${1000 + i}`,
      plate,
      timeIn,
      timeOut,
      duration,
      slot,
      status,
      fee
    });
  }
  return data;
};

const HISTORY_DATA = generateHistoryData();

export function VehicleHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = HISTORY_DATA.filter(item => {
    const matchSearch = item.plate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lịch sử xe ra vào</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Theo dõi chi tiết thời gian gửi xe và phí dịch vụ</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm biển số..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#1A1A1A] text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-all dark:text-white"
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-4 pr-8 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#1A1A1A] text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-all dark:text-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Đang gửi">Đang gửi</option>
            <option value="Đã rời đi">Đã rời đi</option>
          </select>

          <button className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors border border-blue-100 dark:border-blue-500/20">
            <Calendar className="w-4 h-4" />
            <span>Tháng này</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400">
                <th className="p-4 pl-6 whitespace-nowrap">Mã GD</th>
                <th className="p-4 whitespace-nowrap">Biển số xe</th>
                <th className="p-4 whitespace-nowrap">Thời gian vào</th>
                <th className="p-4 whitespace-nowrap">Thời gian ra</th>
                <th className="p-4 whitespace-nowrap">Thời lượng</th>
                <th className="p-4 whitespace-nowrap">Vị trí</th>
                <th className="p-4 whitespace-nowrap">Phí gửi</th>
                <th className="p-4 pr-6 whitespace-nowrap">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {filteredData.map((item, index) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={item.id} 
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="p-4 pl-6 font-mono text-gray-500 dark:text-gray-400">{item.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Car className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">{item.plate}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <ArrowRight className="w-3.5 h-3.5 text-green-500" />
                      {item.timeIn}
                    </div>
                  </td>
                  <td className="p-4">
                    {item.timeOut ? (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <ArrowLeft className="w-3.5 h-3.5 text-red-500" />
                        {item.timeOut}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic">-</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{item.duration}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded font-medium text-xs">
                      {item.slot}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-gray-900 dark:text-white">{item.fee}</td>
                  <td className="p-4 pr-6">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'Đã rời đi' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' 
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    Không tìm thấy lịch sử phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
