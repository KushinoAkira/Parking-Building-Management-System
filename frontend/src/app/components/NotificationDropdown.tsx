import { useState } from "react";
import { Bell, CheckCircle2, AlertTriangle, Info, Clock, Tag, X, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const sampleNotifications = [
  {
    id: 1,
    type: "in",
    title: "Xe vào bãi",
    desc: "Biển số 30A-123.45 đã vào bãi qua Lối vào 1.",
    time: "10 phút trước",
    unread: true,
    icon: CheckCircle2,
    color: "text-blue-600",
    bg: "bg-blue-600/10"
  },
  {
    id: 2,
    type: "out",
    title: "Xe ra bãi",
    desc: "Biển số 29B-987.65 đã ra bãi và thanh toán 30,000 đ.",
    time: "45 phút trước",
    unread: true,
    icon: CheckCircle2,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    id: 3,
    type: "warning",
    title: "Quá giờ đỗ",
    desc: "Xe 30G-555.55 đỗ quá thời gian đăng ký 2 giờ.",
    time: "2 giờ trước",
    unread: false,
    icon: AlertTriangle,
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  },
  {
    id: 4,
    type: "promo",
    title: "Khuyến mãi cuối tuần",
    desc: "Giảm 20% phí đỗ xe vào Chủ nhật này.",
    time: "Hôm qua",
    unread: false,
    icon: Tag,
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  }
];

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState(sampleNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#1A1A1A]" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0 bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121212]/50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white">Thông báo</h3>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount} mới
              </span>
            )}
          </div>
          <button 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="text-xs font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-600 disabled:opacity-50 disabled:hover:text-gray-500 transition-colors"
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <div 
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`flex items-start gap-3 p-4 border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${
                      notification.unread ? 'bg-blue-600/5 dark:bg-blue-600/5' : ''
                    }`}
                  >
                    <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${notification.bg} ${notification.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold truncate ${
                          notification.unread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </p>
                        {notification.unread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {notification.desc}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {notification.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Không có thông báo nào</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 bg-gray-50 dark:bg-[#121212] border-t border-gray-100 dark:border-gray-800">
          <button className="w-full py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-center">
            Xem tất cả thông báo
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
