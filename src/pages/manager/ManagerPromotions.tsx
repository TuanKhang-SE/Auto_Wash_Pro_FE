import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertCircle, X, Search } from "lucide-react";
import promotionService, { type Promotion } from "../../services/promotionService";
import { getErrorMessage } from "../../api/axiosClient";

const formatDate = (v: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const ManagerPromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Backend tự lọc: trả về KM của chi nhánh Manager + KM toàn hệ thống
      const data = await promotionService.getAllPromotions();
      setPromotions(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = promotions.filter((p) =>
    p.PromotionName.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Chương trình Khuyến mãi</h1>
          <p className="text-sm text-slate-500">
            Danh sách khuyến mãi đang áp dụng cho chi nhánh của bạn (bao gồm cả chương trình toàn hệ thống).
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm chương trình..."
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle size={16} className="mt-0.5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Tên chương trình</th>
              <th className="px-4 py-3">Giảm giá</th>
              <th className="px-4 py-3">Ngày bắt đầu</th>
              <th className="px-4 py-3">Ngày kết thúc</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  {search ? "Không có kết quả phù hợp" : "Chưa có chương trình khuyến mãi nào cho chi nhánh của bạn"}
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.PromotionID} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.PromotionName}</td>
                  <td className="px-4 py-3 font-semibold text-rose-600">
                    {Number(p.DiscountValue) || 0}%
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{formatDate(p.StartDate)}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{formatDate(p.EndDate)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.Status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {p.Status === "Active" ? "Hoạt động" : "Ngừng"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {promotions.length > 0 && (
        <p className="text-xs text-slate-500">
          Hiển thị {filtered.length} / {promotions.length} chương trình
        </p>
      )}
    </div>
  );
};

export default ManagerPromotions;