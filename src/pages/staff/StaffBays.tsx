import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Building2,
  CalendarClock,
  CalendarDays,
  Clock3,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";
import axiosClient, { getErrorMessage } from "../../api/axiosClient";

type Branch = {
  BranchID: number;
  BranchName: string;
  Address?: string | null;
  Phone?: string | null;
  OpenTime?: string | null;
  CloseTime?: string | null;
  Status?: string | null;
};

type AvailableSlot = {
  StartTime: string;
  EndTime: string;
  ShiftName?: string | null;
  StaffCount: number;
  MaxCapacity: number;
  Booked: number;
  Available: number;
  Status: "Available" | "Full" | string;
};

type AvailableSlotData = {
  BranchID: number;
  BookingDate: string;
  TotalWashBays: number;
  SlotDuration: number;
  BufferMinutes: number;
  Slots: AvailableSlot[];
};

type ViewMode = "day" | "month";

type MonthlyDaySummary = {
  date: string;
  totalSlots: number;
  totalCapacity: number;
  booked: number;
  available: number;
  maxStaffCount: number;
  hasSchedule: boolean;
  failed?: boolean;
};

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDatesInMonth(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return [];
  }

  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${year}-${String(month).padStart(2, "0")}-${day}`;
  });
}

function formatDateLabel(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("vi-VN");
}

function formatMonthLabel(monthValue: string) {
  const date = new Date(`${monthValue}-01T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return monthValue;
  }

  return date.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });
}

function formatTime(value: string | null | undefined) {
  if (!value) {
    return "--:--";
  }

  const text = String(value);

  if (text.includes("T") && text.length >= 16) {
    return text.substring(11, 16);
  }

  return text.substring(0, 5);
}

function decodeBranchIdFromToken(token: string) {
  try {
    const payloadPart = token.split(".")[1];

    if (!payloadPart) {
      return null;
    }

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      Math.ceil(normalized.length / 4) * 4,
      "="
    );

    const payload = JSON.parse(window.atob(padded)) as {
      branchId?: number | string | null;
      BranchID?: number | string | null;
      branchID?: number | string | null;
    };

    const branchId = Number(
      payload.branchId ?? payload.BranchID ?? payload.branchID
    );

    return Number.isInteger(branchId) && branchId > 0 ? branchId : null;
  } catch {
    return null;
  }
}

function getStaffBranchId(token: string) {
  try {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const user = JSON.parse(storedUser) as {
        branchId?: number | string | null;
        BranchID?: number | string | null;
        branchID?: number | string | null;
        user?: {
          branchId?: number | string | null;
          BranchID?: number | string | null;
        };
      };

      const branchId = Number(
        user.branchId ??
          user.BranchID ??
          user.branchID ??
          user.user?.branchId ??
          user.user?.BranchID
      );

      if (Number.isInteger(branchId) && branchId > 0) {
        return branchId;
      }
    }
  } catch {
    // Nếu localStorage lỗi thì tiếp tục đọc BranchID từ JWT.
  }

  return decodeBranchIdFromToken(token);
}

