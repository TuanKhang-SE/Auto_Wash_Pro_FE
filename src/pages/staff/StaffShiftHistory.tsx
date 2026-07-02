import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ListChecks,
  Loader2,
  RefreshCw,
  Timer,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

interface StaffSchedule {
  ScheduleID: number;
  UserID: number;
  WorkDate: string;
  ShiftID: number;
  CapacityWeight: number | string | null;
  Status: string;
  Shifts?: {
    ShiftName: string;
    StartTime: string | null;
    EndTime: string | null;
  } | null;
}

type ShiftStatus = "done" | "current" | "future";
type TabType = "all" | "done" | "current" | "future";

interface ScheduleItem extends StaffSchedule {
  viewStatus: ShiftStatus;
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

const getErrorMessage = (error: unknown) => {
  const err = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
    message?: string;
  };

  return err.response?.data?.message || err.message || "Có lỗi xảy ra.";
};

const getDateOnly = (value: string) => {
  return value.slice(0, 10);
};

const formatDate = (value: string) => {
  const dateText = getDateOnly(value);
  const [year, month, day] = dateText.split("-");

  if (!year || !month || !day) {
    return dateText;
  }

  return `${day}/${month}/${year}`;
};

const formatTime = (value: string | null | undefined) => {
  if (!value) return "--:--";

  if (value.includes("T")) {
    return value.slice(11, 16);
  }

  return value.slice(0, 5);
};

const makeDateTime = (dateText: string, timeText: string) => {
  return new Date(`${dateText}T${timeText}:00`);
};

const getStartDateTime = (schedule: StaffSchedule) => {
  const dateText = getDateOnly(schedule.WorkDate);
  const startTime = formatTime(schedule.Shifts?.StartTime);

  return makeDateTime(dateText, startTime);
};

const getEndDateTime = (schedule: StaffSchedule) => {
  const dateText = getDateOnly(schedule.WorkDate);
  const startDate = getStartDateTime(schedule);
  const endTime = formatTime(schedule.Shifts?.EndTime);
  const endDate = makeDateTime(dateText, endTime);

  if (endDate <= startDate) {
    endDate.setDate(endDate.getDate() + 1);
  }

  return endDate;
};

const getViewStatus = (schedule: StaffSchedule): ShiftStatus => {
  const now = new Date();
  const startDate = getStartDateTime(schedule);
  const endDate = getEndDateTime(schedule);

  if (now < startDate) {
    return "future";
  }

  if (now >= startDate && now <= endDate) {
    return "current";
  }

  return "done";
};

const getStatusText = (status: ShiftStatus) => {
  if (status === "done") return "Đã làm";
  if (status === "current") return "Đang làm";
  return "Sắp làm";
};

const getStatusClass = (status: ShiftStatus) => {
  if (status === "done") {
    return "bg-green-100 text-green-700";
  }

  if (status === "current") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-yellow-100 text-yellow-700";
};

const StaffShiftHistory = () => {
  const [scheduleList, setScheduleList] = useState<StaffSchedule[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadMySchedules();
  }, []);

  const loadMySchedules = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await axiosClient.get("/api/staff-schedules", {
        params: {
          Status: "Active",
        },
        headers: getAuthHeader(),
      });

      if (response.data?.success) {
        setScheduleList(response.data.data || []);
      } else {
        setMessage(response.data?.message || "Không tải được lịch ca.");
      }
    } catch (error) {
      console.error(error);
      setMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const schedulesWithStatus: ScheduleItem[] = scheduleList.map((schedule) => {
    return {
      ...schedule,
      viewStatus: getViewStatus(schedule),
    };
  });

  const doneCount = schedulesWithStatus.filter((item) => {
    return item.viewStatus === "done";
  }).length;

  const futureCount = schedulesWithStatus.filter((item) => {
    return item.viewStatus === "future";
  }).length;

  const filteredSchedules = schedulesWithStatus.filter((schedule) => {
    if (activeTab === "all") return true;
    return schedule.viewStatus === activeTab;
  });

  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    const aStart = getStartDateTime(a).getTime();
    const bStart = getStartDateTime(b).getTime();

    if (a.viewStatus === "current" && b.viewStatus !== "current") return -1;
    if (a.viewStatus !== "current" && b.viewStatus === "current") return 1;

    if (a.viewStatus === "future" && b.viewStatus === "future") {
      return aStart - bStart;
    }

    return bStart - aStart;
  });

  const renderTabButton = (tab: TabType, label: string) => {
    const isActive = activeTab === tab;

    return (
      <button
        type="button"
        onClick={() => setActiveTab(tab)}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
          isActive
            ? "bg-blue-600 text-white"
            : "bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-xl shadow-blue-500/20">
        <h2 className="text-2xl font-bold">Lịch sử ca rửa</h2>

        <p className="mt-1 text-blue-100">
          Xem các ca bạn đã làm, đang làm và sẽ làm.
        </p>
      </div>

      {message && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {message}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-3">
              <ListChecks className="text-slate-600" />
            </div>

            <div>
              <p className="text-sm text-slate-500">Tổng ca</p>
              <p className="text-xl font-bold text-slate-800">
                {scheduleList.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3">
              <CheckCircle2 className="text-green-600" />
            </div>

            <div>
              <p className="text-sm text-slate-500">Đã làm</p>
              <p className="text-xl font-bold text-slate-800">{doneCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-yellow-50 p-3">
              <Timer className="text-yellow-600" />
            </div>

            <div>
              <p className="text-sm text-slate-500">Sắp làm</p>
              <p className="text-xl font-bold text-slate-800">{futureCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Danh sách ca rửa
            </h3>

            <p className="text-sm text-slate-500">
              Dữ liệu lấy từ lịch làm việc mà Manager đã xếp cho bạn.
            </p>
          </div>

          <button
            type="button"
            onClick={loadMySchedules}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        <div className="mb-5 flex flex-wrap gap-2 rounded-xl bg-slate-100 p-2">
          {renderTabButton("all", "Tất cả")}
          {renderTabButton("done", "Đã làm")}
          {renderTabButton("current", "Đang làm")}
          {renderTabButton("future", "Sắp làm")}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-500">
            <Loader2 className="mr-2 animate-spin" size={22} />
            Đang tải lịch ca...
          </div>
        ) : sortedSchedules.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Chưa có ca nào trong mục này.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSchedules.map((schedule) => (
              <div
                key={schedule.ScheduleID}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <h4 className="font-semibold text-slate-800">
                        {schedule.Shifts?.ShiftName || "Ca làm"}
                      </h4>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                          schedule.viewStatus
                        )}`}
                      >
                        {getStatusText(schedule.viewStatus)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={15} />
                        {formatDate(schedule.WorkDate)}
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock size={15} />
                        {formatTime(schedule.Shifts?.StartTime)} -{" "}
                        {formatTime(schedule.Shifts?.EndTime)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffShiftHistory;