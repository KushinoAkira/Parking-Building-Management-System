import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Mail, Phone, Check, X, Users } from "lucide-react";

const initialStaff = [
  { id: "EMP-001", name: "Nguyễn Văn A", role: "Quản lý", shift: "Ca Hành Chính", phone: "0901234567", email: "nva@parkingpro.vn", status: "active" },
  { id: "EMP-002", name: "Trần Thị B", role: "Bảo vệ", shift: "Ca Sáng (06-14h)", phone: "0912345678", email: "ttb@parkingpro.vn", status: "active" },
  { id: "EMP-003", name: "Lê Văn C", role: "Bảo vệ", shift: "Ca Chiều (14-22h)", phone: "0923456789", email: "lvc@parkingpro.vn", status: "active" },
  { id: "EMP-004", name: "Phạm Thị D", role: "Thu ngân", shift: "Ca Sáng (06-14h)", phone: "0934567890", email: "ptd@parkingpro.vn", status: "active" },
  { id: "EMP-005", name: "Hoàng Văn E", role: "Bảo vệ", shift: "Ca Đêm (22-06h)", phone: "0945678901", email: "hve@parkingpro.vn", status: "inactive" },
];

const roleColors: Record<string, string> = {
  "Quản lý": "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20",
  "Thu ngân": "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  "Bảo vệ": "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

export function StaffManagement() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStaff = initialStaff.filter(staff =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản Lý Nhân Viên</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Quản lý danh sách nhân sự, phân ca và quyền truy cập</p>
        </div>
        <button className="flex items-center gap-2 bg-[#00C853] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#00C853]/90 transition-colors w-full sm:w-auto justify-center shadow-md shadow-[#00C853]/20">
          <Plus className="w-4 h-4" />
          Thêm Nhân Viên
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-full px-4 py-2 text-sm shadow-sm">
          <Users className="w-4 h-4 text-[#00C853]" />
          <span className="font-medium text-gray-900 dark:text-white">{initialStaff.length}</span>
          <span className="text-gray-500 dark:text-gray-400">nhân viên</span>
        </div>
        <div className="flex items-center gap-2 bg-[#00C853]/5 dark:bg-[#00C853]/10 border border-[#00C853]/20 rounded-full px-4 py-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-[#00C853]" />
          <span className="font-medium text-[#00C853]">{initialStaff.filter(s => s.status === 'active').length} đang làm việc</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="font-medium text-gray-600 dark:text-gray-400">{initialStaff.filter(s => s.status === 'inactive').length} đã nghỉ</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col flex-1 shadow-sm">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#121212]/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mã nhân viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#00C853] transition-colors"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Hiển thị {filteredStaff.length} nhân viên</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#121212]/30 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-6 font-medium border-b border-gray-100 dark:border-gray-800">Nhân viên</th>
                <th className="py-3.5 px-6 font-medium border-b border-gray-100 dark:border-gray-800">Vai trò</th>
                <th className="py-3.5 px-6 font-medium border-b border-gray-100 dark:border-gray-800">Ca làm việc</th>
                <th className="py-3.5 px-6 font-medium border-b border-gray-100 dark:border-gray-800">Liên hệ</th>
                <th className="py-3.5 px-6 font-medium border-b border-gray-100 dark:border-gray-800">Trạng thái</th>
                <th className="py-3.5 px-6 font-medium border-b border-gray-100 dark:border-gray-800 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00C853]/20 to-[#00C853]/10 flex items-center justify-center text-[#00C853] font-bold border border-[#00C853]/20">
                        {staff.name.split(' ').pop()?.[0]}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">{staff.name}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{staff.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${roleColors[staff.role] ?? roleColors["Bảo vệ"]}`}>
                      {staff.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-700 dark:text-gray-300">
                    {staff.shift}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1 text-gray-500 dark:text-gray-400 text-xs">
                      <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {staff.phone}</div>
                      <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {staff.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {staff.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#00C853]/10 text-[#00C853] px-2.5 py-1 rounded-full border border-[#00C853]/20">
                        <Check className="w-3.5 h-3.5" /> Đang làm việc
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                        <X className="w-3.5 h-3.5" /> Đã nghỉ
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
                </tr>
              ))}

              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400 dark:text-gray-500">
                    Không tìm thấy nhân viên nào phù hợp với tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#121212]/30">
          <div>Trang 1 / 1</div>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">Trước</button>
            <button className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
}
