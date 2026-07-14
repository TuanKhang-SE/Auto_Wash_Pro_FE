import { useMemo, useState } from "react";
import {
  Building2,
  CalendarClock,
  Car,
  CheckCircle2,
  Clock3,
  Cpu,
  Droplets,
  MapPin,
  RefreshCw,
} from "lucide-react";

type BayStatus = "Available" | "Occupied";

type WashBay = {
  BayID: number;
  BayName: string;
  Status: BayStatus;
  VehiclePlate?: string;
  VehicleName?: string;
  ServiceName?: string;
  BookingCode?: string;
  StartTime?: string;
  ExpectedEndTime?: string;
};

type AvailableSlot = {
  Time: string;
  Available: number;
  Total: number;
};

type BranchBayData = {
  BranchID: number;
  BranchName: string;
  Address: string;
  OpenTime: string;
  CloseTime: string;
  Bays: WashBay[];
  Slots: AvailableSlot[];
};

/*
 * Dữ liệu mẫu để thiết kế giao diện FE.
 * Sau này sẽ thay bằng dữ liệu thật từ API.
 */
const MOCK_BRANCH_DATA: BranchBayData[] = [
  {
    BranchID: 1,
    BranchName: "Chi nhánh Quận 1",
    Address:
      "643/40 Đường Xô Viết Nghệ Tĩnh, Bình Thạnh, TP. HCM",
    OpenTime: "07:00",
    CloseTime: "21:00",

    Bays: [
      {
        BayID: 1,
        BayName: "Trạm 01",
        Status: "Available",
      },
      {
        BayID: 2,
        BayName: "Trạm 02",
        Status: "Occupied",
        VehiclePlate: "59-AB 123.68",
        VehicleName: "Honda Vision",
        ServiceName: "Rửa xe bọt tuyết",
        BookingCode: "BK-20260714-84128",
        StartTime: "10:30",
        ExpectedEndTime: "11:00",
      },
      {
        BayID: 3,
        BayName: "Trạm 03",
        Status: "Available",
      },
      {
        BayID: 4,
        BayName: "Trạm 04",
        Status: "Occupied",
        VehiclePlate: "60-AB 789.10",
        VehicleName: "Yamaha Exciter",
        ServiceName: "Rửa xe cao cấp",
        BookingCode: "BK-20260714-42379",
        StartTime: "10:45",
        ExpectedEndTime: "11:30",
      },
      {
        BayID: 5,
        BayName: "Trạm 05",
        Status: "Available",
      },
      {
        BayID: 6,
        BayName: "Trạm 06",
        Status: "Available",
      },
      {
        BayID: 7,
        BayName: "Trạm 07",
        Status: "Available",
      },
      {
        BayID: 8,
        BayName: "Trạm 08",
        Status: "Available",
      },
    ],

    Slots: [
      {
        Time: "11:00",
        Available: 4,
        Total: 8,
      },
      {
        Time: "11:30",
        Available: 5,
        Total: 8,
      },
      {
        Time: "12:00",
        Available: 6,
        Total: 8,
      },
      {
        Time: "12:30",
        Available: 8,
        Total: 8,
      },
      {
        Time: "13:00",
        Available: 7,
        Total: 8,
      },
    ],
  },

  {
    BranchID: 2,
    BranchName: "Chi nhánh Quận 3",
    Address: "120 Võ Văn Tần, Quận 3, TP. HCM",
    OpenTime: "07:30",
    CloseTime: "20:30",

    Bays: [
      {
        BayID: 1,
        BayName: "Trạm 01",
        Status: "Occupied",
        VehiclePlate: "51-H1 456.78",
        VehicleName: "Honda SH",
        ServiceName: "Rửa xe tiêu chuẩn",
        BookingCode: "BK-20260714-56821",
        StartTime: "10:15",
        ExpectedEndTime: "10:45",
      },
      {
        BayID: 2,
        BayName: "Trạm 02",
        Status: "Available",
      },
      {
        BayID: 3,
        BayName: "Trạm 03",
        Status: "Available",
      },
      {
        BayID: 4,
        BayName: "Trạm 04",
        Status: "Occupied",
        VehiclePlate: "59-X2 234.56",
        VehicleName: "Honda AirBlade",
        ServiceName: "Rửa xe bọt tuyết",
        BookingCode: "BK-20260714-67231",
        StartTime: "10:30",
        ExpectedEndTime: "11:00",
      },
      {
        BayID: 5,
        BayName: "Trạm 05",
        Status: "Available",
      },
      {
        BayID: 6,
        BayName: "Trạm 06",
        Status: "Available",
      },
    ],

    Slots: [
      {
        Time: "11:00",
        Available: 3,
        Total: 6,
      },
      {
        Time: "11:30",
        Available: 4,
        Total: 6,
      },
      {
        Time: "12:00",
        Available: 5,
        Total: 6,
      },
      {
        Time: "12:30",
        Available: 6,
        Total: 6,
      },
      {
        Time: "13:00",
        Available: 4,
        Total: 6,
      },
    ],
  },

  {
    BranchID: 3,
    BranchName: "Chi nhánh Thủ Đức",
    Address: "88 Võ Văn Ngân, TP. Thủ Đức, TP. HCM",
    OpenTime: "07:00",
    CloseTime: "22:00",

    Bays: [
      {
        BayID: 1,
        BayName: "Trạm 01",
        Status: "Available",
      },
      {
        BayID: 2,
        BayName: "Trạm 02",
        Status: "Available",
      },
      {
        BayID: 3,
        BayName: "Trạm 03",
        Status: "Occupied",
        VehiclePlate: "61-C1 888.99",
        VehicleName: "Yamaha Janus",
        ServiceName: "Rửa xe bọt tuyết",
        BookingCode: "BK-20260714-90321",
        StartTime: "10:30",
        ExpectedEndTime: "11:00",
      },
      {
        BayID: 4,
        BayName: "Trạm 04",
        Status: "Available",
      },
      {
        BayID: 5,
        BayName: "Trạm 05",
        Status: "Available",
      },
      {
        BayID: 6,
        BayName: "Trạm 06",
        Status: "Available",
      },
      {
        BayID: 7,
        BayName: "Trạm 07",
        Status: "Occupied",
        VehiclePlate: "59-B2 345.67",
        VehicleName: "Honda Lead",
        ServiceName: "Rửa xe cao cấp",
        BookingCode: "BK-20260714-19234",
        StartTime: "10:40",
        ExpectedEndTime: "11:25",
      },
      {
        BayID: 8,
        BayName: "Trạm 08",
        Status: "Available",
      },
      {
        BayID: 9,
        BayName: "Trạm 09",
        Status: "Available",
      },
      {
        BayID: 10,
        BayName: "Trạm 10",
        Status: "Available",
      },
    ],

    Slots: [
      {
        Time: "11:00",
        Available: 6,
        Total: 10,
      },
      {
        Time: "11:30",
        Available: 7,
        Total: 10,
      },
      {
        Time: "12:00",
        Available: 8,
        Total: 10,
      },
      {
        Time: "12:30",
        Available: 10,
        Total: 10,
      },
      {
        Time: "13:00",
        Available: 9,
        Total: 10,
      },
    ],
  },
];

