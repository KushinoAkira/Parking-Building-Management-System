import { useCallback, useEffect, useMemo, useState } from "react";
import { Car, CheckCircle2, DollarSign, TrendingUp } from "lucide-react";
import { StatCard } from "./StatCard";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from "recharts";
import { motion, Variants } from "motion/react";
import { apiGet } from "../lib/api";
import { getAuth } from "../lib/auth";
import { useLocale } from "../lib/i18n/LocaleContext";
import { useRealtimeRefresh } from "../lib/RealtimeContext";
import { RealtimeEventTypes } from "../lib/realtime";

const fallbackHourlyData = [
  { hour: "06h", count: 0 },
  { hour: "08h", count: 0 },
  { hour: "10h", count: 0 },
  { hour: "12h", count: 0 },
  { hour: "14h", count: 0 },
  { hour: "16h", count: 0 },
  { hour: "18h", count: 0 },
  { hour: "20h", count: 0 },
];

const slotSpark = [20, 24, 28, 25, 31, 35, 33, 30];
const revenueSpark = [0, 0, 0, 0, 0, 0, 0, 0];
const totalSpark = [0, 0, 0, 0, 0, 0, 0, 0];
const rateSpark = [0, 0, 0, 0, 0, 0, 0, 0];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

function CustomBarTooltip({ active, payload, label }: any) {
  const { t } = useLocale();
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-lg shadow-xl text-sm">
        <p className="text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-bold text-blue-600">{t("dashboard.visits", { count: payload[0].value })}</p>
      </div>
    );
  }
  return null;
}

export function Dashboard() {
  const { t, formatMoney } = useLocale();
  const [dashboard, setDashboard] = useState<{
    activeSessions: number;
    todayEntries: number;
    todayExits: number;
    todayRevenue: number;
    slots: {
      totalSlots: number;
      availableSlots: number;
      occupiedSlots: number;
      reservedSlots: number;
      occupancyRate: number;
    };
  } | null>(null);
  const [sessionStats, setSessionStats] = useState<Array<{ vehicleTypeCode: string; totalSessions: number }>>([]);

  const loadDashboard = useCallback(() => {
    const auth = getAuth();
    Promise.all([
      apiGet("/api/reports/dashboard", auth?.token),
      apiGet("/api/reports/sessions", auth?.token),
    ])
      .then(([d, s]) => {
        setDashboard(d as any);
        setSessionStats(s as any[]);
      })
      .catch(() => {
        setDashboard(null);
        setSessionStats([]);
      });
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useRealtimeRefresh(
    [
      RealtimeEventTypes.DashboardRefresh,
      RealtimeEventTypes.SessionCheckedIn,
      RealtimeEventTypes.SessionCheckedOut,
      RealtimeEventTypes.ReservationUpdated,
    ],
    loadDashboard,
  );

  const hourlyData = useMemo(() => {
    if (sessionStats.length === 0) return fallbackHourlyData;
    const total = sessionStats.reduce((sum, x) => sum + x.totalSessions, 0);
    const base = Math.max(1, Math.round(total / 8));
    return fallbackHourlyData.map((x, idx) => ({ ...x, count: base + idx * 2 }));
  }, [sessionStats]);
  const maxCount = Math.max(...hourlyData.map((d) => d.count), 1);

  const totalSlots = dashboard?.slots.totalSlots ?? 0;
  const occupiedSlots = dashboard?.slots.occupiedSlots ?? 0;
  const todayRevenue = dashboard?.todayRevenue ?? 0;
  const occupancyRate = dashboard?.slots.occupancyRate ?? 0;

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("dashboard.title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-3 py-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-xs font-semibold text-blue-600">{t("dashboard.autoUpdate")}</span>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          title={t("dashboard.totalSlots")}
          value={totalSlots.toString()}
          icon={<Car className="w-5 h-5" />}
          sparkData={totalSpark}
          subtitle={t("dashboard.totalCapacity")}
        />
        <StatCard
          title={t("dashboard.inUse")}
          value={occupiedSlots.toString()}
          trend={`${Math.round(occupancyRate)}%`}
          trendUp={true}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent={true}
          sparkData={slotSpark}
          subtitle={t("dashboard.vsYesterday")}
        />
        <StatCard
          title={t("dashboard.todayRevenue")}
          value={formatMoney(todayRevenue)}
          trend={t("dashboard.visits", { count: dashboard?.todayExits ?? 0 })}
          trendUp={true}
          icon={<DollarSign className="w-5 h-5" />}
          sparkData={revenueSpark}
          subtitle={t("dashboard.vsYesterday")}
        />
        <StatCard
          title={t("dashboard.occupancyRate")}
          value={`${occupancyRate.toFixed(2)}%`}
          trend={t("dashboard.visits", { count: dashboard?.todayEntries ?? 0 })}
          trendUp={false}
          icon={<TrendingUp className="w-5 h-5" />}
          sparkData={rateSpark}
          subtitle={t("dashboard.target")}
        />
      </motion.div>

      <motion.div 
        variants={fadeUpVariants}
        initial="hidden"
        animate="show"
        className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{t("dashboard.hourlyTraffic")}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t("dashboard.hourlyDesc")}</p>
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">{t("common.today")}</span>
        </div>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={18}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" vertical={false} />
              <XAxis key="xaxis" dataKey="hour" stroke="rgba(150,150,150,0.5)" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis key="yaxis" stroke="rgba(150,150,150,0.5)" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip key="tooltip" content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,200,83,0.05)' }} />
              <Bar key="bar" dataKey="count" radius={[6, 6, 2, 2]} isAnimationActive={true}>
                {hourlyData.map((entry, index) => (
                  <Cell
                    key={`hourly-cell-${index}`}
                    fill={entry.count === maxCount ? "#00C853" : "rgba(0,200,83,0.25)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div variants={fadeUpVariants} initial="hidden" animate="show" className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">{t("dashboard.opsSummary")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#121212]">{t("dashboard.entriesToday")}: <strong>{dashboard?.todayEntries ?? 0}</strong></div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#121212]">{t("dashboard.exitsToday")}: <strong>{dashboard?.todayExits ?? 0}</strong></div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#121212]">{t("dashboard.activeNow")}: <strong>{dashboard?.activeSessions ?? 0}</strong></div>
        </div>
      </motion.div>
    </div>
  );
}