function StaffBays() {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [slotData, setSlotData] = useState<AvailableSlotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateValue());
  const [selectedMonth, setSelectedMonth] = useState(() =>
    getLocalDateValue().slice(0, 7)
  );

  const [monthlyData, setMonthlyData] = useState<MonthlyDaySummary[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  const dayRequestRunningRef = useRef(false);
  const monthRequestRunningRef = useRef(false);
  const today = getLocalDateValue();

  const getBranchId = useCallback(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return null;
    }

    return getStaffBranchId(token);
  }, []);

  const loadDayData = useCallback(
    async (silent = false) => {
      if (dayRequestRunningRef.current) {
        return;
      }

      const branchId = getBranchId();

      if (!branchId) {
        setMessage(
          "Không tìm thấy chi nhánh của nhân viên. Hãy đăng xuất và đăng nhập lại."
        );
        setLoading(false);
        return;
      }

      dayRequestRunningRef.current = true;

      if (!silent) {
        setLoading(true);
      }

      setRefreshing(true);
      setMessage("");

      try {
        const [branchResponse, slotResponse] = await Promise.all([
          axiosClient.get(`/api/branches/${branchId}`, {
            params: {
              refreshTime: Date.now(),
            },
          }),
          axiosClient.get("/api/bookings/available-slots", {
            params: {
              BranchID: branchId,
              BookingDate: selectedDate,
              refreshTime: Date.now(),
            },
          }),
        ]);

        setBranch(branchResponse.data?.data || null);
        setSlotData(slotResponse.data?.data || null);
        setLastUpdated(new Date());
      } catch (error: unknown) {
        console.log("LOAD STAFF SLOT DATA ERROR:", error);
        setMessage(getErrorMessage(error));
      } finally {
        dayRequestRunningRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getBranchId, selectedDate]
  );

  const loadMonthData = useCallback(async () => {
    if (monthRequestRunningRef.current) {
      return;
    }

    const branchId = getBranchId();

    if (!branchId) {
      setMessage(
        "Không tìm thấy chi nhánh của nhân viên. Hãy đăng xuất và đăng nhập lại."
      );
      return;
    }

    const dates = getDatesInMonth(selectedMonth);

    monthRequestRunningRef.current = true;
    setMonthlyLoading(true);
    setRefreshing(true);
    setMessage("");

    try {
      if (!branch) {
        const branchResponse = await axiosClient.get(
          `/api/branches/${branchId}`,
          {
            params: {
              refreshTime: Date.now(),
            },
          }
        );

        setBranch(branchResponse.data?.data || null);
      }

      const results: MonthlyDaySummary[] = [];
      const batchSize = 5;

      for (let index = 0; index < dates.length; index += batchSize) {
        const batch = dates.slice(index, index + batchSize);

        const batchResults = await Promise.all(
          batch.map(async (dateValue): Promise<MonthlyDaySummary> => {
            try {
              const response = await axiosClient.get(
                "/api/bookings/available-slots",
                {
                  params: {
                    BranchID: branchId,
                    BookingDate: dateValue,
                    refreshTime: Date.now(),
                  },
                }
              );

              const data = response.data?.data as
                | AvailableSlotData
                | undefined;

              const slots = data?.Slots || [];

              return {
                date: dateValue,
                totalSlots: slots.length,
                totalCapacity: slots.reduce(
                  (sum, slot) => sum + Number(slot.MaxCapacity || 0),
                  0
                ),
                booked: slots.reduce(
                  (sum, slot) => sum + Number(slot.Booked || 0),
                  0
                ),
                available: slots.reduce(
                  (sum, slot) => sum + Number(slot.Available || 0),
                  0
                ),
                maxStaffCount: slots.reduce(
                  (maximum, slot) =>
                    Math.max(maximum, Number(slot.StaffCount || 0)),
                  0
                ),
                hasSchedule: slots.length > 0,
              };
            } catch (error) {
              console.log(`LOAD MONTH SLOT ${dateValue} ERROR:`, error);

              return {
                date: dateValue,
                totalSlots: 0,
                totalCapacity: 0,
                booked: 0,
                available: 0,
                maxStaffCount: 0,
                hasSchedule: false,
                failed: true,
              };
            }
          })
        );

        results.push(...batchResults);
      }

      setMonthlyData(results);
      setLastUpdated(new Date());
    } catch (error: unknown) {
      console.log("LOAD MONTH SLOT DATA ERROR:", error);
      setMessage(getErrorMessage(error));
    } finally {
      monthRequestRunningRef.current = false;
      setMonthlyLoading(false);
      setRefreshing(false);
    }
  }, [branch, getBranchId, selectedMonth]);

  useEffect(() => {
    if (viewMode === "day") {
      void loadDayData(false);
    }
  }, [loadDayData, viewMode]);

  useEffect(() => {
    if (viewMode === "month") {
      void loadMonthData();
    }
  }, [loadMonthData, viewMode]);

  useEffect(() => {
    if (viewMode !== "day") {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadDayData(true);
      }
    }, 5000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadDayData(true);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [loadDayData, viewMode]);

  const slots = useMemo(() => slotData?.Slots || [], [slotData]);

  const dayTotals = useMemo(() => {
    return slots.reduce(
      (summary, slot) => {
        summary.booked += Number(slot.Booked || 0);
        summary.available += Number(slot.Available || 0);
        summary.capacity += Number(slot.MaxCapacity || 0);
        return summary;
      },
      {
        booked: 0,
        available: 0,
        capacity: 0,
      }
    );
  }, [slots]);

  const monthlyTotals = useMemo(() => {
    return monthlyData.reduce(
      (summary, day) => {
        summary.daysWithSchedule += day.hasSchedule ? 1 : 0;
        summary.totalSlots += day.totalSlots;
        summary.booked += day.booked;
        summary.available += day.available;
        return summary;
      },
      {
        daysWithSchedule: 0,
        totalSlots: 0,
        booked: 0,
        available: 0,
      }
    );
  }, [monthlyData]);

  const firstDayOffset = useMemo(() => {
    const firstDay = new Date(`${selectedMonth}-01T00:00:00`).getDay();
    return (firstDay + 6) % 7;
  }, [selectedMonth]);

  if (loading && viewMode === "day") {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            className="mx-auto animate-spin text-blue-600"
            size={30}
          />

          <p className="mt-3 text-sm font-medium text-slate-500">
            Đang tải lịch slot từ hệ thống...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Lịch Slot Rửa Xe
          </h1>

          <p className="mt-2 text-slate-500">
            Theo dõi các khung giờ còn trống của chi nhánh theo ngày hoặc theo
            tháng.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            viewMode === "day"
              ? void loadDayData(false)
              : void loadMonthData()
          }
          disabled={refreshing}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
          />

          {refreshing ? "Đang cập nhật..." : "Làm mới dữ liệu"}
        </button>
      </div>

      {message && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <span>{message}</span>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-blue-500/20">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
              <Building2 size={30} />
            </div>

            <div>
              <p className="text-sm font-medium text-blue-100">
                Chi nhánh của nhân viên
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {branch?.BranchName || "Chưa cập nhật chi nhánh"}
              </h2>

              <div className="mt-3 flex items-start gap-2 text-sm text-blue-100">
                <MapPin size={17} className="mt-0.5 shrink-0" />
                <span>{branch?.Address || "Chưa cập nhật địa chỉ"}</span>
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm text-blue-100">
                <Clock3 size={17} />
                <span>
                  Hoạt động từ {formatTime(branch?.OpenTime)} đến{" "}
                  {formatTime(branch?.CloseTime)}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full rounded-2xl bg-white/10 p-4 backdrop-blur-sm xl:w-[610px]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-medium text-blue-100">
                  Bộ lọc theo dõi
                </p>

                <div className="mt-2 inline-flex rounded-lg bg-white/10 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("day")}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                      viewMode === "day"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    Theo ngày
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("month")}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                      viewMode === "month"
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    Theo tháng
                  </button>
                </div>
              </div>

              <div className="min-w-0 lg:w-56">
                <label
                  htmlFor={
                    viewMode === "day" ? "selectedDate" : "selectedMonth"
                  }
                  className="mb-1 block text-xs font-medium text-blue-100"
                >
                  {viewMode === "day" ? "Ngày theo dõi" : "Tháng theo dõi"}
                </label>

                {viewMode === "day" ? (
                  <input
                    id="selectedDate"
                    type="date"
                    value={selectedDate}
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                      setSelectedMonth(event.target.value.slice(0, 7));
                    }}
                    className="w-full rounded-lg border border-white/30 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-white/20"
                  />
                ) : (
                  <input
                    id="selectedMonth"
                    type="month"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="w-full rounded-lg border border-white/30 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-white/20"
                  />
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-xs text-blue-100">
                  {viewMode === "day" ? "Tổng slot" : "Ngày có lịch"}
                </p>
                <p className="mt-1 text-xl font-bold">
                  {viewMode === "day"
                    ? slots.length
                    : monthlyTotals.daysWithSchedule}
                </p>
              </div>

              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-xs text-blue-100">Đã đặt</p>
                <p className="mt-1 text-xl font-bold">
                  {viewMode === "day" ? dayTotals.booked : monthlyTotals.booked}
                </p>
              </div>

              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-xs text-blue-100">Chỗ còn trống</p>
                <p className="mt-1 text-xl font-bold">
                  {viewMode === "day"
                    ? dayTotals.available
                    : monthlyTotals.available}
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-blue-100">
              Cập nhật gần nhất:{" "}
              {lastUpdated
                ? lastUpdated.toLocaleTimeString("vi-VN")
                : "--:--:--"}
            </p>
          </div>
        </div>
      </section>

      {viewMode === "month" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
                <CalendarDays size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Tổng quan {formatMonthLabel(selectedMonth)}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Bấm vào một ngày để xem toàn bộ slot theo giờ của ngày đó.
                </p>
              </div>
            </div>

            {monthlyLoading && (
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <RefreshCw size={16} className="animate-spin" />
                Đang tải dữ liệu tháng...
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-indigo-50 p-4">
              <p className="text-xs text-slate-500">Ngày có lịch làm việc</p>
              <p className="mt-1 text-2xl font-bold text-indigo-700">
                {monthlyTotals.daysWithSchedule}
              </p>
            </div>

            <div className="rounded-xl bg-violet-50 p-4">
              <p className="text-xs text-slate-500">Tổng số slot</p>
              <p className="mt-1 text-2xl font-bold text-violet-700">
                {monthlyTotals.totalSlots}
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-xs text-slate-500">Tổng lượt đã đặt</p>
              <p className="mt-1 text-2xl font-bold text-blue-700">
                {monthlyTotals.booked}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs text-slate-500">Tổng chỗ còn trống</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {monthlyTotals.available}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(
              (dayName) => (
                <div key={dayName} className="py-2">
                  {dayName}
                </div>
              )
            )}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOffset }, (_, index) => (
              <div key={`empty-${index}`} className="min-h-28" />
            ))}

            {monthlyData.map((day) => {
              const dayNumber = Number(day.date.slice(-2));
              const isToday = day.date === today;
              const isSelected = day.date === selectedDate;

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => {
                    setSelectedDate(day.date);
                    setSelectedMonth(day.date.slice(0, 7));
                    setViewMode("day");
                  }}
                  className={`min-h-28 rounded-xl border p-2 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    day.failed
                      ? "border-red-200 bg-red-50"
                      : day.hasSchedule
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                  } ${isToday ? "ring-2 ring-blue-400" : ""} ${
                    isSelected ? "shadow-md" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {dayNumber}
                    </span>

                    {isToday && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        Hôm nay
                      </span>
                    )}
                  </div>

                  {day.failed ? (
                    <p className="mt-3 text-[11px] font-semibold text-red-600">
                      Không tải được
                    </p>
                  ) : day.hasSchedule ? (
                    <div className="mt-3 space-y-1 text-[11px]">
                      <p className="font-semibold text-indigo-700">
                        {day.totalSlots} slot
                      </p>
                      <p className="text-blue-700">Đã đặt: {day.booked}</p>
                      <p className="text-emerald-700">
                        Trống: {day.available}
                      </p>
                      <p className="text-slate-500">
                        Tối đa {day.maxStaffCount} nhân viên/slot
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] text-slate-400">
                      Không có ca hoặc không còn slot
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
                <CalendarClock size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Slot ngày {formatDateLabel(selectedDate)}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Hiển thị toàn bộ khung giờ API trả về đến cuối ca làm việc.
                </p>
              </div>
            </div>

            <span className="w-fit rounded-full bg-indigo-100 px-3 py-1.5 text-sm font-semibold text-indigo-700">
              {slots.length} slot
            </span>
          </div>

          {slots.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <CalendarClock className="mx-auto text-slate-400" size={34} />

              <p className="mt-3 font-semibold text-slate-700">
                Không có slot trong ngày này
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Ngày này chưa có lịch làm việc hoặc toàn bộ khung giờ đã qua.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {slots.map((slot) => {
                const total = Math.max(
                  0,
                  Number(slot.MaxCapacity || slotData?.TotalWashBays || 0)
                );

                const available = Math.max(0, Number(slot.Available || 0));
                const booked = Math.max(0, Number(slot.Booked || 0));
                const percentage =
                  total > 0 ? Math.round((available / total) * 100) : 0;
                const isFull = available === 0 || slot.Status === "Full";

                return (
                  <article
                    key={`${slot.StartTime}-${slot.EndTime}-${slot.ShiftName || "shift"}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Clock3 size={18} className="text-indigo-500" />

                        <p className="text-lg font-bold text-slate-800">
                          {formatTime(slot.StartTime)} - {formatTime(slot.EndTime)}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                          isFull
                            ? "bg-red-100 text-red-600"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {isFull ? "Đã đầy" : `${available} chỗ trống`}
                      </span>
                    </div>

                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          percentage >= 50
                            ? "bg-emerald-500"
                            : percentage > 0
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Đã đặt</p>
                        <p className="mt-1 font-bold text-slate-800">
                          {booked}/{total}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Nhân viên</p>
                        <p className="mt-1 flex items-center gap-1 font-bold text-slate-800">
                          <Users size={14} /> {Number(slot.StaffCount || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <span className="text-xs font-semibold text-indigo-600">
                        {slot.ShiftName || "Chưa cập nhật ca"}
                      </span>

                      <span className="text-xs text-slate-500">
                        Còn {available}/{total} vị trí
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default StaffBays;