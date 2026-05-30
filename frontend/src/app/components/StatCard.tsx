import { ReactNode, useId } from "react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: ReactNode;
  accent?: boolean;
  sparkData?: number[];
  subtitle?: string;
}

export function StatCard({ title, value, trend, trendUp, icon, accent, sparkData, subtitle }: StatCardProps) {
  const uid = useId();
  const gradientId = `spark-grad-${uid.replace(/:/g, '')}`;
  return (
    <div className={`rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md group ${
      accent
        ? 'bg-gradient-to-br from-[#00C853]/10 to-[#00C853]/5 dark:from-[#00C853]/20 dark:to-[#00C853]/5 border-[#00C853]/25 dark:border-[#00C853]/30'
        : 'bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-gray-800'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${
          accent
            ? 'bg-[#00C853]/15 dark:bg-[#00C853]/20 text-[#00C853]'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
        }`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trendUp
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
          }`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>

      <div className="mb-1">
        <p className={`text-3xl font-bold tracking-tight ${accent ? 'text-[#00C853]' : 'text-gray-900 dark:text-white'}`}>
          {value}
        </p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{title}</p>

      {sparkData && sparkData.length > 0 && (
        <div className="h-10 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData.map((v, i) => ({ i, v }))} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accent ? "#00C853" : "#6366f1"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={accent ? "#00C853" : "#6366f1"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                key="spark-area"
                type="monotone"
                dataKey="v"
                stroke={accent ? "#00C853" : "#6366f1"}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
