import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, AlertTriangle, Info, Clock, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useLocale } from "../lib/i18n/LocaleContext";
import { useRealtime } from "../lib/RealtimeContext";
import { RealtimeEventTypes, type RealtimeEvent } from "../lib/realtime";

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  icon: typeof CheckCircle2;
  color: string;
  bg: string;
};

function mapEventToNotification(evt: RealtimeEvent, t: (k: string) => string, formatMoney: (n: number) => string): NotificationItem | null {
  const data = evt.data as Record<string, unknown> | undefined;
  const plate = (data?.licensePlate as string) ?? evt.message ?? "";

  switch (evt.type) {
    case RealtimeEventTypes.SessionCheckedIn:
      return {
        id: Date.now(),
        type: "in",
        title: t("notifications.vehicleIn"),
        desc: plate,
        time: t("common.today"),
        unread: true,
        icon: CheckCircle2,
        color: "text-blue-600",
        bg: "bg-blue-600/10",
      };
    case RealtimeEventTypes.SessionCheckedOut: {
      const fee = data?.totalFee as number | undefined;
      return {
        id: Date.now(),
        type: "out",
        title: t("notifications.vehicleOut"),
        desc: fee != null ? `${plate} — ${formatMoney(fee)}` : plate,
        time: t("common.today"),
        unread: true,
        icon: CheckCircle2,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
      };
    }
    case RealtimeEventTypes.IncidentUpdated:
      return {
        id: Date.now(),
        type: "warning",
        title: t("notifications.overtime"),
        desc: (data?.incidentType as string) ?? evt.message ?? "",
        time: t("common.today"),
        unread: true,
        icon: AlertTriangle,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
      };
    case RealtimeEventTypes.ReservationUpdated:
      return {
        id: Date.now(),
        type: "info",
        title: t("driver.reservations"),
        desc: plate,
        time: t("common.today"),
        unread: true,
        icon: Info,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
      };
    default:
      return null;
  }
}

export function NotificationDropdown() {
  const { t, formatMoney } = useLocale();
  const { subscribe } = useRealtime();

  const seedNotifications = useMemo<NotificationItem[]>(() => [], []);

  const [notifications, setNotifications] = useState<NotificationItem[]>(seedNotifications);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    return subscribe((evt) => {
      const item = mapEventToNotification(evt, t, formatMoney);
      if (!item) return;
      setNotifications((prev) => [item, ...prev].slice(0, 20));
    });
  }, [subscribe, t, formatMoney]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)));
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121212]/50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t("notifications.title")}</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                {t("notifications.newCount", { count: unreadCount })}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              <Check className="w-3 h-3" />
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">{t("notifications.empty")}</div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left border-b border-gray-50 dark:border-gray-800/50 last:border-0 ${n.unread ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}
              >
                <div className={`p-2 rounded-xl ${n.bg} shrink-0`}>
                  <n.icon className={`w-4 h-4 ${n.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-semibold truncate ${n.unread ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                      {n.title}
                    </p>
                    {n.unread && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{n.desc}</p>
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {n.time}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121212]/50">
          <button className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-1">
            {t("notifications.viewAll")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
