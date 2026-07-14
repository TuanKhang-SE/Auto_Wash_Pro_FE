import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Building2,
  CalendarClock,
  Car,
  CheckCircle2,
  Clock3,
  Cpu,
  Droplets,
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

type ServiceLineItem = {
  Services?: {
    ServiceName?: string | null;
  } | null;
};

type BookingItem = {
  BookingItemID: number;
  Status: string;
  CheckInAt?: string | null;
  WashStartAt?: string | null;
  CompletedAt?: string | null;

  Vehicles?: {
    LicensePlate?: string | null;
    Brand?: string | null;
    Model?: string | null;
  } | null;

  ServiceLineItems?: ServiceLineItem[];
};

type StaffBooking = {
  BookingGroupID: number;
  BookingCode?: string | null;
  BranchID: number;
  BookingDate?: string | null;
  StartTime?: string | null;
  Status?: string | null;

  Customers?: {
    Users?: {
      FullName?: string | null;
      Phone?: string | null;
    } | null;
  } | null;

  BookingItems?: BookingItem[];
};

type ActiveWash = {
  booking: StaffBooking;
  item: BookingItem;
};

type BayView = {
  number: number;
  status: "Available" | "Occupied";
  activeWash?: ActiveWash;
};

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function addMinutesToTime(
  value: string | null | undefined,
  minutes: number
) {
  const time = formatTime(value);
  const [hours, mins] = time.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(mins)) {
    return "--:--";
  }

  const totalMinutes =
    (hours * 60 + mins + minutes) % (24 * 60);

  const resultHours = String(
    Math.floor(totalMinutes / 60)
  ).padStart(2, "0");

  const resultMinutes = String(
    totalMinutes % 60
  ).padStart(2, "0");

  return `${resultHours}:${resultMinutes}`;
}

function getServiceNames(item: BookingItem) {
  const names = (item.ServiceLineItems || [])
    .map((line) => line.Services?.ServiceName?.trim())
    .filter((name): name is string => Boolean(name));

  return names.length > 0
    ? names.join(", ")
    : "Chưa cập nhật dịch vụ";
}

function getVehicleName(item: BookingItem) {
  const name = [
    item.Vehicles?.Brand,
    item.Vehicles?.Model,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || "Chưa cập nhật xe";
}

function decodeBranchIdFromToken(token: string) {
  try {
    const payloadPart = token.split(".")[1];

    if (!payloadPart) {
      return null;
    }

    const normalized = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = normalized.padEnd(
      Math.ceil(normalized.length / 4) * 4,
      "="
    );

    const payload = JSON.parse(
      window.atob(padded)
    ) as {
      branchId?: number | string | null;
    };

    const branchId = Number(payload.branchId);

    return Number.isInteger(branchId) && branchId > 0
      ? branchId
      : null;
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
      };

      const branchId = Number(
        user.branchId ?? user.BranchID
      );

      if (
        Number.isInteger(branchId) &&
        branchId > 0
      ) {
        return branchId;
      }
    }
  } catch {
    /*
     * Nếu dữ liệu localStorage cũ bị lỗi,
     * tiếp tục đọc BranchID từ JWT.
     */
  }

  return decodeBranchIdFromToken(token);
}

