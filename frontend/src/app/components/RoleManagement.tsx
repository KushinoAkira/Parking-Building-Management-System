import { useEffect, useState } from "react";
import { ShieldCheck, Check, UserCog, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { apiGet } from "../lib/api";
import { getAuth } from "../lib/auth";

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

const ROLE_META: Record<string, { description: string; permissions: string[]; isSystem: boolean }> = {
  Admin: {
    description: "Toàn quyền quản trị hệ thống.",
    permissions: PERMISSIONS.map((p) => p.id),
    isSystem: true,
  },
  Manager: {
    description: "Quản lý vận hành bãi đỗ xe và báo cáo.",
    permissions: ["view_dashboard", "manage_slots", "manage_pricing", "view_reports", "handle_violations"],
    isSystem: false,
  },
  Staff: {
    description: "Nhân viên bảo vệ, thu ngân tại bãi.",
    permissions: ["manual_entry", "handle_violations"],
    isSystem: false,
  },
  Driver: {
    description: "Khách hàng sử dụng dịch vụ gửi xe.",
    permissions: [],
    isSystem: false,
  },
};

type ApiRole = { roleId: number; roleName: string };

export function RoleManagement() {
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [activeRole, setActiveRole] = useState<ApiRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const auth = getAuth();
    apiGet<ApiRole[]>("/api/roles", auth?.token)
      .then((data) => {
        setRoles(data);
        setActiveRole(data[0] ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Không tải được vai trò"))
      .finally(() => setLoading(false));
  }, []);

  const meta = activeRole ? ROLE_META[activeRole.roleName] : null;
  const categories = Array.from(new Set(PERMISSIONS.map((p) => p.category)));

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Phân Quyền Hệ Thống</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Vai trò từ database — ma trận quyền theo thiết kế PBMS (read-only)</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 text-sm border border-red-200 dark:border-red-500/20">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden min-h-0">
          <div className="w-full lg:w-80 flex flex-col bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex-shrink-0">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121212]/50">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserCog className="w-4 h-4 text-red-600" />
                Danh Sách Vai Trò
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {roles.map((role, i) => {
                const rm = ROLE_META[role.roleName];
                return (
                  <motion.button
                    key={role.roleId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setActiveRole(role)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                      activeRole?.roleId === role.roleId
                        ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 border"
                        : "border-transparent border hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="font-bold text-gray-900 dark:text-white flex items-center justify-between">
                      {role.roleName}
                      {rm?.isSystem && <ShieldCheck className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {rm?.description ?? "Vai trò hệ thống"}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm min-w-0">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121212]/50">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                Chi tiết quyền hạn: {activeRole?.roleName}
              </h2>
              {meta?.isSystem && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-red-500 mt-2 bg-red-50 dark:bg-red-500/10 w-fit px-2 py-1 rounded-md border border-red-100 dark:border-red-500/20">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Vai trò hệ thống — quyền cố định theo thiết kế
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-8">
                {categories.map((cat) => (
                  <div key={cat}>
                    <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{cat}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {PERMISSIONS.filter((p) => p.category === cat).map((perm) => {
                        const isGranted = meta?.permissions.includes(perm.id) ?? false;
                        return (
                          <div
                            key={perm.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border-2 ${
                              isGranted
                                ? "border-red-600 bg-red-50/50 dark:bg-red-500/10"
                                : "border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A] opacity-60"
                            }`}
                          >
                            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                              isGranted ? "bg-red-600 border-red-600 text-white" : "border-gray-300 dark:border-gray-600"
                            }`}>
                              {isGranted && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                              <div className={`text-sm font-bold ${isGranted ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                                {perm.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5 font-mono">{perm.id}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
