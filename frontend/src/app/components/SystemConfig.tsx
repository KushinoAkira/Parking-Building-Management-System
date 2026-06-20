import { useCallback, useEffect, useState } from "react";
import { Save, Settings2, Zap, RefreshCw, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { apiGet, apiPut } from "../lib/api";
import { getAuth } from "../lib/auth";

type SystemConfig = {
  configKey: string;
  configValue: string;
  description?: string | null;
};

const CONFIG_FIELDS: {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "toggle";
  options?: { value: string; label: string }[];
  section: "ops" | "ai";
}[] = [
  { key: "SYSTEM_STATUS", label: "Trạng thái hệ thống", type: "select", section: "ops", options: [
    { value: "Active", label: "Hoạt động bình thường" },
    { value: "Maintenance", label: "Bảo trì" },
    { value: "ReadOnly", label: "Chỉ đọc" },
  ]},
  { key: "OCCUPANCY_WARNING_PERCENT", label: "Ngưỡng cảnh báo lấp đầy (%)", type: "number", section: "ops" },
  { key: "GRACE_PERIOD_MINUTES", label: "Thời gian ân hạn (phút)", type: "number", section: "ops" },
  { key: "MAX_ACTIVE_RESERVATIONS", label: "Giới hạn đặt chỗ / tài xế", type: "number", section: "ops" },
  { key: "RESERVATION_HOLD_MINUTES", label: "Giữ chỗ tối đa (phút)", type: "number", section: "ops" },
  { key: "DEFAULT_CURRENCY", label: "Đơn vị tiền tệ", type: "text", section: "ops" },
  { key: "AI_SLOT_SUGGESTION", label: "Bật AI đề xuất slot", type: "toggle", section: "ai" },
  { key: "AI_WEIGHT_MODE", label: "Trọng số AI", type: "select", section: "ai", options: [
    { value: "balanced", label: "Cân bằng" },
    { value: "distance", label: "Ưu tiên khoảng cách" },
    { value: "time", label: "Ưu tiên thời gian" },
  ]},
];

export function SystemConfig() {
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const auth = getAuth();
    setLoading(true);
    setError("");
    try {
      const rows = await apiGet<SystemConfig[]>("/api/system-configs", auth?.token);
      const map: Record<string, string> = {};
      rows.forEach((r) => { map[r.configKey] = r.configValue; });
      CONFIG_FIELDS.forEach((f) => {
        if (map[f.key] === undefined) {
          map[f.key] = f.type === "toggle" ? "false" : f.key === "OCCUPANCY_WARNING_PERCENT" ? "90" : "";
        }
      });
      setConfigs(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được cấu hình");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function setValue(key: string, value: string) {
    setConfigs((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const auth = getAuth();
    setIsSaving(true);
    setSuccess(false);
    setError("");
    try {
      await Promise.all(
        CONFIG_FIELDS.map((f) =>
          apiPut(
            `/api/system-configs/${encodeURIComponent(f.key)}`,
            { configValue: configs[f.key] ?? "", description: f.label },
            auth?.token,
          ),
        ),
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu cấu hình thất bại");
    } finally {
      setIsSaving(false);
    }
  }

  function renderField(field: typeof CONFIG_FIELDS[0]) {
    const value = configs[field.key] ?? "";
    if (field.type === "select") {
      return (
        <select
          value={value}
          onChange={(e) => setValue(field.key, e.target.value)}
          className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-red-600"
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }
    if (field.type === "toggle") {
      return (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={value === "true"}
            onChange={(e) => setValue(field.key, e.target.checked ? "true" : "false")}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600" />
        </label>
      );
    }
    return (
      <input
        type={field.type}
        value={value}
        onChange={(e) => setValue(field.key, e.target.value)}
        className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-red-600"
      />
    );
  }

  const opsFields = CONFIG_FIELDS.filter((f) => f.section === "ops");
  const aiFields = CONFIG_FIELDS.filter((f) => f.section === "ai");

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
      className="space-y-4 max-w-7xl mx-auto h-full overflow-y-auto pb-4"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 bg-gray-50/90 dark:bg-[#121212]/90 backdrop-blur-md py-4 z-20">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cấu Hình Hệ Thống</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Thông số vận hành bãi xe — lưu vào SystemConfigs</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <AnimatePresence>
            {success && (
              <motion.span initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-sm font-bold text-green-600 dark:text-green-400">
                Đã lưu thành công!
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={handleSave}
            disabled={isSaving || loading}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-md shadow-red-600/20 disabled:opacity-70"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu Cấu Hình
          </button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600">
                <Settings2 className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Thông số vận hành</h2>
            </div>
            <div className="space-y-4">
              {opsFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{field.label}</label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-500/10 rounded-xl text-purple-600">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Cấu hình AI & đặt chỗ</h2>
            </div>
            <div className="space-y-4">
              {aiFields.map((field) => (
                <div key={field.key} className={field.type === "toggle" ? "flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#121212]" : ""}>
                  {field.type === "toggle" ? (
                    <>
                      <div>
                        <div className="font-bold text-sm text-gray-900 dark:text-white">{field.label}</div>
                      </div>
                      {renderField(field)}
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{field.label}</label>
                      {renderField(field)}
                    </>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
              Thanh toán: Cash, BankTransfer, EWallet tại checkout — chưa tích hợp cổng bên thứ ba.
            </p>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
