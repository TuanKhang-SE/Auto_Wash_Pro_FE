import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, X, Gift } from "lucide-react";
import rewardService, { type Reward, type RewardPayload } from "../../services/rewardService";
import { getErrorMessage } from "../../api/axiosClient";

type FormState = {
  RewardName: string;
  RequiredPoints: string;
  DiscountValue: string;
  ValidDays: string;
  Status: RewardPayload["Status"];
};

const empty: FormState = {
  RewardName: "",
  RequiredPoints: "",
  DiscountValue: "",
  ValidDays: "30",
  Status: "Active",
};

const AdminRewards = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleting, setDeleting] = useState<Reward | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRewards(await rewardService.getAll());
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startCreate = () => {
    setEditing(null);
    setForm(empty);
    setFormError("");
    setOpen(true);
  };

  const startEdit = (r: Reward) => {
    setEditing(r);
    setForm({
      RewardName: r.RewardName,
      RequiredPoints: String(r.RequiredPoints ?? ""),
      DiscountValue: r.DiscountValue ? String(Number(r.DiscountValue)) : "",
      ValidDays: r.ValidDays ? String(r.ValidDays) : "30",
      Status: (r.Status as RewardPayload["Status"]) ?? "Active",
    });
    setFormError("");
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.RewardName.trim()) return setFormError("Tên phần quà không được để trống");
    const points = Number(form.RequiredPoints);
    if (form.RequiredPoints.trim() === "") return setFormError("Số điểm đổi không được để trống");
    if (!Number.isInteger(points) || points <= 0)
      return setFormError("Số điểm đổi phải lớn hơn 0");
    const discount = Number(form.DiscountValue);
    if (form.DiscountValue.trim() === "") return setFormError("Giá trị ưu đãi không được để trống");
    if (!Number.isFinite(discount) || discount <= 0)
      return setFormError("Giá trị ưu đãi phải lớn hơn 0");
    const days = Number(form.ValidDays);
    if (form.ValidDays.trim() === "") return setFormError("Số ngày hiệu lực không được để trống");
    if (!Number.isInteger(days) || days <= 0)
      return setFormError("Số ngày hiệu lực phải lớn hơn 0");

    const payload: RewardPayload = {
      RewardName: form.RewardName.trim(),
      RequiredPoints: points,
      DiscountValue: discount,
      ValidDays: days,
      Status: form.Status,
    };

    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await rewardService.update(editing.RewardID, payload);
      } else {
        await rewardService.create(payload);
      }
      setOpen(false);
      load();
    } catch (e) {
      setFormError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  // Ngừng áp dụng (backend không có DELETE nên dùng PUT Status=Inactive)
  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteError("");
    try {
      await rewardService.update(deleting.RewardID, { Status: "Inactive" });
      setDeleting(null);
      load();
    } catch (e) {
      setDeleteError(getErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Đổi điểm</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tạo phần quà đổi điểm áp dụng cho <b>toàn bộ chi nhánh</b>.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          <Plus size={18} /> Thêm phần quà
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-slate-500">Đang tải...</div>
      ) : rewards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 p-10 text-slate-500">
          <Gift size={28} />
          <p>Chưa có phần quà nào.</p>
          <button onClick={startCreate} className="text-sky-600 hover:underline">
            Tạo phần quà đầu tiên
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Tên phần quà</th>
                <th className="px-4 py-3">Điểm đổi</th>
                <th className="px-4 py-3">Giá trị ưu đãi</th>
                <th className="px-4 py-3">Hiệu lực</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rewards.map((r) => (
                <tr key={r.RewardID} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.RewardName}</td>
                  <td className="px-4 py-3 text-amber-600 font-semibold">
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
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        r.Status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {r.Status === "Active" ? "Đang áp dụng" : "Ngừng"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => startEdit(r)}
                      className="mr-1 rounded p-1.5 text-blue-600 hover:bg-blue-50"
                      title="Sửa"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setDeleting(r)}
                      className="rounded p-1.5 text-red-600 hover:bg-red-50"
                      title="Ngừng áp dụng"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal tạo/sửa */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold">
                {editing ? "Sửa phần quà" : "Thêm phần quà"}
              </h2>
              <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3 p-4">
              {formError && (
                <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                  {formError}
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium">Tên phần quà *</label>
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={form.RewardName}
                  onChange={(e) => setForm({ ...form, RewardName: e.target.value })}
                  placeholder="VD: Voucher giảm 50.000đ"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Điểm đổi *</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded border px-3 py-2 text-sm"
                    value={form.RequiredPoints}
                    onChange={(e) =>
                      setForm({ ...form, RequiredPoints: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Giá trị ưu đãi (đ) *</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded border px-3 py-2 text-sm"
                    value={form.DiscountValue}
                    onChange={(e) =>
                      setForm({ ...form, DiscountValue: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Số ngày hiệu lực *</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded border px-3 py-2 text-sm"
                    value={form.ValidDays}
                    onChange={(e) => setForm({ ...form, ValidDays: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Trạng thái</label>
                  <select
                    className="w-full rounded border px-3 py-2 text-sm"
                    value={form.Status}
                    onChange={(e) =>
                      setForm({ ...form, Status: e.target.value as RewardPayload["Status"] })
                    }
                  >
                    <option value="Active">Đang áp dụng</option>
                    <option value="Inactive">Ngừng</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded border py-2 text-sm hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded bg-sky-600 py-2 text-sm text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : editing ? "Lưu" : "Tạo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xác nhận ngừng áp dụng */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Ngừng áp dụng phần quà?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Phần quà <b>{deleting.RewardName}</b> sẽ chuyển sang trạng thái Ngừng và không còn
              hiển thị cho khách hàng ở tất cả chi nhánh.
            </p>
            {deleteError && (
              <div className="mt-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                {deleteError}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setDeleting(null)}
                className="flex-1 rounded border py-2 text-sm hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded bg-red-600 py-2 text-sm text-white hover:bg-red-700"
              >
                Ngừng áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRewards;