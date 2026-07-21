import { useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Clock,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

interface Shift {
  ShiftID: number;
  ShiftName: string;
  StartTime: string | null;
  EndTime: string | null;
  Status: string;
}

interface ShiftFormData {
  ShiftName: string;
  StartTime: string;
  EndTime: string;
  Status: "Active" | "Inactive";
}

const emptyForm: ShiftFormData = {
  ShiftName: "",
  StartTime: "",
  EndTime: "",
  Status: "Active",
};

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

const getErrorMessage = (error: unknown) => {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return err.response?.data?.message || err.message || "Có lỗi xảy ra.";
};

// Convert time HH:mm sang ISO datetime format "1970-01-01T08:00:00.000Z"
const toISODateTime = (timeValue: string): string => {
  if (!timeValue) return "";
  return `1970-01-01T${timeValue}:00.000Z`;
};

const formatTime = (value: string | null) => {
  if (!value) return "--:--";
  const match = value.match(/T(\d{2}:\d{2})/);
  if (match) return match[1];
  return value.slice(0, 5);
};

const AdminShifts = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [filteredShifts, setFilteredShifts] = useState<Shift[]>([]);
  const [allShifts, setAllShifts] = useState<Shift[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [shiftForm, setShiftForm] = useState<ShiftFormData>(emptyForm);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadShifts();
  }, []);

  useEffect(() => {
    filterShifts();
  }, [searchTerm, filterStatus, allShifts]);

  const loadShifts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.get("/api/shifts", {
        headers: getAuthHeader(),
      });
      if (res.data?.success) {
        setAllShifts(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const filterShifts = () => {
    let result = [...allShifts];

    if (searchTerm) {
      result = result.filter(
        (s) =>
          s.ShiftName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          formatTime(s.StartTime).includes(searchTerm) ||
          formatTime(s.EndTime).includes(searchTerm)
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((s) => s.Status === filterStatus);
    }

    setFilteredShifts(result);
  };

  const openCreateShift = () => {
    setEditingShift(null);
    setShiftForm(emptyForm);
    setOpenModal(true);
  };

  const openEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setShiftForm({
      ShiftName: shift.ShiftName,
      StartTime: shift.StartTime ? formatTime(shift.StartTime) : "",
      EndTime: shift.EndTime ? formatTime(shift.EndTime) : "",
      Status: shift.Status as "Active" | "Inactive",
    });
    setOpenModal(true);
  };

  const validateShiftForm = () => {
    if (!shiftForm.ShiftName.trim()) {
      setError("Tên ca không được để trống");
      return false;
    }
    if (!shiftForm.StartTime) {
      setError("Giờ bắt đầu không được để trống");
      return false;
    }
    if (!shiftForm.EndTime) {
      setError("Giờ kết thúc không được để trống");
      return false;
    }
    return true;
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateShiftForm()) return;

    setSaving(true);
    setError("");

    try {
      const payload = {
        ShiftName: shiftForm.ShiftName.trim(),
        StartTime: toISODateTime(shiftForm.StartTime),
        EndTime: toISODateTime(shiftForm.EndTime),
        Status: shiftForm.Status,
      };

      let res;
      if (editingShift) {
        res = await axiosClient.put(`/api/shifts/${editingShift.ShiftID}`, payload, {
          headers: getAuthHeader(),
        });
      } else {
        res = await axiosClient.post("/api/shifts", payload, {
          headers: getAuthHeader(),
        });
      }

      if (res.data?.success) {
        setSuccess(editingShift ? "Cập nhật ca thành công!" : "Tạo ca mới thành công!");
        setOpenModal(false);
        await loadShifts();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.data?.message || "Lưu thất bại");
      }
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShift = async (shift: Shift) => {
    if (!confirm(`Xóa ca "${shift.ShiftName}"? Hành động này sẽ ngừng áp dụng ca.`)) return;

    try {
      const res = await axiosClient.put(
        `/api/shifts/${shift.ShiftID}`,
        { Status: "Inactive" },
        {
          headers: getAuthHeader(),
        }
      );
      if (res.data?.success) {
        setSuccess("Xóa ca thành công!");
        await loadShifts();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.data?.message || "Xóa thất bại");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "Active" ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        Đang áp dụng
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
        Ngừng
      </span>
    );
  };

  const activeCount = allShifts.filter((s) => s.Status === "Active").length;
  const inactiveCount = allShifts.filter((s) => s.Status === "Inactive").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Ca làm việc</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tạo, sửa, xóa và quản lý các ca làm việc cho hệ thống.
          </p>
        </div>
        <button
          onClick={openCreateShift}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Thêm Ca làm việc
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3">
              <Clock className="text-blue-600" size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tổng số ca</p>
              <p className="text-xl font-bold text-slate-800">{allShifts.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3">
              <Clock className="text-emerald-600" size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Đang áp dụng</p>
              <p className="text-xl font-bold text-emerald-700">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-3">
              <Clock className="text-slate-600" size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Ngừng áp dụng</p>
              <p className="text-xl font-bold text-slate-700">{inactiveCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên ca, giờ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">Tất cả</option>
          <option value="Active">Đang áp dụng</option>
          <option value="Inactive">Ngừng</option>
        </select>
        <button
          onClick={loadShifts}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Tên ca</th>
                <th className="px-6 py-4">Giờ bắt đầu</th>
                <th className="px-6 py-4">Giờ kết thúc</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <Loader2 className="animate-spin text-blue-600" size={24} />
                    </div>
                  </td>
                </tr>
              ) : filteredShifts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    {searchTerm || filterStatus !== "all"
                      ? "Không tìm thấy ca làm việc nào"
                      : "Chưa có ca làm việc nào"}
                  </td>
                </tr>
              ) : (
                filteredShifts.map((shift) => (
                  <tr
                    key={shift.ShiftID}
                    className="hover:bg-slate-50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-100 p-2">
                          <Clock className="text-blue-600" size={18} />
                        </div>
                        <span className="font-medium text-slate-800">
                          {shift.ShiftName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatTime(shift.StartTime)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatTime(shift.EndTime)}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(shift.Status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditShift(shift)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                          title="Sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteShift(shift)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create/Edit Shift */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="text-lg font-semibold">
                {editingShift ? "Sửa Ca làm việc" : "Thêm Ca làm việc"}
              </h2>
              <button
                onClick={() => setOpenModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="p-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Tên ca <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={shiftForm.ShiftName}
                  onChange={(e) => setShiftForm({ ...shiftForm, ShiftName: e.target.value })}
                  placeholder="VD: Ca Sáng, Ca Chiều, Ca Đêm"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Giờ bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={shiftForm.StartTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, StartTime: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Giờ kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={shiftForm.EndTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, EndTime: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Trạng thái</label>
                <select
                  value={shiftForm.Status}
                  onChange={(e) =>
                    setShiftForm({ ...shiftForm, Status: e.target.value as "Active" | "Inactive" })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="Active">Đang áp dụng</option>
                  <option value="Inactive">Ngừng</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      Đang lưu...
                    </span>
                  ) : editingShift ? (
                    "Lưu thay đổi"
                  ) : (
                    "Tạo ca mới"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShifts;
