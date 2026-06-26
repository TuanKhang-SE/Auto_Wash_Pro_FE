import { useState, useEffect } from "react";
import {
  Bike,
  Clock3,
  CircleCheckBig,
  ClipboardList,
  Car,
  RefreshCw,
} from "lucide-react";
import StatCard from "../../components/staff/StatCard";
import axiosClient, { getErrorMessage } from "../../api/axiosClient";

type ServiceLineItem = {
  Services?: {
    ServiceName: string;
  };
};

type BookingItem = {
  BookingItemID: number;
  Status: string;
  CheckInAt: string | null;
  WashStartAt: string | null;
  CompletedAt: string | null;
  Vehicles?: {
    LicensePlate: string;
    Brand: string | null;
    Model: string | null;
  };
  ServiceLineItems?: ServiceLineItem[];
};

type StaffBooking = {
  BookingGroupID: number;
  BookingCode: string;
  BranchID: number;
  BookingDate: string;
  StartTime: string;
  Status: string;
  Customers?: {
    Users?: {
      FullName: string;
      Phone: string;
    };
  };
  BookingItems?: BookingItem[];
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

function getUserFromStorage() {
  try {
    const userStr = localStorage.getItem("user");

    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (error) {
    console.log(error);
  }

  return null;
}

const StaffDashboard = () => {
  const [bookings, setBookings] = useState<StaffBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [staffName, setStaffName] = useState("Nhân viên");

  const [stats, setStats] = useState({
    waiting: 0,
    washing: 0,
    completed: 0,
    total: 0,
  });

  useEffect(() => {
    const user = getUserFromStorage();
    setStaffName(user?.fullName || user?.FullName || user?.email || "Nhân viên");

    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setIsLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Bạn cần đăng nhập bằng tài khoản staff");
        return;
      }

      const res = await axiosClient.get("/api/staff-operations/today-bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: StaffBooking[] = res.data.data || [];

      setBookings(data);

      let waiting = 0;
      let washing = 0;
      let completed = 0;
      let total = 0;

      data.forEach((booking) => {
        booking.BookingItems?.forEach((item) => {
          total++;

          if (item.Status === "Completed") {
            completed++;
          } else if (item.Status === "CheckedIn" || item.Status === "InProgress") {
            washing++;
          } else {
            waiting++;
          }
        });
      });

      setStats({
        waiting,
        washing,
        completed,
        total,
      });
    } catch (error) {
      console.log(error);
      setMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function updateItemStatus(bookingItemId: number, status: string) {
    try {
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Bạn cần đăng nhập bằng tài khoản staff");
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

      await fetchDashboardData();
    } catch (error) {
      console.log(error);
      setMessage(getErrorMessage(error));
    }
  }

  function getStatusBadge(status: string) {
    if (status === "Completed") {
      return (
        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
          Hoàn thành
        </span>
      );
    }

    if (status === "InProgress") {
      return (
        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
          Đang rửa
        </span>
      );
    }

    if (status === "CheckedIn") {
      return (
        <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
          Đã check-in
        </span>
      );
    }

    return (
      <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
        Chờ xử lý
      </span>
    );
  }

  function getServicesText(item: BookingItem) {
    const serviceNames =
      item.ServiceLineItems?.map((line) => line.Services?.ServiceName).filter(Boolean) || [];

    if (serviceNames.length === 0) {
      return "—";
    }

    return serviceNames.join(", ");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-xl shadow-blue-500/20">
        <h2 className="text-2xl font-bold">Chào buổi làm việc, {staffName}!</h2>
        <p className="mt-1 text-blue-100">
          Đây là danh sách booking hôm nay tại chi nhánh của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Xe chờ xử lý"
          value={stats.waiting}
          icon={<Clock3 className="text-yellow-500" />}
        />

        <StatCard
          title="Xe đang rửa"
          value={stats.washing}
          icon={<Bike className="text-blue-500" />}
        />

        <StatCard
          title="Hoàn thành hôm nay"
          value={stats.completed}
          icon={<CircleCheckBig className="text-green-500" />}
        />

        <StatCard
          title="Tổng xe hôm nay"
          value={stats.total}
          icon={<ClipboardList className="text-purple-500" />}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Booking hôm nay</h2>

          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        {message && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Hôm nay chưa có booking nào
          </div>
        ) : (
          <div className="space-y-5">
            {bookings.map((booking) => (
              <div
                key={booking.BookingGroupID}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="mb-4 flex flex-col gap-2 border-b pb-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-bold text-slate-800">
                      Mã booking: {booking.BookingCode}
                    </p>

                    <p className="text-sm text-slate-500">
                      Khách hàng: {booking.Customers?.Users?.FullName || "—"} |{" "}
                      {booking.Customers?.Users?.Phone || "—"}
                    </p>
                  </div>

                  <div className="text-sm font-semibold text-blue-600">
                    Giờ hẹn: {formatTime(booking.StartTime)}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-slate-500">
                        <th className="py-3 pr-4">Xe</th>
                        <th className="px-4">Dịch vụ</th>
                        <th className="px-4">Trạng thái</th>
                        <th className="px-4">Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {booking.BookingItems?.map((item) => (
                        <tr
                          key={item.BookingItemID}
                          className="border-b last:border-b-0 hover:bg-slate-50"
                        >
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-2">
                              <Car size={16} className="text-slate-400" />

                              <div>
                                <p className="font-mono font-semibold">
                                  {item.Vehicles?.LicensePlate || "—"}
                                </p>

                                <p className="text-sm text-slate-500">
                                  {item.Vehicles?.Brand || "—"}{" "}
                                  {item.Vehicles?.Model || ""}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 text-sm text-slate-600">
                            {getServicesText(item)}
                          </td>

                          <td className="px-4">
                            {getStatusBadge(item.Status)}
                          </td>

                          <td className="px-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={item.Status !== "Pending"}
                                onClick={() =>
                                  updateItemStatus(item.BookingItemID, "CheckedIn")
                                }
                                className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:bg-gray-300"
                              >
                                Check-in
                              </button>

                              <button
                                type="button"
                                disabled={item.Status !== "CheckedIn"}
                                onClick={() =>
                                  updateItemStatus(item.BookingItemID, "InProgress")
                                }
                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
                              >
                                Bắt đầu rửa
                              </button>

                              <button
                                type="button"
                                disabled={item.Status !== "InProgress"}
                                onClick={() =>
                                  updateItemStatus(item.BookingItemID, "Completed")
                                }
                                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-gray-300"
                              >
                                Hoàn thành
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;