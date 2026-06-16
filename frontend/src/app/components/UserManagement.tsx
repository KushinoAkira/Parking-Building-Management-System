import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Mail, Phone, Check, X, Users, ShieldAlert, Car } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const initialStaff = [
  { id: "EMP-001", name: "Nguyễn Văn A", role: "Quản lý", phone: "0901234567", email: "nva@parkingpro.vn", status: "active" },
  { id: "EMP-002", name: "Trần Thị B", role: "Bảo vệ", phone: "0912345678", email: "ttb@parkingpro.vn", status: "active" },
  { id: "EMP-003", name: "Lê Văn C", role: "Bảo vệ", phone: "0923456789", email: "lvc@parkingpro.vn", status: "active" },
  { id: "EMP-004", name: "Phạm Thị D", role: "Thu ngân", phone: "0934567890", email: "ptd@parkingpro.vn", status: "active" },
  { id: "EMP-005", name: "Hoàng Văn E", role: "Bảo vệ", phone: "0945678901", email: "hve@parkingpro.vn", status: "inactive" },
];

const initialCustomers = [
  { id: "CUS-1001", name: "Lê Đức Tài", vehicle: "30A-123.45", phone: "0987654321", email: "taild@gmail.com", status: "active" },
  { id: "CUS-1002", name: "Phạm Thu Thuỷ", vehicle: "29C-987.65", phone: "0911223344", email: "thuypham@gmail.com", status: "active" },
  { id: "CUS-1003", name: "Trần Bảo Ngọc", vehicle: "51F-555.55", phone: "0909090909", email: "ngoctb@gmail.com", status: "inactive" },
];

const roleColors: Record<string, string> = {
  "Quản lý": "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20",
  "Thu ngân": "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  "Bảo vệ": "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

export function UserManagement() {
  const [activeTab, setActiveTab] = useState<"internal" | "external">("internal");
  const [searchQuery, setSearchQuery] = useState("");

  const data = activeTab === "internal" ? initialStaff : initialCustomers;
  const filteredData = data.filter((user: any) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.vehicle && user.vehicle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản Lý Người Dùng</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kiểm soát danh sách nhân sự và khách hàng sử dụng dịch vụ</p>
        </div>
        <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600/90 transition-colors w-full sm:w-auto justify-center shadow-md shadow-red-600/20">
          <Plus className="w-4 h-4" />
          Thêm {activeTab === "internal" ? "Nhân Viên" : "Khách Hàng"}
        </button>
      </div>

      {/* Tabs & Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex bg-gray-100 dark:bg-[#121212] p-1 rounded-xl border border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab("internal")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "internal"
                ? "bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Nhân Sự Nội Bộ
          </button>
          <button
            onClick={() => setActiveTab("external")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "external"
                ? "bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Khách Gửi Xe
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-full px-4 py-1.5 text-sm shadow-sm">
            <span className="font-medium text-gray-900 dark:text-white">{data.length}</span>
            <span className="text-gray-500 dark:text-gray-400">tổng số</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col flex-1 shadow-sm">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#121212]/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Tìm kiếm ${activeTab === "internal" ? "nhân viên" : "khách hàng"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Hiển thị {filteredData.length} kết quả</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#121212]/30 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-6 font-medium border-b border-gray-100 dark:border-gray-800">Người dùng</th>
                {activeTab === "internal" ? (
                  <th className="py-3.5 px-6 font-medium border-b border-gray-100 dark:border-gray-800">Vai trò</th>
                ) : (
                  <th className="py-3.5 px-6 font-medium border-b border-gray-100 dark:border-gray-800">Phương tiện</th>
                )}
                <th className="py-3.5 px-6 font-medium border-b border-gray-100 dark:border-gray-800">Liên hệ</th>
                <th className="py-3.5 px-6 font-medium border-b border-gray-100 dark:border-gray-800">Trạng thái</th>
                <th className="py-3.5 px-6 font-medium border-b border-gray-100 dark:border-gray-800 text-right">Thao tác</th>
              </tr>
            </thead>
            <AnimatePresence mode="popLayout">
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredData.map((user: any, index: number) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    key={user.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group"
                  >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border ${activeTab === 'internal' ? 'bg-gradient-to-br from-red-600/20 to-red-600/10 text-red-600 border-red-600/20' : 'bg-gradient-to-br from-blue-600/20 to-blue-600/10 text-blue-600 border-blue-600/20'}`}>
                        {user.name.split(' ').pop()?.[0]}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">{user.name}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {activeTab === "internal" ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${roleColors[user.role] ?? roleColors["Bảo vệ"]}`}>
                        {user.role}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#121212] text-gray-700 dark:text-gray-300">
                        <Car className="w-3.5 h-3.5 text-gray-500" />
                        {user.vehicle}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1 text-gray-500 dark:text-gray-400 text-xs">
                      <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {user.phone}</div>
                      <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {user.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {user.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full border border-green-500/20">
                        <Check className="w-3.5 h-3.5" /> Kích hoạt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                        <X className="w-3.5 h-3.5" /> Bị khoá
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Chỉnh sửa">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  </motion.tr>
                ))}

                {filteredData.length === 0 && (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                  <td colSpan={5} className="py-16 text-center text-gray-400 dark:text-gray-500">
                    Không tìm thấy dữ liệu phù hợp.
                  </td>
                  </motion.tr>
                )}
              </tbody>
            </AnimatePresence>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
