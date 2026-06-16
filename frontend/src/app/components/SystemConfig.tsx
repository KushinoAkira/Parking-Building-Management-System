import { useState } from "react";
import { ServerCog, Save, Database, Shield, Zap, RefreshCw, Settings2, Webhook, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function SystemConfig() {
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setSuccess(false);
    setTimeout(() => {
      setIsSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
      }}
      className="space-y-4 max-w-7xl mx-auto h-full overflow-y-auto pb-4"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 bg-gray-50/90 dark:bg-[#121212]/90 backdrop-blur-md py-4 z-20">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cấu Hình Hệ Thống</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Điều chỉnh thông số lõi và tích hợp hệ thống ngoại vi</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <AnimatePresence>
            {success && (
              <motion.span 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-sm font-bold text-green-600 dark:text-green-400"
              >
                Đã lưu thành công!
              </motion.span>
            )}
          </AnimatePresence>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-md shadow-red-600/20 disabled:opacity-70"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Lưu Cấu Hình
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* General Settings */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600">
              <Settings2 className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Thông số vận hành</h2>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Trạng thái hệ thống</label>
              <select className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-red-600 transition-colors">
                <option value="active">Hoạt động bình thường</option>
                <option value="maintenance">Bảo trì (Chỉ Admin mới có thể truy cập)</option>
                <option value="readonly">Chỉ đọc (Không cho phép thay đổi dữ liệu)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Sức chứa tối đa (Slot)</label>
              <input 
                type="number" 
                defaultValue={180}
                className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-red-600 transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Ngưỡng cảnh báo lấp đầy (%)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="50" max="100" 
                  defaultValue={90}
                  className="w-full accent-red-600" 
                />
                <span className="text-sm font-bold w-12 text-right">90%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Preferences */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-500/10 rounded-xl text-purple-600">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Cấu hình AI Optimization</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#121212]">
              <div>
                <div className="font-bold text-sm text-gray-900 dark:text-white">Bật AI Đề xuất Slot</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Tự động chọn chỗ đỗ tối ưu nhất dựa trên thời gian đỗ</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Trọng số Khoảng cách / Thời gian</label>
              <select className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-red-600 transition-colors">
                <option value="balanced">Cân bằng (Đề xuất)</option>
                <option value="distance">Ưu tiên Khoảng cách (Gần cửa nhất)</option>
                <option value="time">Ưu tiên Thời gian (Giảm thiểu tắc nghẽn)</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Integrations */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-green-50 dark:bg-green-500/10 rounded-xl text-green-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Cổng Thanh Toán</h2>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">VNPAY Hash Secret</label>
              <input 
                type="password" 
                defaultValue="********************************"
                className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-red-600 transition-colors font-mono" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Momo Partner Code</label>
              <input 
                type="text" 
                defaultValue="MOMO12345678"
                className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-red-600 transition-colors font-mono" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Webhook URL</label>
              <input 
                type="text" 
                defaultValue="https://api.parkingpro.vn/webhooks/payment"
                className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-red-600 transition-colors font-mono text-sm" 
              />
            </div>
          </div>
        </motion.div>

        {/* Security & Backup */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl text-yellow-600">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Sao Lưu Dữ Liệu</h2>
          </div>
          
          <div className="space-y-3">
             <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#121212]">
              <div>
                <div className="font-bold text-sm text-gray-900 dark:text-white">Sao lưu tự động</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Thực hiện vào lúc 02:00 AM hàng ngày</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Lưu trữ tối đa</label>
              <select className="w-full bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:border-red-600 transition-colors">
                <option value="7">7 ngày gần nhất</option>
                <option value="30">30 ngày gần nhất</option>
                <option value="90">90 ngày gần nhất</option>
              </select>
            </div>

            <button className="w-full py-2.5 mt-2 bg-gray-100 dark:bg-[#121212] border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl transition-colors text-sm">
              Sao Lưu Ngay (Manual Backup)
            </button>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