function StaffBays() {
  const [branch, setBranch] =
    useState<Branch | null>(null);

  const [slotData, setSlotData] =
    useState<AvailableSlotData | null>(null);

  const [bookings, setBookings] =
    useState<StaffBooking[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [message, setMessage] = useState("");

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const requestRunningRef = useRef(false);

  const today = getLocalDateValue();

  const loadData = useCallback(
    async (silent = false) => {
      if (requestRunningRef.current) {
        return;
      }

      const token =
        localStorage.getItem("token");

      if (!token) {
        setMessage(
          "Bạn cần đăng nhập bằng tài khoản nhân viên."
        );

        setLoading(false);
        return;
      }

      const branchId =
        getStaffBranchId(token);

      if (!branchId) {
        setMessage(
          "Không tìm thấy chi nhánh của nhân viên. Hãy đăng xuất và đăng nhập lại sau khi tài khoản đã được gán chi nhánh."
        );

        setLoading(false);
        return;
      }

      requestRunningRef.current = true;

      if (!silent) {
        setLoading(true);
      }

      setRefreshing(true);
      setMessage("");

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [
          branchResponse,
          slotResponse,
          bookingResponse,
        ] = await Promise.all([
          /*
           * Lấy thông tin chi nhánh thật.
           */
          axiosClient.get(
            `/api/branches/${branchId}`,
            {
              params: {
                refreshTime: Date.now(),
              },
            }
          ),

          /*
           * Lấy TotalWashBays và slot trống thật.
           */
          axiosClient.get(
            "/api/bookings/available-slots",
            {
              params: {
                BranchID: branchId,
                BookingDate: today,
                refreshTime: Date.now(),
              },
            }
          ),

          /*
           * Lấy booking và trạng thái xe thật
           * của chi nhánh Staff.
           */
          axiosClient.get(
            "/api/staff-operations/today-bookings",
            {
              headers,

              params: {
                bookingDate: today,
                refreshTime: Date.now(),
              },
            }
          ),
        ]);

        setBranch(
          branchResponse.data?.data || null
        );

        setSlotData(
          slotResponse.data?.data || null
        );

        setBookings(
          bookingResponse.data?.data || []
        );

        setLastUpdated(new Date());
      } catch (error: unknown) {
        console.log(
          "LOAD STAFF BAYS ERROR:",
          error
        );

        setMessage(
          getErrorMessage(error)
        );
      } finally {
        requestRunningRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [today]
  );

  /*
   * Tải dữ liệu lần đầu.
   */
  useEffect(() => {
    void loadData(false);
  }, [loadData]);

  /*
   * Tự cập nhật dữ liệu sau mỗi 5 giây.
   */
  useEffect(() => {
    const intervalId =
      window.setInterval(() => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void loadData(true);
        }
      }, 5000);

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void loadData(true);
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearInterval(intervalId);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [loadData]);

  /*
   * Gom tất cả xe từ tất cả booking.
   */
  const allItems = useMemo(
    () =>
      bookings.flatMap((booking) =>
        (booking.BookingItems || []).map(
          (item) => ({
            booking,
            item,
          })
        )
      ),
    [bookings]
  );

  /*
   * Xe InProgress được xem là đang chiếm trạm.
   */
  const activeWashes = useMemo(
    () =>
      allItems
        .filter(
          ({ item }) =>
            item.Status === "InProgress"
        )
        .sort((a, b) =>
          String(
            a.item.WashStartAt || ""
          ).localeCompare(
            String(
              b.item.WashStartAt || ""
            )
          )
        ),
    [allItems]
  );

  /*
   * Xe đã check-in nhưng chưa bắt đầu rửa.
   */
  const checkedInCount = useMemo(
    () =>
      allItems.filter(
        ({ item }) =>
          item.Status === "CheckedIn"
      ).length,
    [allItems]
  );

  /*
   * Xe còn chờ check-in.
   */
  const waitingCount = useMemo(
    () =>
      allItems.filter(({ item }) =>
        [
          "Pending",
          "Confirmed",
        ].includes(item.Status)
      ).length,
    [allItems]
  );

  const totalBays = Math.max(
    0,
    Number(
      slotData?.TotalWashBays || 0
    )
  );

  const occupiedCount = Math.min(
    activeWashes.length,
    totalBays
  );

  const availableCount = Math.max(
    0,
    totalBays - occupiedCount
  );

  const overflowCount = Math.max(
    0,
    activeWashes.length - totalBays
  );

  const usagePercent =
    totalBays > 0
      ? Math.round(
        (occupiedCount / totalBays) *
        100
      )
      : 0;

  /*
   * Tạo danh sách Trạm 01, Trạm 02...
   * dựa trên TotalWashBays.
   *
   * Vì BE chưa có bảng lưu BayID,
   * xe InProgress được xếp lần lượt
   * vào từng trạm trên giao diện.
   */
  const bays = useMemo<BayView[]>(
    () =>
      Array.from(
        {
          length: totalBays,
        },
        (_, index) => ({
          number: index + 1,

          status:
            index < activeWashes.length
              ? "Occupied"
              : "Available",

          activeWash:
            activeWashes[index],
        })
      ),
    [activeWashes, totalBays]
  );

  /*
   * Chỉ hiện 8 slot gần nhất.
   */
  const upcomingSlots = useMemo(
    () =>
      (slotData?.Slots || []).slice(
        0,
        8
      ),
    [slotData]
  );

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            className="mx-auto animate-spin text-blue-600"
            size={30}
          />

          <p className="mt-3 text-sm font-medium text-slate-500">
            Đang tải dữ liệu trạm và
            slot từ hệ thống...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Trạm Rửa Xe
          </h1>

          <p className="mt-2 text-slate-500">
            Theo dõi trạm đang sử dụng
            và các slot còn trống của
            chi nhánh theo dữ liệu API.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadData(false)
          }
          disabled={refreshing}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          {refreshing
            ? "Đang cập nhật..."
            : "Làm mới dữ liệu"}
        </button>
      </div>

      {/* Lỗi */}
      {message && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle
            className="mt-0.5 shrink-0"
            size={18}
          />

          <span>{message}</span>
        </div>
      )}

      {/* Banner chi nhánh */}
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
                {branch?.BranchName ||
                  "Chưa cập nhật chi nhánh"}
              </h2>

              <div className="mt-3 flex items-start gap-2 text-sm text-blue-100">
                <MapPin
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {branch?.Address ||
                    "Chưa cập nhật địa chỉ"}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm text-blue-100">
                <Clock3 size={17} />

                <span>
                  Hoạt động từ{" "}
                  {formatTime(
                    branch?.OpenTime
                  )}{" "}
                  đến{" "}
                  {formatTime(
                    branch?.CloseTime
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-auto xl:min-w-[470px]">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium text-blue-100">
                Ngày theo dõi
              </p>

              <p className="mt-1 font-bold">
                {new Date(
                  `${today}T00:00:00`
                ).toLocaleDateString(
                  "vi-VN"
                )}
              </p>
            </div>

            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium text-blue-100">
                Chờ vào trạm
              </p>

              <p className="mt-1 text-xl font-bold">
                {checkedInCount}
              </p>
            </div>

            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium text-blue-100">
                Chờ check-in
              </p>

              <p className="mt-1 text-xl font-bold">
                {waitingCount}
              </p>
            </div>

            <p className="text-xs text-blue-100 sm:col-span-3">
              Cập nhật gần nhất:{" "}
              {lastUpdated
                ? lastUpdated.toLocaleTimeString(
                  "vi-VN"
                )
                : "--:--:--"}
            </p>
          </div>
        </div>
      </section>

      {/* Thống kê trạm */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* Tổng số trạm */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Tổng số trạm
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-800">
                {totalBays}
              </p>
            </div>

            <div className="rounded-2xl bg-violet-100 p-3 text-violet-600">
              <Cpu size={25} />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Lấy từ TotalWashBays của
            API slot
          </p>
        </div>

        {/* Trạm trống */}
        <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Trạm đang trống
              </p>

              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {availableCount}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600">
              <CheckCircle2 size={25} />
            </div>
          </div>

          <p className="mt-3 text-xs text-emerald-600">
            Có thể nhận xe vào rửa
          </p>
        </div>

        {/* Trạm đang sử dụng */}
        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Trạm đang sử dụng
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-600">
                {occupiedCount}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
              <Droplets size={25} />
            </div>
          </div>

          <p className="mt-3 text-xs text-blue-600">
            Công suất hiện tại{" "}
            {usagePercent}%
          </p>
        </div>
      </section>

      {/* Cảnh báo vượt số trạm */}
      {overflowCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle
            className="mt-0.5 shrink-0"
            size={18}
          />

          <span>
            Có {overflowCount} xe đang
            ở trạng thái Đang rửa vượt
            quá TotalWashBays. Hãy kiểm
            tra lại dữ liệu booking hoặc
            cấu hình chi nhánh.
          </span>
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
        {/* Sơ đồ trạm */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Sơ đồ trạng thái trạm
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Xe có trạng thái
                InProgress được tính là
                đang sử dụng trạm.
              </p>
            </div>

            <span className="w-fit rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
              {availableCount}/
              {totalBays} trạm trống
            </span>
          </div>

          {/* Chú thích */}
          <div className="mb-5 flex flex-wrap gap-4 rounded-xl bg-slate-50 px-4 py-3 text-xs font-medium">
            <div className="flex items-center gap-2 text-emerald-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Đang trống
            </div>

            <div className="flex items-center gap-2 text-blue-700">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              Đang sử dụng
            </div>
          </div>

          {bays.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <AlertCircle
                className="mx-auto text-amber-500"
                size={30}
              />

              <p className="mt-3 font-semibold text-slate-700">
                Chưa có cấu hình số trạm
              </p>

              <p className="mt-1 text-sm text-slate-500">
                API không trả về
                TotalWashBays cho chi
                nhánh này.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {bays.map((bay) => {
                const item =
                  bay.activeWash?.item;

                const booking =
                  bay.activeWash?.booking;

                return (
                  <article
                    key={bay.number}
                    className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${bay.status ===
                        "Available"
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-blue-200 bg-blue-50"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-white p-2.5 shadow-sm">
                          <Car
                            size={22}
                            className={
                              bay.status ===
                                "Available"
                                ? "text-emerald-600"
                                : "text-blue-600"
                            }
                          />
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-800">
                            Trạm{" "}
                            {String(
                              bay.number
                            ).padStart(
                              2,
                              "0"
                            )}
                          </h3>

                          <p
                            className={`mt-0.5 text-xs font-semibold ${bay.status ===
                                "Available"
                                ? "text-emerald-700"
                                : "text-blue-700"
                              }`}
                          >
                            {bay.status ===
                              "Available"
                              ? "Đang trống"
                              : "Đang sử dụng"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`mt-1 h-3 w-3 shrink-0 rounded-full ${bay.status ===
                            "Available"
                            ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"
                            : "bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.15)]"
                          }`}
                      />
                    </div>

                    {bay.status ===
                      "Available" ? (
                      <div className="mt-5 rounded-xl border border-emerald-200 bg-white/70 p-4 text-center">
                        <CheckCircle2
                          size={28}
                          className="mx-auto text-emerald-500"
                        />

                        <p className="mt-2 font-bold text-emerald-700">
                          Sẵn sàng nhận xe
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Hiện chưa có xe ở
                          trạng thái Đang rửa
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3 rounded-xl border border-blue-200 bg-white/80 p-4">
                        {/* Xe */}
                        <div>
                          <p className="text-xs text-slate-500">
                            Xe đang rửa
                          </p>

                          <p className="font-bold text-slate-800">
                            {item?.Vehicles
                              ?.LicensePlate ||
                              "Chưa cập nhật"}
                          </p>

                          <p className="text-sm text-slate-500">
                            {item
                              ? getVehicleName(
                                item
                              )
                              : ""}
                          </p>
                        </div>

                        {/* Dịch vụ */}
                        <div className="border-t border-slate-200 pt-3">
                          <p className="text-xs text-slate-500">
                            Dịch vụ
                          </p>

                          <p className="text-sm font-semibold text-blue-700">
                            {item
                              ? getServiceNames(
                                item
                              )
                              : "Chưa cập nhật"}
                          </p>
                        </div>

                        {/* Thời gian */}
                        <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                          <div>
                            <p className="text-xs text-slate-500">
                              Bắt đầu rửa
                            </p>

                            <p className="text-sm font-bold text-slate-700">
                              {formatTime(
                                item?.WashStartAt
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Dự kiến theo
                              slot
                            </p>

                            <p className="text-sm font-bold text-blue-700">
                              {addMinutesToTime(
                                item?.WashStartAt,
                                Number(
                                  slotData?.SlotDuration ||
                                  30
                                )
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Booking */}
                        <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                          <p className="font-semibold">
                            {booking?.BookingCode ||
                              "Chưa có mã booking"}
                          </p>

                          <p className="mt-1">
                            Khách hàng:{" "}
                            {booking
                              ?.Customers
                              ?.Users
                              ?.FullName ||
                              "—"}
                          </p>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Cột bên phải */}
        <aside className="space-y-6">
          {/* Slot trống */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
                <CalendarClock
                  size={23}
                />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Slot trống gần nhất
                </h2>

                <p className="text-xs text-slate-500">
                  Lấy từ API
                  available-slots hôm nay
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {upcomingSlots.length ===
                0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                  Không còn slot khả dụng
                  trong ngày hoặc chưa có
                  lịch làm việc.
                </div>
              ) : (
                upcomingSlots.map(
                  (slot) => {
                    const total =
                      Math.max(
                        0,
                        Number(
                          slot.MaxCapacity ||
                          totalBays
                        )
                      );

                    const available =
                      Math.max(
                        0,
                        Number(
                          slot.Available ||
                          0
                        )
                      );

                    const percentage =
                      total > 0
                        ? Math.round(
                          (available /
                            total) *
                          100
                        )
                        : 0;

                    const isFull =
                      available === 0 ||
                      slot.Status ===
                      "Full";

                    return (
                      <div
                        key={`${slot.StartTime}-${slot.EndTime}`}
                        className="rounded-xl border border-slate-200 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Clock3
                              size={16}
                              className="text-indigo-500"
                            />

                            <span className="font-bold text-slate-800">
                              {formatTime(
                                slot.StartTime
                              )}{" "}
                              -{" "}
                              {formatTime(
                                slot.EndTime
                              )}
                            </span>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${isFull
                                ? "bg-red-100 text-red-600"
                                : "bg-emerald-100 text-emerald-700"
                              }`}
                          >
                            {isFull
                              ? "Đã đầy"
                              : `${available} chỗ trống`}
                          </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${percentage >=
                                50
                                ? "bg-emerald-500"
                                : percentage >
                                  0
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                          <span>
                            Đã đặt{" "}
                            {slot.Booked}/
                            {total}
                          </span>

                          <span className="flex items-center gap-1">
                            <Users
                              size={13}
                            />

                            {
                              slot.StaffCount
                            }{" "}
                            nhân viên
                          </span>
                        </div>

                        {slot.ShiftName && (
                          <p className="mt-1 text-xs font-medium text-indigo-600">
                            {
                              slot.ShiftName
                            }
                          </p>
                        )}
                      </div>
                    );
                  }
                )
              )}
            </div>
          </div>

          {/* Tình trạng hiện tại */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-3">
                <Droplets size={24} />
              </div>

              <div>
                <p className="text-sm text-slate-300">
                  Tình trạng hiện tại
                </p>

                <p className="font-bold">
                  {totalBays === 0
                    ? "Chưa có cấu hình trạm"
                    : availableCount >
                      0
                      ? "Chi nhánh còn khả năng nhận xe"
                      : "Tất cả trạm đang được sử dụng"}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">
                  Công suất sử dụng
                </span>

                <span className="font-bold">
                  {usagePercent}%
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-400"
                  style={{
                    width: `${usagePercent}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-slate-400">
                  Đang trống
                </p>

                <p className="mt-1 text-xl font-bold text-emerald-400">
                  {availableCount}
                </p>
              </div>

              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-slate-400">
                  Đang sử dụng
                </p>

                <p className="mt-1 text-xl font-bold text-blue-400">
                  {occupiedCount}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-400">
              Trang tự tải lại sau mỗi 5
              giây. Số trạm lấy từ cấu
              hình chi nhánh; xe đang rửa
              lấy từ BookingItems có trạng
              thái InProgress.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default StaffBays;