import { useState, useEffect } from "react";
import {
  BarChart3,
  Building2,
  DollarSign,
  CalendarCheck,
  Users,
} from "lucide-react";
import branchService, { type Branch } from "../../services/branchService";
import revenueService from "../../services/revenueService";

interface BranchStats {
  branchID: number;
  revenue: number;
  bookings: number;
  staff: number;
  customers: number;
}

const AdminStatistics = () => {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchStats, setBranchStats] = useState<BranchStats[]>([]);
  const [totals, setTotals] = useState({
    revenue: 0,
    bookings: 0,
    customers: 0,
    staff: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    if (period === "week") start.setDate(end.getDate() - 7);
    else if (period === "month") start.setMonth(end.getMonth() - 1);
    else start.setFullYear(end.getFullYear() - 1);
    return {
      StartDate: start.toISOString().split("T")[0],
      EndDate: end.toISOString().split("T")[0],
    };
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const data = await branchService.getAllBranches();
      setBranches(data);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  useEffect(() => {
    if (branches.length === 0) return;
    setIsLoading(true);
    fetchRevenueData();
  }, [period, branches]);

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      const { StartDate, EndDate } = getDateRange();

      const revenueByBranch: Record<number, number> = {};
      const totalRevenue = { cash: 0, transfer: 0, other: 0, total: 0 };
      const totalBookings = { count: 0, completed: 0, cancelled: 0, customers: 0 };

      const cashflow = await revenueService.getDailyCashflow({ StartDate, EndDate });
      for (const item of cashflow.dailyData) {
        totalRevenue.cash += item.cash;
        totalRevenue.transfer += item.transfer;
        totalRevenue.other += item.other;
        totalRevenue.total += item.total;
      }

      if (branches.length > 0) {
        const branchRevenue = totalRevenue.total / branches.length;
        branches.forEach((b) => {
          revenueByBranch[b.BranchID] = Math.round(branchRevenue);
        });
      }

      const stats: BranchStats[] = branches.map((b) => ({
        branchID: b.BranchID,
        revenue: revenueByBranch[b.BranchID] || 0,
        bookings: Math.round(totalBookings.count / branches.length),
        staff: 0,
        customers: 0,
      }));

      setBranchStats(stats);
      setTotals({
        revenue: totalRevenue.total,
        bookings: totalBookings.count,
        customers: totalBookings.customers,
        staff: totals.staff,
      });
    } catch (err) {
      console.error("Error fetching revenue data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(v);

  const maxRevenue = Math.max(...branchStats.map((b) => b.revenue), 1);
  const maxBookings = Math.max(...branchStats.map((b) => b.bookings), 1);

  const getBranchName = (id: number) =>
    branches.find((b) => b.BranchID === id)?.BranchName || `CN ${id}`;

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

      {/* Overall Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Tổng doanh thu</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {formatCurrency(totals.revenue)}
              </p>
              <p className="text-xs text-emerald-600 mt-1">↑ 12% so với kỳ trước</p>
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
                {totals.bookings.toLocaleString("vi-VN")}
              </p>
              <p className="text-xs text-emerald-600 mt-1">↑ 8% so với kỳ trước</p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3">
              <CalendarCheck size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Khách hàng</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {totals.customers.toLocaleString("vi-VN")}
              </p>
              <p className="text-xs text-emerald-600 mt-1">↑ 15% so với kỳ trước</p>
            </div>
            <div className="rounded-lg bg-purple-100 p-3">
              <Users size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Tổng nhân sự</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {totals.staff}
              </p>
              <p className="text-xs text-slate-500 mt-1">3 Manager + {totals.staff} Staff</p>
            </div>
            <div className="rounded-lg bg-rose-100 p-3">
              <Users size={24} className="text-rose-600" />
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
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
              </div>
            ) : (
              branchStats.map((b) => (
              <div key={b.branchID}>
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <span className="font-medium text-slate-700">
                    {getBranchName(b.branchID)}
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
            {branchStats.map((b) => (
              <div key={b.branchID}>
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <span className="font-medium text-slate-700">
                    {getBranchName(b.branchID)}
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
            ))}
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
          ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Chi nhánh</th>
                <th className="px-4 py-3">Doanh thu</th>
                <th className="px-4 py-3">Lịch hẹn</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Nhân viên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {branchStats.map((b) => (
                <tr key={b.branchID} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-rose-600" />
                      <span className="font-medium text-slate-800">
                        {getBranchName(b.branchID)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-emerald-600">
                    {formatCurrency(b.revenue)}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {b.bookings.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {b.customers.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-4 text-slate-700">{b.staff}</td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStatistics;
