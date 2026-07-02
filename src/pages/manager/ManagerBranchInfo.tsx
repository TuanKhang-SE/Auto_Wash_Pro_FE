import { useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import axiosClient, { getErrorMessage } from "../../api/axiosClient";

interface BranchInfo {
  BranchID: number;
  BranchName: string;
  Address: string | null;
  Phone: string | null;
  OpenTime: string | null;
  CloseTime: string | null;
  BankAccount: string | null;
  Status: string | null;
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

interface Shift {
  ShiftID: number;
  ShiftName: string;
  StartTime: string | null;
  EndTime: string | null;
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
    BranchID: number | null;
  } | null;
  Shifts?: {
    ShiftName: string;
    StartTime: string | null;
    EndTime: string | null;
  } | null;
}

const getAuthHeader = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const getBranchIdFromLocalStorage = () => {
  const userText = localStorage.getItem("user");

  if (!userText) {
    return null;
  }

  try {
    const user = JSON.parse(userText);

    const branchId =
      user.branchId ||
      user.BranchID ||
      user.branchID ||
      user.BranchId ||
      null;

    return branchId ? Number(branchId) : null;
  } catch {
    return null;
  }
};

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getToday = () => {
  return formatDateInput(new Date());
};

const formatTime = (value: string | null) => {
  if (!value) return "Chưa có";

  const match = value.match(/T(\d{2}:\d{2})/);

  if (match) {
    return match[1];
  }

  return value.slice(0, 5);
};

const formatDate = (dateText: string) => {
  const [year, month, day] = dateText.split("-");

  if (!year || !month || !day) {
    return dateText;
  }

  return `${day}/${month}/${year}`;
};

const normalizeDate = (dateText: string) => {
  return dateText.slice(0, 10);
};

const ManagerBranchInfo = () => {
  const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null);

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [shiftList, setShiftList] = useState<Shift[]>([]);
  const [scheduleList, setScheduleList] = useState<StaffSchedule[]>([]);

  const [selectedDate, setSelectedDate] = useState(getToday());

  const [selectedStaffByShift, setSelectedStaffByShift] = useState<
    Record<number, string>
  >({});

  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [savingShiftId, setSavingShiftId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadPageData();
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [selectedDate]);

  const loadPageData = async () => {
    setIsPageLoading(true);
    setError("");

    try {
      await Promise.all([loadBranchInfo(), loadStaffList(), loadShiftList()]);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setIsPageLoading(false);
    }
  };

  const loadBranchInfo = async () => {
    const branchId = getBranchIdFromLocalStorage();

    if (!branchId) {
      setError("Tài khoản Manager này chưa được gán chi nhánh.");
      return;
    }

    const response = await axiosClient.get(`/api/branches/${branchId}`, {
      headers: getAuthHeader(),
    });

    if (response.data?.success) {
      setBranchInfo(response.data.data);
    }
  };

  const loadStaffList = async () => {
    const response = await axiosClient.get("/api/users", {
      params: {
        Role: "Staff",
        Status: "Active",
      },
      headers: getAuthHeader(),
    });

    if (response.data?.success) {
      setStaffList(response.data.data);
    }
  };

  const loadShiftList = async () => {
    const response = await axiosClient.get("/api/shifts", {
      params: {
        Status: "Active",
      },
      headers: getAuthHeader(),
    });

    if (response.data?.success) {
      setShiftList(response.data.data);
    }
  };

  const loadSchedules = async () => {
    setIsScheduleLoading(true);
    setError("");

    try {
      const response = await axiosClient.get("/api/staff-schedules", {
        params: {
          from: selectedDate,
          to: selectedDate,
          Status: "Active",
        },
        headers: getAuthHeader(),
      });

      if (response.data?.success) {
        setScheduleList(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setIsScheduleLoading(false);
    }
  };

  const getSchedulesOfShift = (shiftId: number) => {
    return scheduleList.filter((schedule) => {
      const isSameShift = schedule.ShiftID === shiftId;
      const isSameDate = normalizeDate(schedule.WorkDate) === selectedDate;
      const isActive = schedule.Status === "Active";

      return isSameShift && isSameDate && isActive;
    });
  };

  const getAvailableStaffOfShift = (shiftId: number) => {
    const schedulesOfThisShift = getSchedulesOfShift(shiftId);

    const assignedStaffIds = schedulesOfThisShift.map((item) => item.UserID);

    return staffList.filter((staff) => {
      return !assignedStaffIds.includes(staff.UserID);
    });
  };

  const handleSelectStaff = (shiftId: number, staffId: string) => {
    setSelectedStaffByShift((oldValue) => ({
      ...oldValue,
      [shiftId]: staffId,
    }));

    setError("");
    setSuccess("");
  };

  const handleAssignStaff = async (shiftId: number) => {
    const staffId = Number(selectedStaffByShift[shiftId]);

    if (!staffId) {
      setError("Bạn cần chọn nhân viên trước.");
      return;
    }

    setSavingShiftId(shiftId);
    setError("");
    setSuccess("");

    try {
      const response = await axiosClient.post(
        "/api/staff-schedules",
        {
          UserID: staffId,
          WorkDate: selectedDate,
          ShiftID: shiftId,
          CapacityWeight: 1,
        },
        {
          headers: getAuthHeader(),
        }
      );

      if (response.data?.success) {
        setSuccess("Xếp ca thành công.");

        setSelectedStaffByShift((oldValue) => ({
          ...oldValue,
          [shiftId]: "",
        }));

        await loadSchedules();
      }
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setSavingShiftId(null);
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa lịch này không?");

    if (!confirmDelete) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await axiosClient.delete(
        `/api/staff-schedules/${scheduleId}`,
        {
          headers: getAuthHeader(),
        }
      );

      if (response.data?.success) {
        setSuccess("Xóa lịch thành công.");
        await loadSchedules();
      }
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    }
  };

  if (isPageLoading && !branchInfo) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!branchInfo) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        Không tìm thấy thông tin chi nhánh của Manager.
      </div>
    );
  }

  const totalAssignedToday = scheduleList.filter((schedule) => {
    return normalizeDate(schedule.WorkDate) === selectedDate;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Thông tin chi nhánh
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manager chỉ xem và xếp lịch cho chi nhánh của mình.
        </p>
      </div>

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

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2">
            <Building2 className="text-blue-600" size={24} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {branchInfo.BranchName}
            </h2>

            <p className="text-sm text-slate-500">
              Trạng thái: {branchInfo.Status || "Chưa có"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
              <MapPin size={16} />
              Địa chỉ
            </div>

            <p className="font-medium text-slate-800">
              {branchInfo.Address || "Chưa cập nhật"}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
              <Phone size={16} />
              Số điện thoại
            </div>

            <p className="font-medium text-slate-800">
              {branchInfo.Phone || "Chưa cập nhật"}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
              <Clock size={16} />
              Giờ mở cửa
            </div>

            <p className="font-medium text-slate-800">
              {formatTime(branchInfo.OpenTime)}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
              <Clock size={16} />
              Giờ đóng cửa
            </div>

            <p className="font-medium text-slate-800">
              {formatTime(branchInfo.CloseTime)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <CalendarDays className="text-purple-600" size={24} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Lịch ca nhân viên
              </h2>

              <p className="text-sm text-slate-500">
                Xem nhân viên theo ca và xếp staff vào ca làm.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadSchedules}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Làm mới
          </button>
        </div>

        <div className="mb-5">
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Chọn ngày xem lịch
          </label>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm text-blue-600">
              <Building2 size={16} />
              Chi nhánh
            </div>

            <p className="font-semibold text-slate-800">
              {branchInfo.BranchName}
            </p>
          </div>

          <div className="rounded-lg bg-green-50 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm text-green-600">
              <Users size={16} />
              Số staff
            </div>

            <p className="font-semibold text-slate-800">
              {staffList.length} nhân viên
            </p>
          </div>

          <div className="rounded-lg bg-purple-50 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm text-purple-600">
              <UserPlus size={16} />
              Đã xếp ngày {formatDate(selectedDate)}
            </div>

            <p className="font-semibold text-slate-800">
              {totalAssignedToday} lịch
            </p>
          </div>
        </div>

        {isScheduleLoading ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 p-8 text-slate-500">
            <Loader2 className="mr-2 animate-spin" size={20} />
            Đang tải lịch làm việc...
          </div>
        ) : shiftList.length === 0 ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
            Chưa có ca làm việc nào. Ca làm do Admin tạo.
          </div>
        ) : staffList.length === 0 ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
            Chi nhánh này chưa có nhân viên Staff.
          </div>
        ) : (
          <div className="space-y-4">
            {shiftList.map((shift) => {
              const schedulesOfThisShift = getSchedulesOfShift(shift.ShiftID);
              const availableStaffOfThisShift = getAvailableStaffOfShift(
                shift.ShiftID
              );
              const isSaving = savingShiftId === shift.ShiftID;

              return (
                <div
                  key={shift.ShiftID}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {shift.ShiftName}
                      </h3>

                      <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                        <Clock size={14} />
                        {formatTime(shift.StartTime)} -{" "}
                        {formatTime(shift.EndTime)}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-white px-3 py-1 text-sm text-slate-600">
                      {schedulesOfThisShift.length} nhân viên
                    </span>
                  </div>

                  {schedulesOfThisShift.length === 0 ? (
                    <div className="mb-4 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
                      Chưa có nhân viên trong ca này.
                    </div>
                  ) : (
                    <div className="mb-4 space-y-2">
                      {schedulesOfThisShift.map((schedule) => (
                        <div
                          key={schedule.ScheduleID}
                          className="flex items-center justify-between rounded-lg bg-white p-3"
                        >
                          <div>
                            <p className="font-medium text-slate-800">
                              {schedule.Users?.FullName ||
                                `Staff #${schedule.UserID}`}
                            </p>

                            <p className="text-sm text-slate-500">
                              {schedule.Users?.Phone || "Chưa có SĐT"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteSchedule(schedule.ScheduleID)
                            }
                            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                            Xóa
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-3 rounded-lg bg-white p-3 md:grid-cols-[1fr_auto]">
                    <select
                      value={selectedStaffByShift[shift.ShiftID] || ""}
                      onChange={(e) =>
                        handleSelectStaff(shift.ShiftID, e.target.value)
                      }
                      disabled={availableStaffOfThisShift.length === 0}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {availableStaffOfThisShift.length === 0
                          ? "Tất cả staff đã được xếp vào ca này"
                          : "Chọn nhân viên"}
                      </option>

                      {availableStaffOfThisShift.map((staff) => (
                        <option key={staff.UserID} value={staff.UserID}>
                          ID {staff.UserID} - {staff.FullName}
                          {staff.Phone ? ` - ${staff.Phone}` : ""}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleAssignStaff(shift.ShiftID)}
                      disabled={
                        isSaving || availableStaffOfThisShift.length === 0
                      }
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSaving ? "Đang xếp..." : "Xếp ca"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerBranchInfo;