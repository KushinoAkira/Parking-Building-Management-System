import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Edit2, Mail, Phone, Check, X, Users, ShieldAlert, Loader2, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { apiGet, apiPost, apiPut } from "../lib/api";
import { getAuth } from "../lib/auth";

type UserRow = {
  userId: number;
  fullName: string;
  email: string;
  phone: string | null;
  roleId: number;
  roleName: string;
  status: string;
  createdAt: string;
};

type Role = { roleId: number; roleName: string };

const roleColors: Record<string, string> = {
  Admin: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20",
  Manager: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  Staff: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  Driver: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20",
};

const INTERNAL_ROLES = new Set(["Admin", "Manager", "Staff"]);

export function UserManagement() {
  const [activeTab, setActiveTab] = useState<"internal" | "external">("internal");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    roleId: 4,
    status: "Active",
  });

  const load = useCallback(async () => {
    const auth = getAuth();
    setLoading(true);
    setError("");
    try {
      const [u, r] = await Promise.all([
        apiGet<UserRow[]>("/api/users", auth?.token),
        apiGet<Role[]>("/api/roles", auth?.token),
      ]);
      setUsers(u);
      setRoles(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được người dùng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const data = useMemo(() => {
    return users.filter((u) =>
      activeTab === "internal" ? INTERNAL_ROLES.has(u.roleName) : u.roleName === "Driver",
    );
  }, [users, activeTab]);

  const filteredData = data.filter((user) =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(user.userId).includes(searchQuery),
  );

  function openCreate() {
    setEditing(null);
    setForm({
      fullName: "",
      email: "",
      password: "",
      phone: "",
      roleId: activeTab === "internal" ? (roles.find((r) => r.roleName === "Staff")?.roleId ?? 3) : 4,
      status: "Active",
    });
    setModalOpen(true);
  }

  function openEdit(user: UserRow) {
    setEditing(user);
    setForm({
      fullName: user.fullName,
      email: user.email,
      password: "",
      phone: user.phone ?? "",
      roleId: user.roleId,
      status: user.status,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    const auth = getAuth();
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await apiPut(
          `/api/users/${editing.userId}`,
          {
            fullName: form.fullName,
            phone: form.phone || null,
            roleId: form.roleId,
            status: form.status,
          },
          auth?.token,
        );
      } else {
        await apiPost(
          "/api/users",
          {
            fullName: form.fullName,
            email: form.email,
            password: form.password,
            phone: form.phone || null,
            roleId: form.roleId,
            status: form.status,
          },
          auth?.token,
        );
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu người dùng thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user: UserRow) {
    const auth = getAuth();
    const newStatus = user.status === "Active" ? "Inactive" : "Active";
    try {
      await apiPut(
        `/api/users/${user.userId}`,
        { fullName: user.fullName, phone: user.phone, roleId: user.roleId, status: newStatus },
        auth?.token,
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cập nhật trạng thái thất bại");
    }
  }

  async function handleResetPassword() {
    const auth = getAuth();
    if (!resetUser || resetPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiPost(
        `/api/users/${resetUser.userId}/reset-password`,
        { newPassword: resetPassword },
        auth?.token,
      );
      setResetUser(null);
      setResetPassword("");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đặt lại mật khẩu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản Lý Người Dùng</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kiểm soát danh sách nhân sự và khách hàng sử dụng dịch vụ</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600/90 transition-colors w-full sm:w-auto justify-center shadow-md shadow-red-600/20"
        >
          <Plus className="w-4 h-4" />
          Thêm {activeTab === "internal" ? "Nhân Viên" : "Khách Hàng"}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 text-sm border border-red-200 dark:border-red-500/20">
          {error}
        </div>
      )}

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
        <div className="flex items-center gap-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-full px-4 py-1.5 text-sm shadow-sm">
          <span className="font-medium text-gray-900 dark:text-white">{data.length}</span>
          <span className="text-gray-500 dark:text-gray-400">tổng số</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col flex-1 shadow-sm">
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
          <span className="hidden sm:block text-sm text-gray-500">Hiển thị {filteredData.length} kết quả</span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#121212]/30 sticky top-0 z-10">
                <tr>
                  <th className="py-3.5 px-6 font-medium border-b border-gray-100 dark:border-gray-800">Người dùng</th>
                  <th className="py-3.5 px-6 font-medium border-b border-gray-100 dark:border-gray-800">Vai trò</th>
                  <th className="py-3.5 px-6 font-medium border-b border-gray-100 dark:border-gray-800">Liên hệ</th>
                  <th className="py-3.5 px-6 font-medium border-b border-gray-100 dark:border-gray-800">Trạng thái</th>
                  <th className="py-3.5 px-6 font-medium border-b border-gray-100 dark:border-gray-800 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredData.map((user, index) => (
                  <motion.tr
                    key={user.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border ${
                          activeTab === "internal"
                            ? "bg-gradient-to-br from-red-600/20 to-red-600/10 text-red-600 border-red-600/20"
                            : "bg-gradient-to-br from-blue-600/20 to-blue-600/10 text-blue-600 border-blue-600/20"
                        }`}>
                          {user.fullName.split(" ").pop()?.[0]}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{user.fullName}</div>
                          <div className="text-xs text-gray-400">ID {user.userId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${roleColors[user.roleName] ?? roleColors.Staff}`}>
                        {user.roleName}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 text-gray-500 dark:text-gray-400 text-xs">
                        <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {user.phone ?? "—"}</div>
                        <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {user.email}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {user.status === "Active" ? (
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
                        <button onClick={() => openEdit(user)} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Chỉnh sửa">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setResetUser(user); setResetPassword(""); }} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg" title="Đặt lại mật khẩu">
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleStatus(user)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg" title="Đổi trạng thái">
                          {user.status === "Active" ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-gray-400">Không tìm thấy dữ liệu phù hợp.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">Đặt lại mật khẩu</h3>
            <p className="text-sm text-gray-500 mb-4">{resetUser.fullName} ({resetUser.email})</p>
            <input
              type="password"
              placeholder="Mật khẩu mới (≥ 8 ký tự)"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700 dark:text-white mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setResetUser(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold dark:border-gray-700 dark:text-gray-300">
                Hủy
              </button>
              <button
                onClick={handleResetPassword}
                disabled={saving || resetPassword.length < 8}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
              {editing ? "Chỉnh sửa người dùng" : "Thêm người dùng"}
            </h3>
            <div className="space-y-3">
              <input
                placeholder="Họ tên"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700 dark:text-white"
              />
              {!editing && (
                <input
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700 dark:text-white"
                />
              )}
              {!editing && (
                <input
                  placeholder="Mật khẩu"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700 dark:text-white"
                />
              )}
              <input
                placeholder="Số điện thoại"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700 dark:text-white"
              />
              <select
                value={form.roleId}
                onChange={(e) => setForm({ ...form, roleId: Number(e.target.value) })}
                className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700 dark:text-white"
              >
                {roles
                  .filter((r) => (activeTab === "internal" ? INTERNAL_ROLES.has(r.roleName) : r.roleName === "Driver"))
                  .map((r) => (
                    <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                  ))}
              </select>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-[#121212] dark:border-gray-700 dark:text-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold dark:border-gray-700 dark:text-gray-300">
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.fullName || (!editing && (!form.email || form.password.length < 8))}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-60 flex justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
