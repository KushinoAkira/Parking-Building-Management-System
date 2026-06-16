import { useState } from "react";
import { ShieldCheck, Plus, Check, Save, UserCog, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const PERMISSIONS = [
  { id: "view_dashboard", name: "Xem Tổng Quan", category: "Dashboard" },
  { id: "manage_slots", name: "Quản Lý Slot Xe", category: "Operations" },
  { id: "manage_pricing", name: "Cấu Hình Bảng Giá", category: "Operations" },
  { id: "view_reports", name: "Xem Báo Cáo Doanh Thu", category: "Reports" },
  { id: "handle_violations", name: "Xử Lý Vi Phạm", category: "Operations" },
  { id: "manual_entry", name: "Nhập Lượt Xe Thủ Công", category: "Staff Operations" },
  { id: "manage_users", name: "Quản Lý Người Dùng", category: "System Administration" },
  { id: "manage_roles", name: "Phân Quyền Hệ Thống", category: "System Administration" },
  { id: "system_config", name: "Cấu Hình Hệ Thống", category: "System Administration" },
];

const INITIAL_ROLES = [
  { 
    id: "admin", 
    name: "System Admin", 
    description: "Toàn quyền quản trị hệ thống.",
    permissions: PERMISSIONS.map(p => p.id),
    isSystem: true
  },
  { 
    id: "manager", 
    name: "Manager", 
    description: "Quản lý vận hành bãi đỗ xe và báo cáo.",
    permissions: ["view_dashboard", "manage_slots", "manage_pricing", "view_reports", "handle_violations"],
    isSystem: false
  },
  { 
    id: "staff", 
    name: "Staff", 
    description: "Nhân viên bảo vệ, thu ngân tại bãi.",
    permissions: ["manual_entry", "handle_violations"],
    isSystem: false
  },
];

export function RoleManagement() {
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [activeRole, setActiveRole] = useState(INITIAL_ROLES[0]);
  const [hasChanges, setHasChanges] = useState(false);
  
  const handleTogglePermission = (permId: string) => {
    if (activeRole.isSystem) return; // Cannot edit system admin
    
    setHasChanges(true);
    const hasPerm = activeRole.permissions.includes(permId);
    
    setActiveRole(prev => ({
      ...prev,
      permissions: hasPerm 
        ? prev.permissions.filter(id => id !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const handleSave = () => {
    setRoles(prev => prev.map(r => r.id === activeRole.id ? activeRole : r));
    setHasChanges(false);
  };

  // Group permissions by category
  const categories = Array.from(new Set(PERMISSIONS.map(p => p.category)));

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Phân Quyền Hệ Thống</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Cấu hình vai trò và quyền hạn cho người dùng</p>
        </div>
        <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600/90 transition-colors w-full sm:w-auto justify-center shadow-md shadow-red-600/20">
          <Plus className="w-4 h-4" />
          Tạo Vai Trò Mới
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden min-h-0">
        {/* Roles List */}
        <div className="w-full lg:w-80 flex flex-col bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex-shrink-0">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121212]/50">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserCog className="w-4 h-4 text-red-600" />
              Danh Sách Vai Trò
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <AnimatePresence>
              {roles.map((role, i) => (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                key={role.id}
                onClick={() => {
                  if (hasChanges) {
                    if (window.confirm("Bạn có thay đổi chưa lưu. Bạn có chắc muốn chuyển?")) {
                      setActiveRole(role);
                      setHasChanges(false);
                    }
                  } else {
                    setActiveRole(role);
                  }
                }}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                  activeRole.id === role.id
                    ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 border"
                    : "border-transparent border hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <div className="font-bold text-gray-900 dark:text-white flex items-center justify-between">
                  {role.name}
                  {role.isSystem && (
                    <span title="Vai trò hệ thống mặc định">
                      <ShieldCheck className="w-4 h-4 text-red-500" />
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {role.description}
                </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Permissions Editor */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm min-w-0">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-[#121212]/50">
            <div>
              <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                Chi tiết quyền hạn: {activeRole.name}
              </h2>
              {activeRole.isSystem && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-red-500 mt-2 bg-red-50 dark:bg-red-500/10 w-fit px-2 py-1 rounded-md border border-red-100 dark:border-red-500/20">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Vai trò hệ thống không thể chỉnh sửa
                </div>
              )}
            </div>
            
            <AnimatePresence>
              {hasChanges && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-md shadow-red-600/20"
                >
                  <Save className="w-4 h-4" />
                  Lưu Thay Đổi
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="space-y-8">
              {categories.map((cat) => (
                <div key={cat}>
                  <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                    {cat}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {PERMISSIONS.filter(p => p.category === cat).map((perm) => {
                      const isGranted = activeRole.permissions.includes(perm.id);
                      return (
                        <motion.div
                          whileHover={{ scale: activeRole.isSystem ? 1 : 1.02 }}
                          whileTap={{ scale: activeRole.isSystem ? 1 : 0.98 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={perm.id}
                          onClick={() => handleTogglePermission(perm.id)}
                          className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${
                            activeRole.isSystem ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:border-red-300 dark:hover:border-red-500/40'
                          } ${
                            isGranted
                              ? 'border-red-600 bg-red-50/50 dark:bg-red-500/10'
                              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A]'
                          }`}
                        >
                          <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                            isGranted 
                              ? 'bg-red-600 border-red-600 text-white' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isGranted && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className={`text-sm font-bold ${isGranted ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                              {perm.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 font-mono">
                              {perm.id}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
