import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Gift, RefreshCw, Search, X } from "lucide-react";
import rewardService, { type Reward } from "../../services/rewardService";
import { getErrorMessage } from "../../api/axiosClient";

const ManagerRewards = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Đồng bộ từ Admin: lấy tất cả phần quà để Manager thấy được cả Active lẫn Inactive
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await rewardService.getAll();
      setRewards(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = rewards.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return r.RewardName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Phần quà đổi điểm</h1>
          <p className="text-sm text-slate-500">
            Danh sách phần quà đang và đã ngừng áp dụng cho chi nhánh của bạn.
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
          placeholder="Tìm phần quà..."
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
              <th className="px-4 py-3">Tên phần quà</th>
              <th className="px-4 py-3">Điểm đổi</th>
              <th className="px-4 py-3">Giá trị ưu đãi</th>
              <th className="px-4 py-3">Hiệu lực</th>
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
                  {search ? "Không có kết quả phù hợp" : "Chưa có phần quà nào trong hệ thống"}
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const isActive = r.Status === "Active";
                return (
                  <tr
                    key={r.RewardID}
                    className={`hover:bg-slate-50 ${!isActive ? "opacity-60" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{r.RewardName}</td>
                    <td className="px-4 py-3 font-semibold text-amber-600">
                      {Number(r.RequiredPoints || 0).toLocaleString("vi-VN")} điểm
                    </td>
                    <td className="px-4 py-3">
                      {Number(r.DiscountValue) > 0
                        ? `${Number(r.DiscountValue).toLocaleString("vi-VN")} đ`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">{r.ValidDays ?? 30} ngày</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActive ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        ></span>
                        {isActive ? "Đang áp dụng" : "Ngừng"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && rewards.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 p-10 text-slate-500">
          <Gift size={24} />
          <p className="text-sm">Chưa có phần quà nào trong hệ thống.</p>
        </div>
      )}

      {rewards.length > 0 && (
        <p className="text-xs text-slate-500">
          Hiển thị {filtered.length} / {rewards.length} phần quà
        </p>
      )}
    </div>
  );
};

export default ManagerRewards;