function getBayStatusText(status: BayStatus) {
  switch (status) {
    case "Available":
      return "Đang trống";

    case "Occupied":
      return "Đang sử dụng";

    default:
      return "Chưa cập nhật";
  }
}

function getBayStatusClass(status: BayStatus) {
  switch (status) {
    case "Available":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "Occupied":
      return "border-blue-200 bg-blue-50 text-blue-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function StaffBays() {
  const [selectedBranchId, setSelectedBranchId] =
    useState<number>(1);

  const [refreshing, setRefreshing] = useState(false);

  const [lastUpdated, setLastUpdated] = useState<Date>(
    () => new Date()
  );

  const selectedBranch = useMemo(() => {
    return (
      MOCK_BRANCH_DATA.find(
        (branch) => branch.BranchID === selectedBranchId
      ) || MOCK_BRANCH_DATA[0]
    );
  }, [selectedBranchId]);

  const bayStatistics = useMemo(() => {
    const total = selectedBranch.Bays.length;

    const available = selectedBranch.Bays.filter(
      (bay) => bay.Status === "Available"
    ).length;

    const occupied = selectedBranch.Bays.filter(
      (bay) => bay.Status === "Occupied"
    ).length;

    return {
      total,
      available,
      occupied,
    };
  }, [selectedBranch]);

  const usagePercent =
    bayStatistics.total > 0
      ? Math.round(
          (bayStatistics.occupied / bayStatistics.total) * 100
        )
      : 0;

  function handleRefresh() {
    setRefreshing(true);

    /*
     * Hiện tại chỉ mô phỏng nút làm mới.
     * Sau này thay bằng hàm gọi API thật.
     */
    window.setTimeout(() => {
      setLastUpdated(new Date());
      setRefreshing(false);
    }, 600);
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
            Theo dõi số trạm đang trống và khung giờ khả dụng tại
            từng chi nhánh.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
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

      {/* Banner chi nhánh */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-blue-500/20">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
              <Building2 size={30} />
            </div>

            <div>
              <p className="text-sm font-medium text-blue-100">
                Chi nhánh đang theo dõi
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {selectedBranch.BranchName}
              </h2>

              <div className="mt-3 flex items-start gap-2 text-sm text-blue-100">
                <MapPin
                  size={17}
                  className="mt-0.5 shrink-0"
                />

                <span>{selectedBranch.Address}</span>
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm text-blue-100">
                <Clock3 size={17} />

                <span>
                  Hoạt động từ {selectedBranch.OpenTime} đến{" "}
                  {selectedBranch.CloseTime}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full xl:w-80">
            <label
              htmlFor="branch"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-blue-100"
            >
              Chọn chi nhánh cần xem
            </label>

            <select
              id="branch"
              value={selectedBranchId}
              onChange={(event) =>
                setSelectedBranchId(Number(event.target.value))
              }
              className="w-full rounded-xl border border-white/30 bg-white px-4 py-3 font-semibold text-slate-800 outline-none transition focus:ring-4 focus:ring-white/20"
            >
              {MOCK_BRANCH_DATA.map((branch) => (
                <option
                  key={branch.BranchID}
                  value={branch.BranchID}
                >
                  {branch.BranchName}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-blue-100">
              Cập nhật gần nhất lúc{" "}
              {lastUpdated.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          </div>
        </div>
      </section>

      {/* Thống kê */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* Tổng số trạm */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Tổng số trạm
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-800">
                {bayStatistics.total}
              </p>
            </div>

            <div className="rounded-2xl bg-violet-100 p-3 text-violet-600">
              <Cpu size={25} />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Tổng công suất của chi nhánh
          </p>
        </div>

        {/* Trạm đang trống */}
        <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Trạm đang trống
              </p>

              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {bayStatistics.available}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600">
              <CheckCircle2 size={25} />
            </div>
          </div>

          <p className="mt-3 text-xs text-emerald-600">
            Có thể nhận xe ngay
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
                {bayStatistics.occupied}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
              <Droplets size={25} />
            </div>
          </div>

          <p className="mt-3 text-xs text-blue-600">
            Mức sử dụng hiện tại {usagePercent}%
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Danh sách các trạm */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Sơ đồ trạng thái trạm
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Trạng thái hoạt động hiện tại của từng trạm rửa xe.
              </p>
            </div>

            <span className="w-fit rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
              {bayStatistics.available}/{bayStatistics.total} trạm
              trống
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

          <div className="grid gap-4 md:grid-cols-2">
            {selectedBranch.Bays.map((bay) => (
              <article
                key={bay.BayID}
                className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${getBayStatusClass(
                  bay.Status
                )}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white p-2.5 shadow-sm">
                      <Car size={22} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800">
                        {bay.BayName}
                      </h3>

                      <p className="mt-0.5 text-xs font-semibold">
                        {getBayStatusText(bay.Status)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                      bay.Status === "Available"
                        ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"
                        : "bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.15)]"
                    }`}
                  />
                </div>

                {/* Trạm đang trống */}
                {bay.Status === "Available" && (
                  <div className="mt-5 rounded-xl border border-emerald-200 bg-white/70 p-4 text-center">
                    <CheckCircle2
                      size={28}
                      className="mx-auto text-emerald-500"
                    />

                    <p className="mt-2 font-bold text-emerald-700">
                      Sẵn sàng nhận xe
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Trạm hiện chưa có xe sử dụng
                    </p>
                  </div>
                )}

                {/* Trạm đang sử dụng */}
                {bay.Status === "Occupied" && (
                  <div className="mt-4 space-y-3 rounded-xl border border-blue-200 bg-white/80 p-4">
                    <div>
                      <p className="text-xs text-slate-500">
                        Xe đang rửa
                      </p>

                      <p className="font-bold text-slate-800">
                        {bay.VehiclePlate || "Chưa cập nhật"}
                      </p>

                      <p className="text-sm text-slate-500">
                        {bay.VehicleName || ""}
                      </p>
                    </div>

                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-xs text-slate-500">
                        Dịch vụ
                      </p>

                      <p className="text-sm font-semibold text-blue-700">
                        {bay.ServiceName || "Chưa cập nhật"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                      <div>
                        <p className="text-xs text-slate-500">
                          Bắt đầu
                        </p>

                        <p className="text-sm font-bold text-slate-700">
                          {bay.StartTime || "--:--"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Dự kiến xong
                        </p>

                        <p className="text-sm font-bold text-blue-700">
                          {bay.ExpectedEndTime || "--:--"}
                        </p>
                      </div>
                    </div>

                    {bay.BookingCode && (
                      <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                        {bay.BookingCode}
                      </p>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>

        {/* Khu vực bên phải */}
        <aside className="space-y-6">
          {/* Slot trống */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
                <CalendarClock size={23} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Slot trống gần nhất
                </h2>

                <p className="text-xs text-slate-500">
                  Số trạm còn nhận được xe
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {selectedBranch.Slots.map((slot) => {
                const percentage =
                  slot.Total > 0
                    ? Math.round(
                        (slot.Available / slot.Total) * 100
                      )
                    : 0;

                const isFull = slot.Available === 0;

                return (
                  <div
                    key={slot.Time}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock3
                          size={16}
                          className="text-indigo-500"
                        />

                        <span className="font-bold text-slate-800">
                          {slot.Time}
                        </span>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          isFull
                            ? "bg-red-100 text-red-600"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {isFull
                          ? "Đã đầy"
                          : `${slot.Available} trạm trống`}
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          percentage >= 50
                            ? "bg-emerald-500"
                            : percentage > 0
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Còn {slot.Available}/{slot.Total} vị trí
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tình trạng hoạt động */}
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
                  Chi nhánh hoạt động ổn định
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
                  {bayStatistics.available}
                </p>
              </div>

              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-slate-400">
                  Đang sử dụng
                </p>

                <p className="mt-1 text-xl font-bold text-blue-400">
                  {bayStatistics.occupied}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-400">
              Dữ liệu hiện tại đang là dữ liệu mẫu để thiết kế giao
              diện. Khi kết nối API, số trạm và slot sẽ được lấy trực
              tiếp từ database.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default StaffBays;