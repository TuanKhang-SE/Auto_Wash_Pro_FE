import { useState, useEffect, useCallback } from "react";
import {Plus, RefreshCw, AlertCircle, X, Check, Edit, Trash2, Search
} from "lucide-react";
import promotionService, { type Promotion } from "../../services/promotionService";
import { getErrorMessage } from "../../api/axiosClient";

const formatDate = (v: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const toIso = (local: string) => (local ? new Date(local).toISOString() : "");
const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

type FormState = {
  PromotionName: string;
  DiscountValue: string;
  StartDate: string;
  EndDate: string;
  Status: "Active" | "Inactive";
};

const nowPlus = (hours: number) => {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const emptyForm = (): FormState => ({
  PromotionName: "",
  DiscountValue: "",
  StartDate: nowPlus(1),
  EndDate: nowPlus(24 * 30),
  Status: "Active",
});

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Promotion | null>(null);

  // Lưu ngày gốc khi mở form edit để validate ngày không thay đổi
  const [originalDates, setOriginalDates] = useState<{ StartDate: string; EndDate: string } | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
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

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setOriginalDates(null);
    setFormError("");
    setFormSuccess("");
    setShowForm(true);
  };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    const startDate = toLocal(p.StartDate) || nowPlus(1);
    const endDate = toLocal(p.EndDate) || nowPlus(24 * 30);
    setForm({
      PromotionName: p.PromotionName,
      DiscountValue: String(Number(p.DiscountValue) || 0),
      StartDate: startDate,
      EndDate: endDate,
      Status: (p.Status as "Active" | "Inactive") || "Active",
    });
    // Lưu ngày gốc để validate khi cập nhật
    setOriginalDates({ StartDate: startDate, EndDate: endDate });
    setFormError("");
    setFormSuccess("");
    setShowForm(true);
  };

  const validate = (): boolean => {
    if (!form.PromotionName.trim()) {
      setFormError("Tên chương trình không được để trống");
      return false;
    }
    if (form.DiscountValue.trim() === "") {
      setFormError("Phần trăm giảm giá không được để trống");
      return false;
    }
    const val = Number(form.DiscountValue);
    if (isNaN(val) || val < 0) {
      setFormError("Phần trăm giảm giá phải là số không âm");
      return false;
    }
    if (val > 100) {
      setFormError("Phần trăm giảm giá không được vượt quá 100");
      return false;
    }
    if (!form.StartDate) {
      setFormError("Ngày bắt đầu không được để trống");
      return false;
    }
    if (!form.EndDate) {
      setFormError("Ngày kết thúc không được để trống");
      return false;
    }
    const now = new Date();
    const startChanged = !editing || form.StartDate !== originalDates?.StartDate;
    const endChanged = !editing || form.EndDate !== originalDates?.EndDate;
    // Khi cập nhật, chỉ validate ngày trong quá khứ nếu ngày đó đã được thay đổi
    if (startChanged && new Date(form.StartDate) < now) {
      setFormError("Ngày bắt đầu không được là ngày trong quá khứ");
      return false;
    }
    if (endChanged && new Date(form.EndDate) < now) {
      setFormError("Ngày kết thúc không được là ngày trong quá khứ");
      return false;
    }
    if (new Date(form.StartDate) >= new Date(form.EndDate)) {
      setFormError("Ngày kết thúc phải sau ngày bắt đầu");
      return false;
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setFormError("");
    setFormSuccess("");
    try {
      const payload = {
        PromotionName: form.PromotionName.trim(),
        DiscountType: "PERCENTAGE" as const,
        DiscountValue: Number(form.DiscountValue),
        StartDate: toIso(form.StartDate),
        EndDate: toIso(form.EndDate),
        BranchID: null,
        Status: form.Status,
      };
      if (editing) {
        await promotionService.updatePromotion(editing.PromotionID, payload);
        setFormSuccess("Cập nhật thành công!");
      } else {
        await promotionService.createPromotion(payload);
        setFormSuccess("Tạo chương trình thành công!");
      }
      setTimeout(() => {
        setShowForm(false);
        setEditing(null);
        setForm(emptyForm());
        setOriginalDates(null);
        fetchData();
      }, 800);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await promotionService.deletePromotion(deleting.PromotionID);
      setDeleting(null);
      fetchData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const toggleStatus = async (p: Promotion) => {
    const next = p.Status === "Active" ? "Inactive" : "Active";
    try {
      await promotionService.updatePromotion(p.PromotionID, { Status: next });
      fetchData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const filtered = promotions.filter((p) =>
    p.PromotionName.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Khuyến mãi</h1>
          <p className="text-sm text-slate-500">
            Tạo chương trình khuyến mãi áp dụng cho toàn hệ thống hoặc từng chi nhánh.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={16} /> Làm mới
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700"
          >
            <Plus size={18} /> Tạo khuyến mãi
          </button>
        </div>
      </div>
    <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên chương trình..."
          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
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
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  {search ? "Không có kết quả phù hợp" : "Chưa có chương trình khuyến mãi nào"}
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.PromotionID} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{p.PromotionName}</div>
                    <div className="text-xs text-slate-400">#{p.PromotionID}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-rose-600">
                    {Number(p.DiscountValue) || 0}%
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div>{formatDate(p.StartDate)}</div>
                    <div>đến {formatDate(p.EndDate)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(p)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.Status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {p.Status === "Active" ? "Hoạt động" : "Ngừng"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(p)}
                      className="mr-1 rounded p-1.5 text-blue-600 hover:bg-blue-50"
                      title="Sửa"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setDeleting(p)}
                      className="rounded p-1.5 text-red-600 hover:bg-red-50"
                      title="Tạm ngưng"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="text-lg font-semibold">
                {editing ? "Cập nhật khuyến mãi" : "Tạo chương trình khuyến mãi"}
              </h2>
              <button onClick={() => setShowForm(false)} className="rounded p-2 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4 p-5">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-600">
                  <Check size={16} /> {formSuccess}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tên chương trình <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.PromotionName}
                  onChange={(e) => setForm({ ...form, PromotionName: e.target.value })}
                  placeholder="VD: Khuyến mãi tháng 7"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Giảm theo % <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.DiscountValue}
                  onChange={(e) => setForm({ ...form, DiscountValue: e.target.value })}
                  min="0"
                  max="100"
                  placeholder="VD: 10 (tức 10%)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
                <p className="mt-1 text-xs text-slate-400">Nhập phần trăm giảm (0 - 100)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.StartDate}
                    onChange={(e) => setForm({ ...form, StartDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.EndDate}
                    onChange={(e) => setForm({ ...form, EndDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {editing && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Trạng thái</label>
                  <select
                    value={form.Status}
                    onChange={(e) => setForm({ ...form, Status: e.target.value as "Active" | "Inactive" })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="Active">Hoạt động</option>
                    <option value="Inactive">Ngừng</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-rose-600 py-2 text-sm text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo chương trình"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold">Tạm ngưng khuyến mãi?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Chương trình <b>"{deleting.PromotionName}"</b> sẽ chuyển sang trạng thái Ngừng.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setDeleting(null)}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm text-white hover:bg-red-700"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPromotions;