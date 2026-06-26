import { useState, useEffect } from "react";
import {
  CalendarCheck,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Car,
  User,
  Phone,
} from "lucide-react";
import axiosClient, { getErrorMessage } from "../../api/axiosClient";

type BookingStatus =
  | "pending"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled";

interface Booking {
  bookingID: number;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  licensePlate: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  status: BookingStatus;
  staffName?: string;
  notes?: string;
}

type ApiServiceLineItem = {
  Services?: {
    ServiceName?: string;
  };
};

type ApiBookingItem = {
  BookingItemID: number;
  Status?: string;
  Vehicles?: {
    LicensePlate?: string;
  };
  ServiceLineItems?: ApiServiceLineItem[];
};

type ApiBooking = {
  BookingGroupID: number;
  BookingCode?: string;
  BookingDate: string;
  StartTime: string;
  Status?: string;
  Customers?: {
    Users?: {
      FullName?: string;
      Phone?: string;
    };
  };
  BookingItems?: ApiBookingItem[];
};

function formatTime(value: string | null | undefined) {
  if (!value) {
    return "--:--";
  }

  const text = String(value);

  if (text.includes("T")) {
    return text.substring(11, 16);
  }

  return text.substring(0, 5);
}

function mapStatus(status: string | undefined): BookingStatus {
  if (status === "Pending") {
    return "pending";
  }

  if (status === "CheckedIn") {
    return "checked_in";
  }

  if (status === "InProgress") {
    return "in_progress";
  }

  if (status === "Completed") {
    return "completed";
  }

  if (status === "Cancelled") {
    return "cancelled";
  }

  return "pending";
}

function getServicesText(item: ApiBookingItem) {
  const serviceNames =
    item.ServiceLineItems?.map((line) => line.Services?.ServiceName).filter(
      Boolean
    ) || [];

  if (serviceNames.length === 0) {
    return "Không có dịch vụ";
  }

  return serviceNames.join(", ");
}

function convertApiBookingToBooking(apiBooking: ApiBooking): Booking[] {
  const customerName =
    apiBooking.Customers?.Users?.FullName || "Không có tên khách hàng";

  const customerPhone =
    apiBooking.Customers?.Users?.Phone || "Không có số điện thoại";

  const items = apiBooking.BookingItems || [];

  return items.map((item) => ({
    bookingID: item.BookingItemID,
    bookingCode:
      apiBooking.BookingCode ||
      `BG-${apiBooking.BookingGroupID}-${item.BookingItemID}`,
    customerName,
    customerPhone,
    licensePlate: item.Vehicles?.LicensePlate || "Không có biển số",
    serviceName: getServicesText(item),
    bookingDate: apiBooking.BookingDate,
    bookingTime: formatTime(apiBooking.StartTime),
    status: mapStatus(item.Status || apiBooking.Status),
    staffName: "—",
    notes: "",
  }));
}

const ManagerBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      setIsLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Bạn cần đăng nhập để xem lịch hẹn");
        return;
      }

      const response = await axiosClient.get(
        "/api/staff-operations/today-bookings",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const apiBookings: ApiBooking[] = response.data.data || [];

      const mappedBookings = apiBookings.flatMap((apiBooking) =>
        convertApiBookingToBooking(apiBooking)
      );

      setBookings(mappedBookings);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function updateBookingItemStatus(bookingItemId: number, status: string) {
    try {
      setIsUpdatingStatus(true);
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Bạn cần đăng nhập để cập nhật trạng thái");
        return;
      }

      await axiosClient.patch(
        `/api/staff-operations/booking-items/${bookingItemId}/status`,
        {
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedBooking(null);
      await fetchBookings();
    } catch (err) {
      console.error("Error updating booking status:", err);
      setMessage(getErrorMessage(err));
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  function getNextAction(booking: Booking) {
    if (booking.status === "pending") {
      return {
        label: "Check-in",
        nextStatus: "CheckedIn",
        className: "bg-blue-600 hover:bg-blue-700",
      };
    }

    if (booking.status === "checked_in") {
      return {
        label: "Bắt đầu rửa",
        nextStatus: "InProgress",
        className: "bg-purple-600 hover:bg-purple-700",
      };
    }

    if (booking.status === "in_progress") {
      return {
        label: "Hoàn thành",
        nextStatus: "Completed",
        className: "bg-emerald-600 hover:bg-emerald-700",
      };
    }

    return null;
  }

  const filteredBookings = bookings.filter((booking) => {
    const keyword = searchTerm.toLowerCase();

    const matchesSearch =
      booking.customerName.toLowerCase().includes(keyword) ||
      booking.licensePlate.toLowerCase().includes(keyword) ||
      booking.customerPhone.includes(searchTerm) ||
      booking.bookingCode.toLowerCase().includes(keyword);

    const matchesStatus =
      statusFilter === "all" || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      pending: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        label: "Chờ xác nhận",
      },
      checked_in: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Đã check-in",
      },
      in_progress: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        label: "Đang rửa",
      },
      completed: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "Hoàn thành",
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Đã hủy",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
      >
        {status === "completed" && <CheckCircle size={12} />}
        {status === "cancelled" && <XCircle size={12} />}
        {status === "in_progress" && <Clock size={12} />}
        {config.label}
      </span>
    );
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    inProgress: bookings.filter((b) => b.status === "in_progress").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  const nextAction = selectedBooking ? getNextAction(selectedBooking) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Quản lý Lịch hẹn
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Theo dõi và quản lý lịch hẹn hôm nay tại chi nhánh của bạn
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-2.5">
              <CalendarCheck size={20} className="text-slate-600" />
            </div>

            <div>
              <p className="text-2xl font-bold text-slate-800">
                {stats.total}
              </p>
              <p className="text-xs text-slate-500">Tổng lịch hẹn</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2.5">
              <Clock size={20} className="text-amber-600" />
            </div>

            <div>
              <p className="text-2xl font-bold text-amber-700">
                {stats.pending}
              </p>
              <p className="text-xs text-amber-600">Chờ xác nhận</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2.5">
              <Car size={20} className="text-purple-600" />
            </div>

            <div>
              <p className="text-2xl font-bold text-purple-700">
                {stats.inProgress}
              </p>
              <p className="text-xs text-purple-600">Đang rửa</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2.5">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>

            <div>
              <p className="text-2xl font-bold text-emerald-700">
                {stats.completed}
              </p>
              <p className="text-xs text-emerald-600">Hoàn thành</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />

          <input
            type="text"
            placeholder="Tìm theo tên, biển số, số điện thoại, mã lịch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="relative">
          <Filter
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="checked_in">Đã check-in</option>
            <option value="in_progress">Đang rửa</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        <button
          type="button"
          onClick={fetchBookings}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Làm mới
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Mã lịch hẹn</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Xe</th>
                <th className="px-6 py-4">Dịch vụ</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    Không tìm thấy lịch hẹn nào
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr
                    key={booking.bookingID}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-blue-600">
                        {booking.bookingCode}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <User size={16} />
                        </div>

                        <div>
                          <p className="font-medium text-slate-800">
                            {booking.customerName}
                          </p>

                          <p className="text-xs text-slate-500">
                            {booking.customerPhone}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Car size={16} className="text-slate-400" />
                        <span className="font-mono font-medium">
                          {booking.licensePlate}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {booking.serviceName}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-slate-800">
                          {new Date(booking.bookingDate).toLocaleDateString(
                            "vi-VN"
                          )}
                        </p>

                        <p className="text-slate-500">
                          {booking.bookingTime}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {getStatusBadge(booking.status)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(booking)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-800">
                Chi tiết Lịch hẹn
              </h2>

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <XCircle size={22} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                <span className="text-sm text-slate-500">Mã lịch hẹn</span>
                <span className="font-mono font-semibold text-blue-600">
                  {selectedBooking.bookingCode}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                <span className="text-sm text-slate-500">Trạng thái</span>
                {getStatusBadge(selectedBooking.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Khách hàng</p>
                  <p className="font-medium">
                    {selectedBooking.customerName}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Số điện thoại</p>
                  <p className="flex items-center gap-1 font-medium">
                    <Phone size={14} /> {selectedBooking.customerPhone}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Biển số xe</p>
                  <p className="font-mono font-medium">
                    {selectedBooking.licensePlate}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Dịch vụ</p>
                  <p className="font-medium">
                    {selectedBooking.serviceName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Ngày</p>
                  <p className="font-medium">
                    {new Date(selectedBooking.bookingDate).toLocaleDateString(
                      "vi-VN"
                    )}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Giờ</p>
                  <p className="font-medium">
                    {selectedBooking.bookingTime}
                  </p>
                </div>
              </div>

              {selectedBooking.staffName && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs text-blue-600">Nhân viên phụ trách</p>
                  <p className="font-medium text-blue-700">
                    {selectedBooking.staffName}
                  </p>
                </div>
              )}

              {selectedBooking.notes && (
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                  <p className="text-xs text-amber-600">Ghi chú</p>
                  <p className="font-medium text-amber-700">
                    {selectedBooking.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-slate-100 bg-white p-5">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Đóng
              </button>

              {nextAction && (
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() =>
                    updateBookingItemStatus(
                      selectedBooking.bookingID,
                      nextAction.nextStatus
                    )
                  }
                  className={`flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:bg-gray-400 ${nextAction.className}`}
                >
                  {isUpdatingStatus ? "Đang cập nhật..." : nextAction.label}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerBookings;