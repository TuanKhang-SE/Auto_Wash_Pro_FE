import { useState, useEffect } from "react";
import { DollarSign, Landmark, CreditCard, MoreHorizontal, TrendingUp } from "lucide-react";
import revenueService, { type DailyCashflowItem } from "../../services/revenueService";
import branchService, { type Branch } from "../../services/branchService";

const AdminRevenue = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | "">("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dailyData, setDailyData] = useState<DailyCashflowItem[]>([]);
  const [summary, setSummary] = useState({ totalCash: 0, totalTransfer: 0, totalOther: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    branchService.getAllBranches().then(setBranches).catch(console.error);
  }, []);

  useEffect(() => {
    if (hasFetched) {
      fetchRevenue();
    }
  }, [selectedBranch]);

  const fetchRevenue = async () => {
    setIsLoading(true);
    try {
      const params: Parameters<typeof revenueService.getDailyCashflow>[0] = { StartDate: startDate, EndDate: endDate };
      if (selectedBranch !== "") params.BranchID = selectedBranch;

      const data = await revenueService.getDailyCashflow(params);
      setDailyData(data.dailyData);
      setSummary(data.summary);
      setHasFetched(true);
    } catch (err) {
      console.error("Error fetching revenue:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setHasFetched(false);
    fetchRevenue();
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(v);

  const formatDate = (d: string) => {
    const [year, month, day] = d.split("-");
    return `${day}/${month}/${year}`;
  };

  const totalRecords = dailyData.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Báo cáo Doanh thu</h1>
        <p className="mt-1 text-sm text-slate-500">Báo cáo đối soát doanh thu theo phương thức thanh toán</p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Chi nhánh</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value === "" ? "" : Number(e.target.value))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              <option value="">Tất cả chi nhánh</option>
              {branches.map((b) => (
                <option key={b.BranchID} value={b.BranchID}>{b.BranchName}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50 transition"
          >
            {isLoading ? "Đang tải..." : "Tra cứu"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Tiền mặt</p>
              <p className="mt-2 text-xl font-bold text-slate-800">{formatCurrency(summary.totalCash)}</p>
            </div>
            <div className="rounded-lg bg-emerald-100 p-3">
              <Landmark size={24} className="text-emerald-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {totalRecords > 0 ? Math.round((summary.totalCash / summary.total) * 100) : 0}% tổng doanh thu
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Chuyển khoản</p>
              <p className="mt-2 text-xl font-bold text-slate-800">{formatCurrency(summary.totalTransfer)}</p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3">
              <CreditCard size={24} className="text-blue-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {totalRecords > 0 ? Math.round((summary.totalTransfer / summary.total) * 100) : 0}% tổng doanh thu
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Khác</p>
              <p className="mt-2 text-xl font-bold text-slate-800">{formatCurrency(summary.totalOther)}</p>
            </div>
            <div className="rounded-lg bg-purple-100 p-3">
              <MoreHorizontal size={24} className="text-purple-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {totalRecords > 0 ? Math.round((summary.totalOther / summary.total) * 100) : 0}% tổng doanh thu
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Tổng doanh thu</p>
              <p className="mt-2 text-xl font-bold text-rose-600">{formatCurrency(summary.total)}</p>
            </div>
            <div className="rounded-lg bg-rose-100 p-3">
              <DollarSign size={24} className="text-rose-600" />
            </div>
          </div>
          <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
            <TrendingUp size={12} />
            {totalRecords} ngày đối soát
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-slate-800 flex items-center gap-2">
          <DollarSign size={18} className="text-rose-600" />
          Chi tiết theo ngày
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"></div>
          </div>
        ) : dailyData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <DollarSign size={40} className="mb-2 opacity-30" />
            <p className="text-sm">Chưa có dữ liệu. Vui lòng chọn khoảng thời gian và nhấn Tra cứu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Ngày</th>
                  <th className="px-4 py-3 text-right">Tiền mặt</th>
                  <th className="px-4 py-3 text-right">Chuyển khoản</th>
                  <th className="px-4 py-3 text-right">Khác</th>
                  <th className="px-4 py-3 text-right">Tổng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-medium text-slate-800">{formatDate(item.date)}</td>
                    <td className="px-4 py-3.5 text-right text-emerald-600">{formatCurrency(item.cash)}</td>
                    <td className="px-4 py-3.5 text-right text-blue-600">{formatCurrency(item.transfer)}</td>
                    <td className="px-4 py-3.5 text-right text-purple-600">{formatCurrency(item.other)}</td>
                    <td className="px-4 py-3.5 text-right font-semibold text-slate-800">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-semibold">
                <tr>
                  <td className="px-4 py-3 text-slate-700">Tổng cộng</td>
                  <td className="px-4 py-3 text-right text-emerald-700">{formatCurrency(summary.totalCash)}</td>
                  <td className="px-4 py-3 text-right text-blue-700">{formatCurrency(summary.totalTransfer)}</td>
                  <td className="px-4 py-3 text-right text-purple-700">{formatCurrency(summary.totalOther)}</td>
                  <td className="px-4 py-3 text-right text-rose-700">{formatCurrency(summary.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRevenue;
