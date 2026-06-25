import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Car,
  Users,
  Download,
} from "lucide-react";

interface StatisticData {
  totalBookings: number;
  totalRevenue: number;
  completedBookings: number;
  cancelledBookings: number;
  averagePerDay: number;
  growthRate: number;
}

interface DailyStats {
  date: string;
  bookings: number;
  revenue: number;
}

const ManagerStatistics = () => {
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const [stats, setStats] = useState<StatisticData>({
    totalBookings: 0,
    totalRevenue: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    averagePerDay: 0,
    growthRate: 0,
  });
  void setStats;
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  void setDailyStats;

  useEffect(() => {
    fetchStatistics();
  }, [period]);

  const fetchStatistics = async () => {
    // TODO: API call will be implemented here
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const maxBookings = Math.max(...dailyStats.map((d) => d.bookings));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Thống kê Chi nhánh
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi hiệu suất và doanh thu của chi nhánh
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setPeriod("week")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              period === "week"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Tuần
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              period === "month"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Tháng
          </button>
          <button
            onClick={() => setPeriod("year")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              period === "year"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Năm
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Tổng lịch hẹn</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">
                {stats.totalBookings}
              </p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3">
              <Calendar size={24} className="text-blue-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-sm">
            {stats.growthRate > 0 ? (
              <TrendingUp size={16} className="text-emerald-600" />
            ) : (
              <TrendingDown size={16} className="text-red-600" />
            )}
            <span
              className={
                stats.growthRate > 0 ? "text-emerald-600" : "text-red-600"
              }
            >
              {Math.abs(stats.growthRate)}%
            </span>
            <span className="text-slate-500">so với kỳ trước</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Doanh thu</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="rounded-lg bg-emerald-100 p-3">
              <TrendingUp size={24} className="text-emerald-600" />
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Trung bình {formatCurrency(stats.averagePerDay)}/ngày
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Đã hoàn thành</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">
                {stats.completedBookings}
              </p>
            </div>
            <div className="rounded-lg bg-purple-100 p-3">
              <Car size={24} className="text-purple-600" />
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            {Math.round((stats.completedBookings / stats.totalBookings) * 100)}%
            tổng lịch hẹn
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Đã hủy</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">
                {stats.cancelledBookings}
              </p>
            </div>
            <div className="rounded-lg bg-red-100 p-3">
              <Users size={24} className="text-red-600" />
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            {Math.round((stats.cancelledBookings / stats.totalBookings) * 100)}%
            tổng lịch hẹn
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Biểu đồ Lịch hẹn
          </h2>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
            <Download size={16} />
            Xuất file
          </button>
        </div>

        {/* Simple Bar Chart */}
        <div className="h-64">
          <div className="flex h-full items-end justify-between gap-2">
            {dailyStats.map((stat, index) => (
              <div key={index} className="flex flex-1 flex-col items-center">
                <div className="relative w-full">
                  <div
                    className="mx-auto w-8 rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all hover:from-blue-700 hover:to-blue-500"
                    style={{
                      height: `${(stat.bookings / maxBookings) * 100}%`,
                      minHeight: "8px",
                    }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 hover:opacity-100 transition">
                      {stat.bookings} lịch
                    </div>
                  </div>
                </div>
                <span className="mt-2 text-xs text-slate-500">{stat.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Chi tiết theo {period === "week" ? "ngày" : period === "month" ? "tuần" : "tháng"}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">
                  {period === "week" ? "Ngày" : period === "month" ? "Tuần" : "Tháng"}
                </th>
                <th className="px-4 py-3 text-right">Số lịch hẹn</th>
                <th className="px-4 py-3 text-right">Doanh thu</th>
                <th className="px-4 py-3 text-right">% Tổng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyStats.map((stat, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {stat.date}
                  </td>
                  <td className="px-4 py-3 text-right">{stat.bookings}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600">
                    {formatCurrency(stat.revenue)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {Math.round((stat.revenue / stats.totalRevenue) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-semibold">
              <tr>
                <td className="px-4 py-3">Tổng cộng</td>
                <td className="px-4 py-3 text-right">{stats.totalBookings}</td>
                <td className="px-4 py-3 text-right text-emerald-600">
                  {formatCurrency(stats.totalRevenue)}
                </td>
                <td className="px-4 py-3 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerStatistics;
