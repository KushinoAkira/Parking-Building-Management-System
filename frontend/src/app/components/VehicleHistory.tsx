import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Calendar, Car, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { apiGet } from "../lib/api";
import { getAuth } from "../lib/auth";

type SessionRow = {
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

function formatDateTime(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDuration(entry: string, exit: string | null) {
  if (!exit) return "Đang tính";
  const ms = new Date(exit).getTime() - new Date(entry).getTime();
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

function formatFee(fee: number | null, status: string) {
  if (status === "Active") return "Đang tính";
  if (fee == null) return "—";
  return `${fee.toLocaleString("vi-VN")}đ`;
}

export function VehicleHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const auth = getAuth();
    setLoading(true);
    setError("");
    try {
      const from = new Date();
      from.setDate(from.getDate() - 30);
      const data = await apiGet<SessionRow[]>(
        `/api/portal/staff/history?from=${from.toISOString()}&to=${new Date().toISOString()}`,
        auth?.token,
      );
      setSessions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được lịch sử");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredData = useMemo(() => {
    return sessions.filter((item) => {
      const matchSearch = item.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ticketCode.toLowerCase().includes(searchTerm.toLowerCase());
      const uiStatus = item.status === "Active" ? "Đang gửi" : "Đã rời đi";
      const matchStatus = statusFilter === "all" || uiStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [sessions, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lịch sử xe ra vào</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Theo dõi chi tiết thời gian gửi xe và phí dịch vụ (30 ngày gần nhất)</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm biển số, mã vé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#1A1A1A] text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none transition-all dark:text-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-4 pr-8 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#1A1A1A] text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Đang gửi">Đang gửi</option>
            <option value="Đã rời đi">Đã rời đi</option>
          </select>

          <button
            onClick={load}
            className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors border border-blue-100 dark:border-blue-500/20"
          >
            <Calendar className="w-4 h-4" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 text-sm border border-red-200 dark:border-red-500/20">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <th className="p-4 pl-6 whitespace-nowrap">Mã vé</th>
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
                {filteredData.map((item, index) => {
                  const uiStatus = item.status === "Active" ? "Đang gửi" : "Đã rời đi";
                  const timeIn = formatDateTime(item.entryTime);
                  const timeOut = formatDateTime(item.exitTime);
                  return (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.5) }}
                      key={item.sessionId}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="p-4 pl-6 font-mono text-gray-500 dark:text-gray-400">{item.ticketCode}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Car className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white">{item.licensePlate}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <ArrowRight className="w-3.5 h-3.5 text-green-500" />
                          {timeIn}
                        </div>
                      </td>
                      <td className="p-4">
                        {timeOut ? (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <ArrowLeft className="w-3.5 h-3.5 text-red-500" />
                            {timeOut}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 italic">—</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-300">{formatDuration(item.entryTime, item.exitTime)}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded font-medium text-xs">
                          {item.zoneCode}-{item.slotId}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-gray-900 dark:text-white">{formatFee(item.totalFee, item.status)}</td>
                      <td className="p-4 pr-6">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          uiStatus === "Đã rời đi"
                            ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                        }`}>
                          {uiStatus}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
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
        )}
      </div>
    </div>
  );
}
