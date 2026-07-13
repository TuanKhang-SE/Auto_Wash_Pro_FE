import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import axiosClient, { getErrorMessage } from "../../api/axiosClient";

type BookingServiceLine = {
  ServiceLineItemID?: number;
  ServiceID: number;
  UnitPrice?: number | string | null;
  LineTotal?: number | string | null;
  Services?: { ServiceName?: string | null } | null;
};

type CustomerBookingItem = {
  BookingItemID: number;
  Status: string;
  Vehicles?: {
    LicensePlate?: string | null;
    Brand?: string | null;
    Make?: string | null;
    Model?: string | null;
  } | null;
  ServiceLineItems?: BookingServiceLine[];
};

type CustomerBooking = {
  BookingGroupID: number;
  BookingCode?: string | null;
  BookingDate?: string | null;
  StartTime?: string | null;
  CreatedAt?: string | null;
  Status: string;
  branches?: { BranchName?: string | null; Address?: string | null } | null;
  BookingItems?: CustomerBookingItem[];
  Transactions?: Array<{
    TransactionID: number;
    Subtotal?: number | string | null;
    DiscountAmount?: number | string | null;
    FinalAmount?: number | string | null;
    Status?: string | null;
  }>;
};

function BookingHistory() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [memberTierName, setMemberTierName] = useState("");
  const [tierDiscountPercent, setTierDiscountPercent] = useState(0);

  useEffect(() => {
    loadBookings();
    // loadBookings chỉ cần chạy khi trang lịch sử được mở lần đầu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getAuthHeader() {
    const token = localStorage.getItem("token");

    if (!token) {
      return null;
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async function loadBookings() {
    setLoading(true);
    setMessage("");

    try {
      const headers = getAuthHeader();

      if (!headers) {
        navigate("/login");
        return;
      }

      const [response, profileResponse] = await Promise.all([
        axiosClient.get("/api/bookings/me", { headers }),
        axiosClient.get("/api/customers/profile", { headers }),
      ]);

      const loyaltyAccount = profileResponse.data?.data?.LoyaltyAccounts?.[0];
      const tierConfig = loyaltyAccount?.tier_configs;
      const discountPercent = Number(tierConfig?.DiscountPercent || 0);

      setMemberTierName(tierConfig?.TierName || "");
      setTierDiscountPercent(
        Number.isFinite(discountPercent)
          ? Math.min(100, Math.max(0, discountPercent))
          : 0
      );

      if (response.data?.success) {
        setBookings(response.data.data || []);
      } else {
        setMessage(response.data?.message || "Không thể tải lịch sử đặt lịch");
      }
    } catch (error: unknown) {
      console.log(error);
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelBooking(bookingId: number) {
    const confirmCancel = window.confirm("Bạn có chắc muốn hủy lịch này không?");

    if (!confirmCancel) {
      return;
    }

    setMessage("");
    setCancelingId(bookingId);

    try {
      const headers = getAuthHeader();

      if (!headers) {
        navigate("/login");
        return;
      }

      const response = await axiosClient.patch(
        `/api/bookings/${bookingId}/cancel`,
        {},
        {
          headers,
        }
      );

      if (response.data?.success) {
        setBookings((oldBookings) =>
          oldBookings.map((booking) => {
            if (booking.BookingGroupID === bookingId) {
              return {
                ...booking,
                Status: "Cancelled",
              };
            }

            return booking;
          })
        );

        setMessage("Hủy lịch thành công");
      } else {
        setMessage(response.data?.message || "Hủy lịch thất bại");
      }
    } catch (error: unknown) {
      console.log(error);
      setMessage(getErrorMessage(error));
    } finally {
      setCancelingId(null);
    }
  }

  function formatDate(dateValue: string | null | undefined) {
    if (!dateValue) {
      return "Chưa cập nhật";
    }

    return new Date(dateValue).toLocaleDateString("vi-VN");
  }

  function formatTime(timeValue: string | null | undefined) {
    if (!timeValue) {
      return "Chưa cập nhật";
    }

    const text = String(timeValue);

    if (text.includes("T")) {
      return text.slice(11, 16);
    }

    return text.slice(0, 5);
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

  function getBookingPricing(booking: CustomerBooking) {
    let subtotal = 0;

    booking.BookingItems?.forEach((item) => {
      item.ServiceLineItems?.forEach((line) => {
        subtotal += Number(line.LineTotal || 0);
      });
    });

    const transaction = booking.Transactions?.[0];
    if (transaction?.FinalAmount !== null && transaction?.FinalAmount !== undefined) {
      return {
        subtotal: Number(transaction.Subtotal ?? subtotal),
        discount: Number(transaction.DiscountAmount || 0),
        final: Number(transaction.FinalAmount),
        discountLabel: "Đã giảm",
      };
    }

    const discount = (subtotal * tierDiscountPercent) / 100;
    return {
      subtotal,
      discount,
      final: Math.max(0, subtotal - discount),
      discountLabel: memberTierName
        ? `Hạng ${memberTierName} giảm ${tierDiscountPercent}%`
        : "Giảm hạng thành viên",
    };
  }

  function formatMoney(value: number | string | null | undefined) {
    return Number(value || 0).toLocaleString("vi-VN") + "đ";
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
                        {formatMoney(getBookingPricing(booking).final)}
                      </p>

                      {getBookingPricing(booking).discount > 0 && (
                        <div className="mt-1 text-xs">
                          <p className="text-gray-400 line-through">
                            {formatMoney(getBookingPricing(booking).subtotal)}
                          </p>
                          <p className="font-medium text-emerald-600">
                            {getBookingPricing(booking).discountLabel}: -
                            {formatMoney(getBookingPricing(booking).discount)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 font-semibold text-gray-700">Xe</p>

                    {booking.BookingItems?.map((item) => (
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

                        <div className="mt-3 border-t border-gray-200 pt-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Dịch vụ hiện tại
                          </p>

                          <div className="space-y-2">
                            {item.ServiceLineItems?.map((line) => (
                              <div
                                key={line.ServiceLineItemID || `${item.BookingItemID}-${line.ServiceID}`}
                                className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm"
                              >
                                <span className="font-medium text-sky-700">
                                  {line.Services?.ServiceName || "Dịch vụ"}
                                </span>
                                <span className="font-semibold text-gray-700">
                                  {formatMoney(line.LineTotal ?? line.UnitPrice)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
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
