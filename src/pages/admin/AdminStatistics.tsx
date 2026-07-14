import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Building2,
  DollarSign,
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import branchService, { type Branch } from "../../services/branchService";
import revenueService from "../../services/revenueService";
import { getErrorMessage } from "../../api/axiosClient";

interface BranchStats {
  branchId: number;
  branchName: string;
  revenue: number;
  bookings: number;
}

interface SystemStats {
  totalRevenue: number;
  totalBookings: number;
  previousRevenue: number;
  previousBookings: number;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v);

const calculateChange = (current: number, previous: number): { value: number; type: "up" | "down" | "neutral" } => {
  if (previous === 0) return { value: 0, type: "neutral" };
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(change)),
    type: change > 0 ? "up" : change < 0 ? "down" : "neutral",
  };
};

const AdminStatistics = () => {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchStats, setBranchStats] = useState<BranchStats[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = (currentPeriod: typeof period) => {
    const end = new Date();
    const start = new Date();
    if (currentPeriod === "week") start.setDate(end.getDate() - 7);
    else if (currentPeriod === "month") start.setMonth(end.getMonth() - 1);
    else start.setFullYear(end.getFullYear() - 1);
    return {
      StartDate: start.toISOString().split("T")[0],
      EndDate: end.toISOString().split("T")[0],
    };
  };

  const getPreviousDateRange = (currentPeriod: typeof period) => {
    const end = new Date();
    const start = new Date();
    if (currentPeriod === "week") {
      start.setDate(end.getDate() - 14);
      end.setDate(end.getDate() - 7);
    } else if (currentPeriod === "month") {
      start.setMonth(end.getMonth() - 2);
      end.setMonth(end.getMonth() - 1);
    } else {
      start.setFullYear(end.getFullYear() - 2);
      end.setFullYear(end.getFullYear() - 1);
    }
    return {
      StartDate: start.toISOString().split("T")[0],
      EndDate: end.toISOString().split("T")[0],
    };
  };

  const fetchData = useCallback(async (currentPeriod: typeof period = period) => {
    setIsLoading(true);
    setError(null);

    try {
      const { StartDate, EndDate } = getDateRange(currentPeriod);
      const { StartDate: prevStart, EndDate: prevEnd } = getPreviousDateRange(currentPeriod);

      const [branchesData, revenueData, prevRevenueData] = await Promise.all([
        branchService.getAllBranches(),
        revenueService.getRevenueByBranch({ StartDate, EndDate }),
        revenueService.getRevenueByBranch({ StartDate: prevStart, EndDate: prevEnd }),
      ]);

      setBranches(branchesData);

      const statsMap = new Map<number, BranchStats>();
      let totalRevenue = 0;
      let totalBookings = 0;
      let previousRevenue = 0;

      revenueData.forEach((item) => {
        totalRevenue += item.totalRevenue;
        totalBookings += item.totalBookings;
        statsMap.set(item.branchId, {
          branchId: item.branchId,
          branchName: item.branchName,
          revenue: item.totalRevenue,
          bookings: item.totalBookings,
        });
      });

      prevRevenueData.forEach((item) => {
        previousRevenue += item.totalRevenue;
      });

      const branchStatsList: BranchStats[] = branchesData.map((branch) => {
        const stats = statsMap.get(branch.BranchID);
        return stats || {
          branchId: branch.BranchID,
          branchName: branch.BranchName,
          revenue: 0,
          bookings: 0,
        };
      });

      setBranchStats(branchStatsList);
      setSystemStats({
        totalRevenue,
        totalBookings,
        previousRevenue,
        previousBookings: 0,
      });
    } catch (err) {
      setError(getErrorMessage(err));
      console.error("Error fetching statistics:", err);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [period]);

  const handleRefresh = () => {
    fetchData(period);
  };

  const maxRevenue = Math.max(...branchStats.map((b) => b.revenue), 1);
  const maxBookings = Math.max(...branchStats.map((b) => b.bookings), 1);

  const revenueChange = systemStats ? calculateChange(systemStats.totalRevenue, systemStats.previousRevenue) : null;

  const renderChange = (change: { value: number; type: "up" | "down" | "neutral" } | null, label: string) => {
    if (!change) return null;
    const colorClass = change.type === "up" ? "text-emerald-600" : change.type === "down" ? "text-red-600" : "text-slate-500";
    const icon = change.type === "up" ? <TrendingUp size={14} /> : change.type === "down" ? <TrendingDown size={14} /> : <Minus size={14} />;
    const prefix = change.type === "up" ? "↑" : change.type === "down" ? "↓" : "";

    return (
      <p className={`text-xs ${colorClass} mt-1 flex items-center gap-1`}>
        {icon}
        {prefix}{change.value}% {label}
      </p>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Thống kê toàn hệ thống
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tổng quan và so sánh hiệu suất các chi nhánh
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Làm mới
          </button>
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            {(["week", "month", "year"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
                  period === p
                    ? "bg-rose-600 text-white shadow"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p === "week" ? "Tuần" : p === "month" ? "Tháng" : "Năm"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Lỗi tải dữ liệu</p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="rounded-lg p-1 text-red-400 hover:bg-red-100 hover:text-red-600 transition"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      )}

      {/* Overall Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Tổng doanh thu</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {isLoading ? (
                  <span className="h-8 w-32 animate-pulse bg-slate-200 rounded block"></span>
                ) : systemStats ? (
                  formatCurrency(systemStats.totalRevenue)
                ) : (
                  "—"
                )}
              </p>
              {renderChange(revenueChange, "so với kỳ trước")}
            </div>
            <div className="rounded-lg bg-emerald-100 p-3">
              <DollarSign size={24} className="text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Tổng lịch hẹn</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {isLoading ? (
                  <span className="h-8 w-24 animate-pulse bg-slate-200 rounded block"></span>
                ) : systemStats ? (
                  systemStats.totalBookings.toLocaleString("vi-VN")
                ) : (
                  "—"
                )}
              </p>
              <p className="text-xs text-slate-500 mt-1">Trong kỳ</p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3">
              <CalendarCheck size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Số chi nhánh</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {isLoading ? (
                  <span className="h-8 w-12 animate-pulse bg-slate-200 rounded block"></span>
                ) : (
                  branches.length
                )}
              </p>
              <p className="text-xs text-slate-500 mt-1">Đang hoạt động</p>
            </div>
            <div className="rounded-lg bg-purple-100 p-3">
              <Building2 size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Doanh thu trung bình</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {isLoading ? (
                  <span className="h-8 w-28 animate-pulse bg-slate-200 rounded block"></span>
                ) : systemStats && branches.length > 0 ? (
                  formatCurrency(systemStats.totalRevenue / branches.length)
                ) : (
                  "—"
                )}
              </p>
              <p className="text-xs text-slate-500 mt-1">Mỗi chi nhánh</p>
            </div>
            <div className="rounded-lg bg-rose-100 p-3">
              <BarChart3 size={24} className="text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Bar charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-600" />
                Doanh thu theo chi nhánh
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                So sánh doanh thu trong kỳ
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
                      <div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-1/2 bg-slate-200 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : branchStats.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Chưa có dữ liệu doanh thu
              </div>
            ) : (
              branchStats.map((b) => (
                <div key={b.branchId}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="font-medium text-slate-700">
                      {b.branchName}
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(b.revenue)}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${(b.revenue / maxRevenue) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bookings Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <CalendarCheck size={18} className="text-blue-600" />
                Lượt đặt lịch theo chi nhánh
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tổng số booking trong kỳ
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
                      <div className="h-4 w-12 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-slate-200 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : branchStats.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Chưa có dữ liệu lịch hẹn
              </div>
            ) : (
              branchStats.map((b) => (
                <div key={b.branchId}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="font-medium text-slate-700">
                      {b.branchName}
                    </span>
                    <span className="font-semibold text-blue-600">
                      {b.bookings.toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${(b.bookings / maxBookings) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-rose-600" />
          Bảng so sánh chi tiết
        </h3>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"></div>
            </div>
          ) : branchStats.length === 0 && branches.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Building2 size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm">Chưa có dữ liệu chi nhánh</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Chi nhánh</th>
                  <th className="px-4 py-3">Doanh thu</th>
                  <th className="px-4 py-3">Lịch hẹn</th>
                  <th className="px-4 py-3">% Tổng doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branchStats.map((b) => {
                  const percentage = systemStats && systemStats.totalRevenue > 0
                    ? ((b.revenue / systemStats.totalRevenue) * 100).toFixed(1)
                    : "0.0";
                  return (
                    <tr key={b.branchId} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-rose-600" />
                          <span className="font-medium text-slate-800">
                            {b.branchName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-emerald-600">
                        {formatCurrency(b.revenue)}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {b.bookings.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-slate-600 w-12 text-right">
                            {percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {systemStats && (
                <tfoot className="bg-slate-50 font-semibold">
                  <tr>
                    <td className="px-4 py-3 text-slate-700">Tổng cộng</td>
                    <td className="px-4 py-3 text-emerald-600">
                      {formatCurrency(systemStats.totalRevenue)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {systemStats.totalBookings.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-slate-700">100%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStatistics;
