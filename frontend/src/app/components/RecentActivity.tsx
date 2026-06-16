import { ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

const activities = [
  { id: "TRX-001", plateNumber: "30A-123.45", type: "in", time: "10:24", gate: "Cổng vào 1", fee: null },
  { id: "TRX-002", plateNumber: "51G-888.88", type: "out", time: "10:15", gate: "Cổng ra 2", fee: "50,000 đ" },
  { id: "TRX-003", plateNumber: "29C-456.78", type: "in", time: "09:45", gate: "Cổng vào 2", fee: null },
  { id: "TRX-004", plateNumber: "15B-999.00", type: "out", time: "09:30", gate: "Cổng ra 1", fee: "25,000 đ" },
  { id: "TRX-005", plateNumber: "61A-333.22", type: "in", time: "09:12", gate: "Cổng vào 1", fee: null },
];

export function RecentActivity() {
  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col h-full shadow-sm transition-colors">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Hoạt Động Gần Đây</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Xe vào/ra cập nhật liên tục</p>
        </div>
        <button className="text-xs font-semibold text-blue-600 hover:text-blue-600/80 flex items-center gap-1 transition-colors">
          Xem tất cả <ArrowRightLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
          >
            {/* Icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              activity.type === 'in'
                ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-500'
                : 'bg-orange-50 dark:bg-orange-500/15 text-orange-500'
            }`}>
              {activity.type === 'in'
                ? <ArrowDownToLine className="w-4 h-4" />
                : <ArrowUpFromLine className="w-4 h-4" />
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 dark:text-white font-mono text-sm">{activity.plateNumber}</span>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${
                  activity.type === 'in'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
                    : 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10'
                }`}>
                  {activity.type === 'in' ? 'Vào' : 'Ra'}
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{activity.gate}</p>
            </div>

            {/* Right side */}
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{activity.time}</p>
              {activity.fee ? (
                <p className="text-xs font-semibold text-blue-600 mt-0.5">{activity.fee}</p>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-blue-500">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            {activities.filter(a => a.type === 'in').length} lượt vào
          </span>
          <span className="flex items-center gap-1.5 text-orange-500">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            {activities.filter(a => a.type === 'out').length} lượt ra
          </span>
        </div>
        <span className="text-gray-400 dark:text-gray-500">Hôm nay</span>
      </div>
    </div>
  );
}
