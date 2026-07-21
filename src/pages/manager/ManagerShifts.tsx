import { useEffect, useState } from "react";
import {
  X,
  Clock,
  Users,
  CalendarCheck,
  Loader2,
  RefreshCw,
  Calendar,
  Trash2,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

interface Shift {
  ShiftID: number;
  ShiftName: string;
  StartTime: string | null;
  EndTime: string | null;
  Status: string;
}

interface Staff {
  UserID: number;
  FullName: string;
  Phone: string | null;
  Email: string | null;
  BranchID: number | null;
  Role: string;
  Status: string;
}

interface StaffSchedule {
  ScheduleID: number;
  UserID: number;
  WorkDate: string;
  ShiftID: number;
  CapacityWeight: number | string | null;
  Status: string;
  Users?: {
    FullName: string;
    Phone: string | null;
  } | null;
  Shifts?: {
    ShiftName: string;
    StartTime: string | null;
    EndTime: string | null;
  } | null;
}

interface ScheduleFormData {
  WorkDate: string;
  ShiftID: number;
  UserID: number;
}

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

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getToday = () => formatDateInput(new Date());

// Kiểm tra ngày có phải trong quá khứ không
const isDateInPast = (dateValue: string): boolean => {
  if (!dateValue) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(dateValue);
  selected.setHours(0, 0, 0, 0);
  return selected < today;
};

const formatTime = (value: string | null) => {
  if (!value) return "--:--";
  const match = value.match(/T(\d{2}:\d{2})/);
  if (match) return match[1];
  return value.slice(0, 5);
};

const formatDate = (dateText: string) => {
  const [year, month, day] = dateText.split("-");
  if (!year || !month || !day) return dateText;
  return `${day}/${month}/${year}`;
};

const normalizeDate = (dateText: string) => dateText.slice(0, 10);

const ManagerShifts = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [selectedShiftForAssign, setSelectedShiftForAssign] = useState<Shift | null>(null);
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormData>({
    WorkDate: getToday(),
    ShiftID: 0,
    UserID: 0,
  });

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [deletingSchedule, setDeletingSchedule] = useState<number | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadShifts(), loadStaff(), loadSchedules()]);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadShifts = async () => {
    const res = await axiosClient.get("/api/shifts", {
      params: { Status: "Active" },
      headers: getAuthHeader(),
    });
    if (res.data?.success) {
      setShifts(res.data.data);
    }
  };

  const loadStaff = async () => {
    const res = await axiosClient.get("/api/users", {
      params: { Role: "Staff", Status: "Active" },
      headers: getAuthHeader(),
    });
    if (res.data?.success) {
      setStaffList(res.data.data);
    }
  };

  const loadSchedules = async () => {
    const res = await axiosClient.get("/api/staff-schedules", {
      params: { Status: "Active" },
      headers: getAuthHeader(),
    });
    if (res.data?.success) {
      setSchedules(res.data.data);
    }
  };

  // Schedule assignment
  const openAssignModalFn = (shift: Shift) => {
    setSelectedShiftForAssign(shift);
    setScheduleForm({ WorkDate: getToday(), ShiftID: shift.ShiftID, UserID: 0 });
    setOpenAssignModal(true);
  };

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.UserID || !scheduleForm.WorkDate) {
      setError("Vui lòng chọn nhân viên và ngày");
      return;
    }

    // Validate: không cho xếp ca trong quá khứ
    if (isDateInPast(scheduleForm.WorkDate)) {
      setError("Không thể xếp ca trong quá khứ. Vui lòng chọn ngày hôm nay hoặc tương lai.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await axiosClient.post(
        "/api/staff-schedules",
        {
          UserID: scheduleForm.UserID,
          WorkDate: scheduleForm.WorkDate,
          ShiftID: scheduleForm.ShiftID,
          CapacityWeight: 1,
        },
        { headers: getAuthHeader() }
      );

      if (res.data?.success) {
        setSuccess("Xếp ca thành công!");
        setOpenAssignModal(false);
        await loadSchedules();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.data?.message || "Xếp ca thất bại");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (schedule: StaffSchedule) => {
    // Validate: không cho xóa lịch trong quá khứ
    if (isDateInPast(schedule.WorkDate)) {
      setError("Không thể xóa lịch trong quá khứ.");
      return;
    }
    if (!confirm("Xóa lịch này?")) return;
    setDeletingSchedule(schedule.ScheduleID);

    try {
      const res = await axiosClient.delete(`/api/staff-schedules/${schedule.ScheduleID}`, {
        headers: getAuthHeader(),
      });
      if (res.data?.success) {
        setSuccess("Xóa lịch thành công!");
        await loadSchedules();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(res.data?.message || "Xóa thất bại");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingSchedule(null);
    }
  };

  // Filter schedules by selected date
  const getSchedulesOfShift = (shiftId: number) => {
    return schedules.filter(
      (s) => s.ShiftID === shiftId && normalizeDate(s.WorkDate) === selectedDate
    );
  };

  const getAvailableStaffForShift = (shiftId: number) => {
    const assignedUserIds = getSchedulesOfShift(shiftId).map((s) => s.UserID);
    return staffList.filter((staff) => !assignedUserIds.includes(staff.UserID));
  };

  const getSchedulesByDate = () => {
    const result: Record<number, StaffSchedule[]> = {};
    shifts.forEach((shift) => {
      result[shift.ShiftID] = getSchedulesOfShift(shift.ShiftID);
    });
    return result;
  };

  const schedulesByShift = getSchedulesByDate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Xếp lịch Ca làm việc</h1>
        <p className="mt-1 text-sm text-slate-500">
          Chọn ca và xếp nhân viên vào ca làm việc cho chi nhánh của bạn.
        </p>
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

      {/* Date Picker */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="text-slate-500" size={20} />
            <span className="text-sm font-medium text-slate-600">Chọn ngày xem/sắp xếp lịch:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={loadAll}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Shifts Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center text-slate-500">
          <Loader2 className="mr-2 animate-spin" size={24} />
          Đang tải...
        </div>
      ) : shifts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-300 p-10 text-slate-500">
          <Clock size={40} className="text-slate-300" />
          <p className="text-lg font-medium">Chưa có ca làm việc nào</p>
          <p className="text-sm">Liên hệ Admin để tạo ca làm việc.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {shifts.map((shift) => {
            const shiftSchedules = schedulesByShift[shift.ShiftID] || [];
            const availableStaff = getAvailableStaffForShift(shift.ShiftID);

            return (
              <div
                key={shift.ShiftID}
                className="rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                {/* Shift Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-4">
                  <div>
                    <h3 className="font-semibold text-slate-800">{shift.ShiftName}</h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                      <Clock size={14} />
                      {formatTime(shift.StartTime)} - {formatTime(shift.EndTime)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      shift.Status === "Active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {shift.Status === "Active" ? "Đang áp dụng" : "Ngừng"}
                  </span>
                </div>

                {/* Assigned Staff */}
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">
                      Nhân viên ngày {formatDate(selectedDate)}
                    </span>
                    <span className="text-sm text-slate-500">
                      {shiftSchedules.length} người
                    </span>
                  </div>

                  {shiftSchedules.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-500">
                      Chưa có nhân viên
                    </div>
                  ) : (
                    <div className="mb-3 space-y-2">
                      {shiftSchedules.map((schedule) => (
                        <div
                          key={schedule.ScheduleID}
                          className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
                              {schedule.Users?.FullName?.charAt(0) || "?"}
                            </div>
                            <span className="text-sm font-medium text-slate-700">
                              {schedule.Users?.FullName || `Staff #${schedule.UserID}`}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteSchedule(schedule)}
                            disabled={
                              deletingSchedule === schedule.ScheduleID ||
                              isDateInPast(schedule.WorkDate)
                            }
                            title={
                              isDateInPast(schedule.WorkDate)
                                ? "Không thể xóa lịch trong quá khứ"
                                : "Xóa lịch"
                            }
                            className="rounded p-1 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Assign Button */}
                  <button
                    onClick={() => openAssignModalFn(shift)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition hover:border-blue-400 hover:bg-blue-100"
                  >
                    <Users size={16} />
                    Xếp nhân viên
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Assign Staff */}
      {openAssignModal && selectedShiftForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-semibold">Xếp nhân viên vào ca</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {selectedShiftForAssign.ShiftName} ({formatTime(selectedShiftForAssign.StartTime)} -{" "}
                  {formatTime(selectedShiftForAssign.EndTime)})
                </p>
              </div>
              <button
                onClick={() => setOpenAssignModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignStaff} className="p-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Ngày làm việc *</label>
                <input
                  type="date"
                  value={scheduleForm.WorkDate}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, WorkDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Chọn nhân viên *</label>
                <select
                  value={scheduleForm.UserID}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, UserID: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value={0}>-- Chọn nhân viên --</option>
                  {staffList.map((staff) => (
                    <option key={staff.UserID} value={staff.UserID}>
                      {staff.FullName} {staff.Phone ? ` - ${staff.Phone}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {scheduleForm.UserID > 0 && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="text-sm text-blue-700">
                    <CalendarCheck size={14} className="inline mr-1" />
                    Nhân viên sẽ được xếp vào ca{" "}
                    <b>{selectedShiftForAssign.ShiftName}</b> ngày{" "}
                    <b>{formatDate(scheduleForm.WorkDate)}</b>
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenAssignModal(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving || scheduleForm.UserID === 0}
                  className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Đang xếp..." : "Xếp ca"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerShifts;
