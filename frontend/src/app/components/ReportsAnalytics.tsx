import { useEffect, useMemo, useState } from "react";
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, Users, Car } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from "recharts";
import { apiGet } from "../lib/api";
import { getAuth } from "../lib/auth";

const revenueDataFallback = [{ name: "N/A", value: 0 }];

const occupancyDataFallback = [{ name: "N/A", VIP: 0, Standard: 0 }];

const vehicleTypeDataFallback = [{ name: "N/A", value: 100, color: "#9CA3AF" }];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 p-3 rounded-xl shadow-xl">
        <p className="text-gray-700 dark:text-white font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={entry.dataKey || index} className="text-sm" style={{ color: entry.color }}>
            {entry.name === 'value' ? 'Doanh thu' : entry.name}: {
              entry.name === 'value'
                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(entry.value)
                : `${entry.value} slots`
            }
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function ReportsAnalytics() {
  const [revenueData, setRevenueData] = useState<Array<{ name: string; value: number }>>(revenueDataFallback);
  const [occupancyData, setOccupancyData] = useState<Array<{ name: string; VIP: number; Standard: number }>>(occupancyDataFallback);
  const [vehicleTypeData, setVehicleTypeData] = useState<Array<{ name: string; value: number; color: string }>>(vehicleTypeDataFallback);
  const [summary, setSummary] = useState<{ totalRevenue: number; totalSessions: number; busiestType: string }>({
    totalRevenue: 0,
    totalSessions: 0,
    busiestType: "N/A",
  });

  useEffect(() => {
    const auth = getAuth();
    const token = auth?.token;
    Promise.all([
      apiGet<Array<{ date: string; total: number }>>("/api/reports/revenue", token),
      apiGet<Array<{ zoneCode: string; occupied: number; reserved: number }>>("/api/reports/occupancy", token),
      apiGet<Array<{ vehicleTypeCode: string; totalSessions: number; totalRevenue: number }>>("/api/reports/sessions", token),
    ]).then(([revenue, occupancy, sessions]) => {
      setRevenueData(
        revenue.length > 0
          ? revenue.map((r) => ({
              name: new Date(r.date).toLocaleDateString("vi-VN", { weekday: "short" }),
              value: r.total,
            }))
          : revenueDataFallback,
      );

      setOccupancyData(
        occupancy.length > 0
          ? occupancy.map((o) => ({
              name: o.zoneCode,
              VIP: o.reserved,
              Standard: o.occupied,
            }))
          : occupancyDataFallback,
      );

      const totalSessions = sessions.reduce((sum, s) => sum + s.totalSessions, 0);
      const totalRevenue = sessions.reduce((sum, s) => sum + s.totalRevenue, 0);
      const busiest = [...sessions].sort((a, b) => b.totalSessions - a.totalSessions)[0];

      const colors = ["#00C853", "#6366f1", "#EAB308", "#ef4444"];
      setVehicleTypeData(
        sessions.length > 0
          ? sessions.map((s, idx) => ({
              name: s.vehicleTypeCode,
              value: totalSessions > 0 ? Math.round((s.totalSessions / totalSessions) * 100) : 0,
              color: colors[idx % colors.length],
            }))
          : vehicleTypeDataFallback,
      );

      setSummary({
        totalRevenue,
        totalSessions,
        busiestType: busiest?.vehicleTypeCode ?? "N/A",
      });
    }).catch(() => {
      setRevenueData(revenueDataFallback);
      setOccupancyData(occupancyDataFallback);
      setVehicleTypeData(vehicleTypeDataFallback);
    });
  }, []);

  const maxRevenue = useMemo(
    () => Math.max(...revenueData.map((d) => d.value), 1),
    [revenueData],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Báo Cáo & Thống Kê</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Phân tích hiệu suất kinh doanh trong 7 ngày qua</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex items-center justify-center gap-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-1 sm:flex-none">
            <Calendar className="w-4 h-4" />
            Tuần này
          </button>
          <button className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600/90 transition-colors flex-1 sm:flex-none shadow-md shadow-blue-600/20">
            <Download className="w-4 h-4" />
            Xuất Báo Cáo
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-gray-600 dark:text-gray-400 text-sm">Tổng doanh thu tuần</h3>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {summary.totalRevenue.toLocaleString("vi-VN")} đ
            </span>
            <span className="text-sm font-semibold text-blue-700 dark:text-emerald-400 flex items-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4" /> từ dữ liệu thật
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-500">
              <Car className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-gray-600 dark:text-gray-400 text-sm">Lượt đỗ trung bình</h3>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{summary.totalSessions}</span>
            <span className="text-sm font-semibold text-blue-700 dark:text-emerald-400 flex items-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4" /> đã đồng bộ
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Lượt/ngày</p>
        </div>
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-500/15 text-orange-500">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-gray-600 dark:text-gray-400 text-sm">Tỷ lệ trống cao nhất</h3>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{summary.busiestType}</span>
            <span className="text-sm font-semibold text-red-500 flex items-center gap-1 mb-1">
              <TrendingDown className="w-4 h-4" /> Thấp nhất
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Thường trống lúc 10:00 - 14:00</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-5">Biểu Đồ Doanh Thu (7 Ngày)</h3>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportsColorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C853" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00C853" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" vertical={false} />
                <XAxis key="xaxis" dataKey="name" stroke="rgba(150,150,150,0.5)" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis key="yaxis" stroke="rgba(150,150,150,0.5)" axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000000}M`} tick={{ fontSize: 11 }} />
                <Tooltip key="tooltip" content={<CustomTooltip />} />
                <Area key="area" type="monotone" dataKey="value" stroke="#00C853" strokeWidth={2.5} fillOpacity={1} fill="url(#reportsColorRevenue)" dot={{ fill: "#00C853", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-5">Tình Trạng Slot Theo Tầng</h3>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" vertical={false} />
                <XAxis key="xaxis" dataKey="name" stroke="rgba(150,150,150,0.5)" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis key="yaxis" stroke="rgba(150,150,150,0.5)" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip key="tooltip" content={<CustomTooltip />} cursor={{ fill: 'rgba(0,200,83,0.05)' }} />
                <Legend key="legend" wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
                <Bar key="bar-standard" dataKey="Standard" name="Tiêu chuẩn" stackId="a" fill="#00C853" radius={[0, 0, 4, 4]} />
                <Bar key="bar-vip" dataKey="VIP" name="VIP" stackId="a" fill="#EAB308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Cơ Cấu Loại Xe</h3>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {vehicleTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value}%`, 'Tỷ lệ']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-3">
            {vehicleTypeData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-5">Doanh Thu Theo Ngày</h3>
          <div className="space-y-3.5">
            {revenueData.map((day) => {
              const pct = (day.value / maxRevenue) * 100;
              const isMax = day.value === maxRevenue;
              return (
                <div key={day.name} className="flex items-center gap-4">
                  <span className="w-8 text-sm font-semibold text-gray-500 dark:text-gray-400 text-right">{day.name}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: isMax ? '#00C853' : 'rgba(0,200,83,0.35)'
                      }}
                    />
                  </div>
                  <span className={`w-24 text-sm font-bold text-right ${isMax ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}>
                    {new Intl.NumberFormat('vi-VN').format(day.value / 1000)}k đ
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
