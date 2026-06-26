import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Phone,
  Mail,
  Star,
  Trophy,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Crown,
  Medal,
  Award,
  ShieldCheck,
} from "lucide-react";
import customerService, {
  type CustomerDetail,
} from "../../services/customerService";
import tierConfigService, {
  type TierConfig,
} from "../../services/tierConfigService";
import { getErrorMessage } from "../../api/axiosClient";

const TIER_ICONS: Record<string, React.ReactNode> = {
  "VIP": <Crown size={16} className="text-amber-500" />,
  "Gold": <Trophy size={16} className="text-yellow-500" />,
  "Silver": <Medal size={16} className="text-slate-400" />,
  "Bronze": <Award size={16} className="text-orange-400" />,
  "Default": <ShieldCheck size={16} className="text-slate-400" />,
};

const getTierIcon = (tierName: string) => {
  const upper = tierName.toUpperCase();
  if (upper.includes("VIP")) return TIER_ICONS["VIP"];
  if (upper.includes("GOLD")) return TIER_ICONS["Gold"];
  if (upper.includes("SILVER")) return TIER_ICONS["Silver"];
  if (upper.includes("BRONZE")) return TIER_ICONS["Bronze"];
  return TIER_ICONS["Default"];
};

const formatNumber = (value: number): string =>
  new Intl.NumberFormat("vi-VN").format(value);

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<CustomerDetail[]>([]);
  const [tierConfigs, setTierConfigs] = useState<TierConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"fullName" | "lifetimePoints" | "createdAt">("fullName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [expandedCustomer, setExpandedCustomer] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [customerList, tiers] = await Promise.all([
        customerService.getAllCustomers(),
        tierConfigService.getAllTierConfigs(),
      ]);

      const tierMap = new Map<number, TierConfig>();
      tiers.forEach((t) => tierMap.set(t.TierID, t));

      const enriched: CustomerDetail[] = customerList.map((c) => {
        const tc = c.loyalty.tierId ? tierMap.get(c.loyalty.tierId) : null;
        return {
          ...c,
          loyalty: {
            ...c.loyalty,
            tierConfig: tc ?? null,
            tierName: tc?.TierName ?? c.loyalty.tierName,
          },
        };
      });

      setTierConfigs(tiers);
      setCustomers(enriched);
    } catch (err) {
      setError(getErrorMessage(err));
      console.error("Error fetching customers:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSort = (field: "fullName" | "lifetimePoints" | "createdAt") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: "fullName" | "lifetimePoints" | "createdAt" }) =>
    sortField === field ? (
      sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
    ) : null;

  const filtered = customers
    .filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        c.fullName.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q);
      const matchTier =
        tierFilter === "all" ||
        c.loyalty.tierName === tierFilter ||
        (tierFilter === "no-tier" && c.loyalty.tierId === null);
      return matchSearch && matchTier;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "fullName") {
        cmp = a.fullName.localeCompare(b.fullName);
      } else if (sortField === "lifetimePoints") {
        cmp = a.loyalty.lifetimePoints - b.loyalty.lifetimePoints;
      } else {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  const tierStats = tierConfigs.map((t) => ({
    ...t,
    count: customers.filter((c) => c.loyalty.tierId === t.TierID).length,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Quản lý Khách hàng
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Xem danh sách và hạng thành viên của {customers.length} khách hàng
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition"
        >
          <RefreshCw size={16} />
          Làm mới
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle size={32} className="text-red-500" />
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button
            onClick={fetchData}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 transition"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && !error && (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"></div>
        </div>
      )}

      {/* Tier Stats Summary */}
      {!isLoading && !error && customers.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div
              onClick={() => setTierFilter("all")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setTierFilter("all")}
              className={`cursor-pointer rounded-xl border p-4 transition ${
                tierFilter === "all"
                  ? "border-rose-400 bg-rose-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-slate-400" />
                <p className="text-xs text-slate-500">Tổng khách hàng</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {customers.length}
              </p>
            </div>

            {tierStats.slice(0, 3).map((t) => (
              <div
                key={t.TierID}
                onClick={() => setTierFilter(t.TierName)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setTierFilter(t.TierName)}
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  tierFilter === t.TierName
                    ? "border-rose-400 bg-rose-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getTierIcon(t.TierName)}
                  <p className="text-xs text-slate-500">{t.TierName}</p>
                </div>
                <p className="text-2xl font-bold text-slate-800">{t.count}</p>
              </div>
            ))}

            <div
              onClick={() => setTierFilter("no-tier")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setTierFilter("no-tier")}
              className={`cursor-pointer rounded-xl border p-4 transition ${
                tierFilter === "no-tier"
                  ? "border-rose-400 bg-rose-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={16} className="text-slate-400" />
                <p className="text-xs text-slate-500">Chưa có hạng</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {customers.filter((c) => c.loyalty.tierId === null).length}
              </p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên, SĐT, email..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pl-9 text-sm outline-none focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20"
                />
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500"
              >
                <option value="all">Tất cả hạng</option>
                {tierStats.map((t) => (
                  <option key={t.TierID} value={t.TierName}>
                    {t.TierName}
                  </option>
                ))}
                <option value="no-tier">Chưa có hạng</option>
              </select>
            </div>
            <p className="text-sm text-slate-500 shrink-0">
              Hiển thị {filtered.length} / {customers.length} khách hàng
            </p>
          </div>

          {/* Customer Table */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <Users size={32} className="text-slate-400" />
              <p className="text-sm font-medium text-slate-600">
                Không tìm thấy khách hàng nào
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => toggleSort("fullName")}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-600 uppercase tracking-wide hover:text-rose-600 transition"
                      >
                        Khách hàng
                        <SortIcon field="fullName" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Liên hệ
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => toggleSort("lifetimePoints")}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-600 uppercase tracking-wide hover:text-rose-600 transition"
                      >
                        Hạng thành viên
                        <SortIcon field="lifetimePoints" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Điểm tích lũy
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => toggleSort("createdAt")}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-600 uppercase tracking-wide hover:text-rose-600 transition"
                      >
                        Ngày tham gia
                        <SortIcon field="createdAt" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide w-12">
                      Chi tiết
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((customer) => (
                    <>
                      <tr
                        key={customer.userId}
                        className="hover:bg-slate-50/60 transition"
                      >
                        {/* Customer Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-rose-600">
                                {customer.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 text-sm">
                                {customer.fullName}
                              </p>
                              <p className="text-xs text-slate-400">
                                ID: #{customer.userId}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            <p className="flex items-center gap-1.5 text-xs text-slate-600">
                              <Phone size={12} className="text-slate-400" />
                              {customer.phone}
                            </p>
                            <p className="flex items-center gap-1.5 text-xs text-slate-500 truncate max-w-[160px]">
                              <Mail size={12} className="text-slate-400 shrink-0" />
                              {customer.email}
                            </p>
                          </div>
                        </td>

                        {/* Tier */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getTierIcon(customer.loyalty.tierName)}
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                customer.loyalty.tierId
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {customer.loyalty.tierName}
                            </span>
                          </div>
                        </td>

                        {/* Points */}
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-slate-800">
                              {formatNumber(customer.loyalty.lifetimePoints)} điểm
                            </p>
                            <p className="text-xs text-slate-400">
                              Hiện tại: {formatNumber(customer.loyalty.currentPoints)} đ
                            </p>
                          </div>
                        </td>

                        {/* Join Date */}
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-600">
                            {formatDate(customer.createdAt)}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              customer.status === "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {customer.status === "Active" ? "Hoạt động" : "Khóa"}
                          </span>
                        </td>

                        {/* Expand */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              setExpandedCustomer(
                                expandedCustomer === customer.userId
                                  ? null
                                  : customer.userId
                              )
                            }
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                          >
                            {expandedCustomer === customer.userId ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {expandedCustomer === customer.userId && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-4 bg-slate-50/50"
                          >
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                              {/* Tier Benefits */}
                              {customer.loyalty.tierConfig ? (
                                <div className="rounded-lg border border-slate-200 bg-white p-4">
                                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                    {getTierIcon(customer.loyalty.tierName)}
                                    Quyền lợi hạng {customer.loyalty.tierName}
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-slate-500">
                                        Chi tiêu tối thiểu
                                      </span>
                                      <span className="font-medium text-slate-800">
                                        {formatNumber(
                                          Number(customer.loyalty.tierConfig.MinSpent)
                                        )}{" "}
                                        đ
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-slate-500">
                                        Giảm giá
                                      </span>
                                      <span className="font-medium text-emerald-600">
                                        {Number(
                                          customer.loyalty.tierConfig.DiscountPercent
                                        ).toFixed(0)}
                                        %
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-slate-500">
                                        Nhân điểm
                                      </span>
                                      <span className="font-medium text-rose-600">
                                        x
                                        {Number(
                                          customer.loyalty.tierConfig.PointMultiplier
                                        ).toFixed(1)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-4 flex items-center justify-center">
                                  <p className="text-sm text-slate-400 text-center">
                                    Chưa có hạng thành viên
                                  </p>
                                </div>
                              )}

                              {/* Points Summary */}
                              <div className="rounded-lg border border-slate-200 bg-white p-4">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                  <Star size={14} className="text-amber-500" />
                                  Tích điểm
                                </h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">
                                      Điểm hiện tại
                                    </span>
                                    <span className="font-semibold text-rose-600">
                                      {formatNumber(customer.loyalty.currentPoints)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">
                                      Tổng tích lũy
                                    </span>
                                    <span className="font-semibold text-slate-800">
                                      {formatNumber(customer.loyalty.lifetimePoints)}
                                    </span>
                                  </div>
                                  {customer.loyalty.tierConfig &&
                                    customer.loyalty.tierConfig.MinSpent && (
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">
                                          Đến hạng tiếp
                                        </span>
                                        <span className="text-xs text-slate-400">
                                          Cần{" "}
                                          {formatNumber(
                                            Number(
                                              customer.loyalty.tierConfig.MinSpent
                                            ) -
                                              customer.loyalty.lifetimePoints
                                          )}{" "}
                                          đ
                                        </span>
                                      </div>
                                    )}
                                </div>
                              </div>

                              {/* Account Info */}
                              <div className="rounded-lg border border-slate-200 bg-white p-4">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                  Thông tin tài khoản
                                </h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">
                                      Mã khách hàng
                                    </span>
                                    <span className="font-mono text-xs text-slate-600">
                                      #{customer.userId}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">
                                      Ngày đăng ký
                                    </span>
                                    <span className="text-slate-700">
                                      {formatDate(customer.createdAt)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">
                                      Trạng thái
                                    </span>
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                        customer.status === "Active"
                                          ? "bg-emerald-50 text-emerald-700"
                                          : "bg-red-50 text-red-600"
                                      }`}
                                    >
                                      {customer.status === "Active"
                                        ? "Hoạt động"
                                        : "Khóa"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminCustomers;
