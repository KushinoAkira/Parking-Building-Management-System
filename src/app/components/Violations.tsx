import { useState } from "react";
import { Search, Filter, ShieldAlert, Car, MapPin, MoreHorizontal, ArrowUpRight } from "lucide-react";

const mockViolations = [
  { id: "VP-001", plate: "30A-123.45", owner: "Nguyễn Văn A", type: "Đỗ sai vị trí", time: "10:30, 29/05/2026", status: "Chưa xử lý", fine: "150,000 đ" },
  { id: "VP-002", plate: "29C-888.99", owner: "Trần Thị B", type: "Chiếm 2 slot", time: "08:15, 29/05/2026", status: "Đã nộp phạt", fine: "200,000 đ" },
  { id: "VP-003", plate: "51F-456.78", owner: "Lê Hoàng C", type: "Đỗ xe máy vào ô tô", time: "16:45, 28/05/2026", status: "Chưa xử lý", fine: "100,000 đ" },
];

export function Violations() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="p-6 sm:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            Bãi Xe Vi Phạm
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Quản lý và xử lý các phương tiện vi phạm quy định đỗ xe.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm biển số, mã vé..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:border-[#00C853] focus:ring-1 focus:ring-[#00C853] transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0">
            <Filter className="w-4 h-4" />
            Lọc
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Tổng Số Vi Phạm", value: "142", trend: "+12%", bg: "bg-gray-50 dark:bg-gray-800/50" },
          { label: "Chưa Xử Lý", value: "18", trend: "+3", bg: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" },
          { label: "Đã Nộp Phạt", value: "124", trend: "+24", bg: "bg-[#00C853]/10 text-[#00C853]" },
        ].map(stat => (
          <div key={stat.label} className={`p-6 rounded-2xl border border-gray-100 dark:border-gray-800 ${stat.bg}`}>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{stat.label}</p>
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold">{stat.value}</span>
              <span className="text-sm font-semibold flex items-center mb-1">
                <ArrowUpRight className="w-4 h-4 mr-0.5" />
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-[#121212]/50">
                <th className="py-4 px-6">Biển Số Xe</th>
                <th className="py-4 px-6">Thông Tin Chủ Xe</th>
                <th className="py-4 px-6">Lỗi Vi Phạm</th>
                <th className="py-4 px-6">Thời Gian</th>
                <th className="py-4 px-6">Mức Phạt</th>
                <th className="py-4 px-6">Trạng Thái</th>
                <th className="py-4 px-6 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {mockViolations.map((v) => (
                <tr key={v.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                        <Car className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-gray-900 dark:text-white">{v.plate}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Mã: {v.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{v.owner}</td>
                  <td className="py-4 px-6">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20">
                      {v.type}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{v.time}</td>
                  <td className="py-4 px-6 font-bold text-gray-900 dark:text-white">{v.fine}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      v.status === 'Chưa xử lý' 
                        ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'
                        : 'bg-[#00C853]/10 text-[#00C853] border-[#00C853]/20'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}