import { Car, CheckCircle2, DollarSign, TrendingUp } from "lucide-react";
import { StatCard } from "./StatCard";
import { ParkingMap } from "./ParkingMap";
import { RecentActivity } from "./RecentActivity";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from "recharts";
import { motion, Variants } from "motion/react";

const hourlyData = [
  { hour: "06h", count: 12 },
  { hour: "08h", count: 38 },
  { hour: "09h", count: 55 },
  { hour: "10h", count: 72 },
  { hour: "11h", count: 68 },
  { hour: "12h", count: 45 },
  { hour: "13h", count: 40 },
  { hour: "14h", count: 62 },
  { hour: "15h", count: 70 },
  { hour: "16h", count: 80 },
  { hour: "17h", count: 95 },
  { hour: "18h", count: 88 },
  { hour: "19h", count: 60 },
  { hour: "20h", count: 42 },
];

const slotSpark = [30, 35, 42, 38, 48, 50, 44, 48];
const revenueSpark = [3200, 3800, 4100, 3900, 4500, 5000, 4800, 4500];
const totalSpark = [110, 112, 115, 118, 120, 120, 120, 120];
const rateSpark = [28, 30, 35, 32, 40, 42, 37, 40];
const maxCount = Math.max(...hourlyData.map(d => d.count));

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-lg shadow-xl text-sm">
        <p className="text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-bold text-blue-600">{payload[0].value} lượt</p>
      </div>
    );
  }
  return null;
};

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

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tổng Quan</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Thống kê hôm nay — Thứ Sáu, 29/05/2026</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-3 py-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-xs font-semibold text-blue-600">Cập nhật tự động</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          title="Tổng Slot"
          value="120"
          icon={<Car className="w-5 h-5" />}
          sparkData={totalSpark}
          subtitle="Tổng sức chứa"
        />
        <StatCard
          title="Đang Sử Dụng"
          value="48"
          trend="12%"
          trendUp={true}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent={true}
          sparkData={slotSpark}
          subtitle="So với hôm qua"
        />
        <StatCard
          title="Doanh Thu Hôm Nay"
          value="4.5M đ"
          trend="5%"
          trendUp={true}
          icon={<DollarSign className="w-5 h-5" />}
          sparkData={revenueSpark}
          subtitle="+225k so với hôm qua"
        />
        <StatCard
          title="Tỷ Lệ Lấp Đầy"
          value="40%"
          trend="2%"
          trendUp={false}
          icon={<TrendingUp className="w-5 h-5" />}
          sparkData={rateSpark}
          subtitle="Mục tiêu: 75%"
        />
      </motion.div>

      {/* Hourly Activity Bar Chart */}
      <motion.div 
        variants={fadeUpVariants}
        initial="hidden"
        animate="show"
        className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Lưu Lượng Theo Giờ</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Số lượt xe vào/ra hôm nay</p>
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">Hôm nay</span>
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

      {/* Parking Map + Recent Activity */}
      <motion.div 
        variants={fadeUpVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        <div className="xl:col-span-2 min-h-[420px]">
          <ParkingMap />
        </div>
        <div className="xl:col-span-1 min-h-[420px]">
          <RecentActivity />
        </div>
      </motion.div>
    </div>
  );
}
