import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import axiosClient from "../../api/axiosClient";

function BookingHistory() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const res = await axiosClient.get("/api/bookings/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBookings(res.data.data || []);
    } catch (error: any) {
      console.log(error.response?.data || error);
      setMessage(
        error.response?.data?.message || "Không thể tải lịch sử đặt lịch"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelBooking(bookingId: number) {
    const confirmCancel = window.confirm("Bạn có chắc muốn hủy lịch này không?");

    if (!confirmCancel) {
      return;
    }

    try {
      setMessage("");
      setCancelingId(bookingId);

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      await axiosClient.patch(
        `/api/bookings/${bookingId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBookings((oldBookings) =>
        oldBookings.map((booking) =>
          booking.BookingGroupID === bookingId
            ? { ...booking, Status: "Cancelled" }
            : booking
        )
      );

      setMessage("Hủy lịch thành công");
    } catch (error: any) {
      console.log(error.response?.data || error);
      setMessage(error.response?.data?.message || "Hủy lịch thất bại");
    } finally {
      setCancelingId(null);
    }
  }

  function formatDate(dateValue: string) {
    if (!dateValue) return "Chưa cập nhật";

    return new Date(dateValue).toLocaleDateString("vi-VN");
  }

  function formatTime(timeValue: string) {
    if (!timeValue) return "Chưa cập nhật";

    return timeValue.slice(0, 5);
  }

  function getStatusText(status: string) {
    if (status === "Pending") return "Chờ xác nhận";
    if (status === "Confirmed") return "Đã xác nhận";
    if (status === "CheckedIn") return "Đã nhận xe";
    if (status === "InProgress") return "Đang xử lý";
    if (status === "Completed") return "Hoàn thành";
    if (status === "Cancelled") return "Đã hủy";

    return status;
  }

  function canCancel(status: string) {
    return status === "Pending" || status === "Confirmed";
  }

  function getTotalMoney(booking: any) {
    let total = 0;

    booking.BookingItems?.forEach((item: any) => {
      item.ServiceLineItems?.forEach((line: any) => {
        total += Number(line.LineTotal || 0);
      });
    });

    return total.toLocaleString("vi-VN") + "đ";
  }

  const filteredBookings =
    statusFilter === "All"
      ? bookings
      : bookings.filter((booking) => booking.Status === statusFilter);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Lịch sử đặt lịch
              </h1>

              <p className="mt-1 text-gray-500">
                Xem lại các lịch rửa xe của bạn
              </p>
            </div>

            <Link
              to="/booking"
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Đặt lịch mới
            </Link>
          </div>

          {message && (
            <p
              className={`mb-4 rounded-lg px-4 py-3 text-sm ${
                message.includes("thành công")
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {message}
            </p>
          )}

          <div className="mb-6 rounded-xl bg-white p-4 shadow">
            <label className="mr-3 font-medium text-gray-700">
              Lọc trạng thái:
            </label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="All">Tất cả</option>
              <option value="Pending">Chờ xác nhận</option>
              <option value="Confirmed">Đã xác nhận</option>
              <option value="CheckedIn">Đã nhận xe</option>
              <option value="InProgress">Đang xử lý</option>
              <option value="Completed">Hoàn thành</option>
              <option value="Cancelled">Đã hủy</option>
            </select>

            <button
              type="button"
              onClick={loadBookings}
              className="ml-3 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100"
            >
              Tải lại
            </button>
          </div>

          {loading ? (
            <p className="text-gray-600">Đang tải lịch sử đặt lịch...</p>
          ) : filteredBookings.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow">
              <p className="text-gray-500">Chưa có lịch đặt nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.BookingGroupID}
                  className="rounded-xl bg-white p-5 shadow"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {booking.BookingCode || `BK-${booking.BookingGroupID}`}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Ngày đặt: {formatDate(booking.CreatedAt)}
                      </p>
                    </div>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                      {getStatusText(booking.Status)}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-gray-500">Ngày hẹn</p>
                      <p className="font-semibold text-gray-800">
                        {formatDate(booking.BookingDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Giờ bắt đầu</p>
                      <p className="font-semibold text-gray-800">
                        {formatTime(booking.StartTime)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Chi nhánh</p>
                      <p className="font-semibold text-gray-800">
                        {booking.branches?.BranchName || "Chưa cập nhật"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.branches?.Address || ""}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Tổng tiền</p>
                      <p className="font-semibold text-blue-700">
                        {getTotalMoney(booking)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 font-semibold text-gray-700">Xe</p>

                    {booking.BookingItems?.map((item: any) => (
                      <div
                        key={item.BookingItemID}
                        className="mb-2 rounded-lg bg-gray-50 p-3"
                      >
                        <p className="font-semibold text-gray-800">
                          {item.Vehicles?.LicensePlate || "Chưa cập nhật"}
                        </p>

                        <p className="text-sm text-gray-500">
                          {item.Vehicles?.Brand || item.Vehicles?.Make || ""}{" "}
                          {item.Vehicles?.Model || ""}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 font-semibold text-gray-700">Dịch vụ</p>

                    <div className="flex flex-wrap gap-2">
                      {booking.BookingItems?.map((item: any) =>
                        item.ServiceLineItems?.map((line: any) => (
                          <span
                            key={line.ServiceLineItemID}
                            className="rounded-full bg-sky-50 px-3 py-1 text-sm text-sky-700"
                          >
                            {line.Services?.ServiceName ||
                              "Dịch vụ chưa cập nhật"}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {canCancel(booking.Status) && (
                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          handleCancelBooking(booking.BookingGroupID)
                        }
                        disabled={cancelingId === booking.BookingGroupID}
                        className="rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        {cancelingId === booking.BookingGroupID
                          ? "Đang hủy..."
                          : "Hủy lịch"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default BookingHistory;