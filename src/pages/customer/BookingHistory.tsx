import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import axiosClient, {
  getErrorMessage,
} from "../../api/axiosClient";

type BookingServiceLine = {
  ServiceLineItemID?: number;
  ServiceID: number;
  UnitPrice?: number | string | null;
  LineTotal?: number | string | null;

  Services?: {
    ServiceName?: string | null;
  } | null;
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

type BookingTransaction = {
  TransactionID: number;
  Subtotal?: number | string | null;
  DiscountAmount?: number | string | null;
  FinalAmount?: number | string | null;
  PaymentMethod?: string | null;
  Status?: string | null;
  PaidAt?: string | null;
};

type CustomerBooking = {
  BookingGroupID: number;
  BookingCode?: string | null;
  BookingDate?: string | null;
  StartTime?: string | null;
  CreatedAt?: string | null;
  Status: string;

  branches?: {
    BranchID?: number;
    BranchName?: string | null;
    Address?: string | null;
    Phone?: string | null;
  } | null;

  BookingItems?: CustomerBookingItem[];
  Transactions?: BookingTransaction[];
};

function getAuthHeader() {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function getStatusText(status: string) {
  switch (status) {
    case "Pending":
      return "Chờ xác nhận";

    case "Confirmed":
      return "Đã xác nhận";

    case "CheckedIn":
      return "Đã check-in";

    case "InProgress":
      return "Đang rửa";

    case "Completed":
      return "Hoàn thành";

    case "Cancelled":
      return "Đã hủy";

    default:
      return status || "Chưa cập nhật";
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "Pending":
      return "bg-amber-100 text-amber-700";

    case "Confirmed":
      return "bg-blue-100 text-blue-700";

    case "CheckedIn":
      return "bg-purple-100 text-purple-700";

    case "InProgress":
      return "bg-sky-100 text-sky-700";

    case "Completed":
      return "bg-emerald-100 text-emerald-700";

    case "Cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getOverallBookingStatus(
  booking: CustomerBooking
) {
  if (booking.Status === "Cancelled") {
    return "Cancelled";
  }

  const items = booking.BookingItems || [];

  if (items.length === 0) {
    return booking.Status || "Pending";
  }

  const activeItems = items.filter(
    (item) => item.Status !== "Cancelled"
  );

  if (activeItems.length === 0) {
    return "Cancelled";
  }

  const allCompleted = activeItems.every(
    (item) => item.Status === "Completed"
  );

  if (allCompleted) {
    return "Completed";
  }

  const hasInProgress = activeItems.some(
    (item) =>
      item.Status === "InProgress" ||
      item.Status === "Completed"
  );

  if (hasInProgress) {
    return "InProgress";
  }

  const hasCheckedIn = activeItems.some(
    (item) => item.Status === "CheckedIn"
  );

  if (hasCheckedIn) {
    return "CheckedIn";
  }

  const hasConfirmed = activeItems.some(
    (item) => item.Status === "Confirmed"
  );

  if (hasConfirmed) {
    return "Confirmed";
  }

  return booking.Status || "Pending";
}

/*
 * Kiểm tra booking đã thanh toán chưa.
 *
 * API cần trả:
 *
 * Transactions: [
 *   {
 *     Status: "Paid"
 *   }
 * ]
 */
function isBookingPaid(booking: CustomerBooking) {
  return (
    booking.Transactions?.some(
      (transaction) =>
        String(transaction.Status || "").toLowerCase() ===
        "paid"
    ) ?? false
  );
}

function getPaidTransaction(
  booking: CustomerBooking
) {
  return booking.Transactions?.find(
    (transaction) =>
      String(transaction.Status || "").toLowerCase() ===
      "paid"
  );
}

function BookingHistory() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<
    CustomerBooking[]
  >([]);

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [cancelingId, setCancelingId] = useState<
    number | null
  >(null);

  const [memberTierName, setMemberTierName] =
    useState("");

  const [
    tierDiscountPercent,
    setTierDiscountPercent,
  ] = useState(0);

  /*
   * Ngăn việc interval tạo thêm request
   * khi request trước chưa hoàn thành.
   */
  const isRefreshingRef = useRef(false);

  /*
   * Lấy thông tin hạng thành viên.
   */
  const loadMemberInformation =
    useCallback(async () => {
      try {
        const headers = getAuthHeader();

        if (!headers) {
          navigate("/login");
          return;
        }

        const response = await axiosClient.get(
          "/api/customers/profile",
          {
            headers,
          }
        );

        const loyaltyAccount =
          response.data?.data?.LoyaltyAccounts?.[0];

        const tierConfig =
          loyaltyAccount?.tier_configs;

        const discountPercent = Number(
          tierConfig?.DiscountPercent || 0
        );

        setMemberTierName(
          tierConfig?.TierName || ""
        );

        setTierDiscountPercent(
          Number.isFinite(discountPercent)
            ? Math.min(
              100,
              Math.max(0, discountPercent)
            )
            : 0
        );
      } catch (error) {
        console.log(
          "LOAD MEMBER INFORMATION ERROR:",
          error
        );
      }
    }, [navigate]);

  /*
   * Tải danh sách booking của Customer.
   *
   * silent = true:
   * tự làm mới ngầm, không làm màn hình nhấp nháy.
   */
  const loadBookings = useCallback(
    async (silent = false) => {
      if (isRefreshingRef.current) {
        return;
      }

      isRefreshingRef.current = true;

      if (!silent) {
        setLoading(true);
        setMessage("");
      }

      try {
        const headers = getAuthHeader();

        if (!headers) {
          navigate("/login");
          return;
        }

        const response = await axiosClient.get(
          "/api/bookings/me",
          {
            headers,

            /*
             * Thêm tham số thời gian để tránh cache.
             */
            params: {
              refreshTime: Date.now(),
            },
          }
        );

        if (response.data?.success) {
          setBookings(response.data.data || []);
        } else if (!silent) {
          setMessage(
            response.data?.message ||
            "Không thể tải lịch sử đặt lịch"
          );
        }
      } catch (error: unknown) {
        console.log(
          "LOAD CUSTOMER BOOKINGS ERROR:",
          error
        );

        if (!silent) {
          setMessage(getErrorMessage(error));
        }
      } finally {
        isRefreshingRef.current = false;

        if (!silent) {
          setLoading(false);
        }
      }
    },
    [navigate]
  );

  /*
   * Chạy lần đầu khi mở trang.
   */
  useEffect(() => {
    void loadMemberInformation();
    void loadBookings(false);
  }, [loadBookings, loadMemberInformation]);

  /*
   * Tự cập nhật trạng thái sau mỗi 3 giây.
   */
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadBookings(true);
      }
    }, 3000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadBookings(true);
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
  }, [loadBookings]);

  async function handleCancelBooking(
    bookingId: number
  ) {
    const confirmCancel = window.confirm(
      "Bạn có chắc muốn hủy lịch này không?"
    );

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
            if (
              booking.BookingGroupID !== bookingId
            ) {
              return booking;
            }

            return {
              ...booking,
              Status: "Cancelled",

              BookingItems:
                booking.BookingItems?.map(
                  (item) => ({
                    ...item,
                    Status: "Cancelled",
                  })
                ),
            };
          })
        );

        setMessage("Hủy lịch thành công");

        await loadBookings(true);
      } else {
        setMessage(
          response.data?.message ||
          "Hủy lịch thất bại"
        );
      }
    } catch (error: unknown) {
      console.log(
        "CANCEL BOOKING ERROR:",
        error
      );

      setMessage(getErrorMessage(error));
    } finally {
      setCancelingId(null);
    }
  }

  function formatDate(
    dateValue: string | null | undefined
  ) {
    if (!dateValue) {
      return "Chưa cập nhật";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return String(dateValue);
    }

    return date.toLocaleDateString("vi-VN");
  }

  function formatTime(
    timeValue: string | null | undefined
  ) {
    if (!timeValue) {
      return "Chưa cập nhật";
    }

    const text = String(timeValue);

    if (text.includes("T")) {
      return text.slice(11, 16);
    }

    return text.slice(0, 5);
  }

  function formatPaymentMethod(
    paymentMethod: string | null | undefined
  ) {
    switch (paymentMethod) {
      case "Cash":
        return "Tiền mặt";

      case "BankTransfer":
        return "Chuyển khoản";

      case "VNPAY":
      case "VNPay":
        return "VNPay";

      default:
        return paymentMethod || "";
    }
  }

  function canCancel(status: string) {
    return (
      status === "Pending" ||
      status === "Confirmed"
    );
  }

  function getBookingPricing(
    booking: CustomerBooking
  ) {
    let subtotal = 0;

    booking.BookingItems?.forEach((item) => {
      item.ServiceLineItems?.forEach((line) => {
        subtotal += Number(line.LineTotal || 0);
      });
    });

    const paidTransaction =
      getPaidTransaction(booking);

    const transaction =
      paidTransaction ||
      booking.Transactions?.[0];

    /*
     * Ưu tiên giá thật từ giao dịch.
     */
    if (
      transaction?.FinalAmount !== null &&
      transaction?.FinalAmount !== undefined
    ) {
      return {
        subtotal: Number(
          transaction.Subtotal ?? subtotal
        ),

        discount: Number(
          transaction.DiscountAmount || 0
        ),

        final: Number(
          transaction.FinalAmount
        ),

        discountLabel: "Đã giảm",
      };
    }

    /*
     * Khi chưa có giao dịch thì tạm tính
     * theo hạng thành viên.
     */
    const discount =
      (subtotal * tierDiscountPercent) / 100;

    return {
      subtotal,
      discount,

      final: Math.max(
        0,
        subtotal - discount
      ),

      discountLabel: memberTierName
        ? `Hạng ${memberTierName} giảm ${tierDiscountPercent}%`
        : "Giảm hạng thành viên",
    };
  }

  function formatMoney(
    value:
      | number
      | string
      | null
      | undefined
  ) {
    return (
      Number(value || 0).toLocaleString(
        "vi-VN"
      ) + "đ"
    );
  }

  /*
   * Lọc dựa trên trạng thái thật của từng xe.
   */
  const filteredBookings =
    statusFilter === "All"
      ? bookings
      : bookings.filter(
        (booking) =>
          getOverallBookingStatus(
            booking
          ) === statusFilter
      );

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          {/* Tiêu đề trang */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Lịch sử đặt lịch
              </h1>

              <p className="mt-1 text-gray-500">
                Xem trạng thái xử lý xe theo thời
                gian thực
              </p>

              <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />

                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>

                Tự động cập nhật sau mỗi 3 giây
              </div>
            </div>

            <Link
              to="/booking"
              className="rounded-lg bg-blue-600 px-4 py-2 text-center font-semibold text-white transition hover:bg-blue-700"
            >
              Đặt lịch mới
            </Link>
          </div>

          {/* Thông báo */}
          {message && (
            <p
              className={`mb-4 rounded-lg px-4 py-3 text-sm ${message.includes("thành công")
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
                }`}
            >
              {message}
            </p>
          )}

          {/* Bộ lọc */}
          <div className="mb-6 flex flex-col gap-3 rounded-xl bg-white p-4 shadow sm:flex-row sm:items-center">
            <label className="font-medium text-gray-700">
              Lọc trạng thái:
            </label>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">Tất cả</option>

              <option value="Pending">
                Chờ xác nhận
              </option>

              <option value="Confirmed">
                Đã xác nhận
              </option>

              <option value="CheckedIn">
                Đã check-in
              </option>

              <option value="InProgress">
                Đang rửa
              </option>

              <option value="Completed">
                Hoàn thành
              </option>

              <option value="Cancelled">
                Đã hủy
              </option>
            </select>

            <button
              type="button"
              onClick={() =>
                void loadBookings(false)
              }
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Đang tải..."
                : "Tải lại"}
            </button>
          </div>

          {/* Nội dung */}
          {loading ? (
            <div className="rounded-xl bg-white p-8 text-center shadow">
              <p className="text-gray-600">
                Đang tải lịch sử đặt lịch...
              </p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow">
              <p className="text-gray-500">
                Chưa có lịch đặt nào
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredBookings.map(
                (booking) => {
                  const overallStatus =
                    getOverallBookingStatus(
                      booking
                    );

                  const bookingPaid =
                    isBookingPaid(booking);

                  const paidTransaction =
                    getPaidTransaction(
                      booking
                    );

                  const pricing =
                    getBookingPricing(
                      booking
                    );

                  return (
                    <section
                      key={
                        booking.BookingGroupID
                      }
                      className="rounded-xl bg-white p-5 shadow"
                    >
                      {/* Header booking */}
                      <div className="mb-4">
                        <h2 className="text-xl font-bold text-gray-800">
                          {booking.BookingCode ||
                            `BK-${booking.BookingGroupID}`}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                          Ngày đặt:{" "}
                          {formatDate(
                            booking.CreatedAt
                          )}
                        </p>
                      </div>

                      {/* Thông tin booking */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-gray-500">
                            Ngày hẹn
                          </p>

                          <p className="font-semibold text-gray-800">
                            {formatDate(
                              booking.BookingDate
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">
                            Giờ bắt đầu
                          </p>

                          <p className="font-semibold text-gray-800">
                            {formatTime(
                              booking.StartTime
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">
                            Chi nhánh
                          </p>

                          <p className="font-semibold text-gray-800">
                            {booking.branches
                              ?.BranchName ||
                              "Chưa cập nhật"}
                          </p>

                          {booking.branches
                            ?.Address && (
                              <p className="text-sm text-gray-500">
                                {
                                  booking.branches
                                    .Address
                                }
                              </p>
                            )}
                        </div>

                        {/* Tổng tiền và thanh toán */}
                        <div>
                          <p className="text-sm text-gray-500">
                            Tổng tiền
                          </p>

                          <p className="font-semibold text-blue-700">
                            {formatMoney(
                              pricing.final
                            )}
                          </p>

                          {bookingPaid ? (
                            <div className="mt-2">
                              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                ✓ Đã thanh toán
                              </span>

                              {paidTransaction
                                ?.PaymentMethod && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    Phương thức:{" "}
                                    {formatPaymentMethod(
                                      paidTransaction.PaymentMethod
                                    )}
                                  </p>
                                )}
                            </div>
                          ) : (
                            <span className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              Chưa thanh toán
                            </span>
                          )}

                          {pricing.discount > 0 && (
                            <div className="mt-2 text-xs">
                              <p className="text-gray-400 line-through">
                                {formatMoney(
                                  pricing.subtotal
                                )}
                              </p>

                              <p className="font-medium text-emerald-600">
                                {
                                  pricing.discountLabel
                                }
                                : -
                                {formatMoney(
                                  pricing.discount
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Danh sách xe */}
                      <div className="mt-5">
                        <p className="mb-3 font-semibold text-gray-700">
                          Xe
                        </p>

                        <div className="space-y-3">
                          {booking.BookingItems?.map(
                            (item) => (
                              <div
                                key={
                                  item.BookingItemID
                                }
                                className="rounded-lg bg-gray-50 p-4"
                              >
                                {/* Thông tin xe */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="font-semibold text-gray-800">
                                      {item
                                        .Vehicles
                                        ?.LicensePlate ||
                                        "Chưa cập nhật"}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                      {item
                                        .Vehicles
                                        ?.Brand ||
                                        item
                                          .Vehicles
                                          ?.Make ||
                                        ""}{" "}
                                      {item
                                        .Vehicles
                                        ?.Model ||
                                        ""}
                                    </p>
                                  </div>

                                  <span
                                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                      item.Status
                                    )}`}
                                  >
                                    {getStatusText(
                                      item.Status
                                    )}
                                  </span>
                                </div>

                                {/* Tiến trình 4 bước */}
                                {item.Status !==
                                  "Cancelled" && (
                                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                      {/* Check-in */}
                                      <div
                                        className={`rounded-lg px-2 py-2 text-center text-xs font-semibold ${[
                                            "CheckedIn",
                                            "InProgress",
                                            "Completed",
                                          ].includes(
                                            item.Status
                                          )
                                            ? "bg-purple-100 text-purple-700"
                                            : "bg-gray-200 text-gray-400"
                                          }`}
                                      >
                                        Đã check-in
                                      </div>

                                      {/* Đang rửa */}
                                      <div
                                        className={`rounded-lg px-2 py-2 text-center text-xs font-semibold ${[
                                            "InProgress",
                                            "Completed",
                                          ].includes(
                                            item.Status
                                          )
                                            ? "bg-sky-100 text-sky-700"
                                            : "bg-gray-200 text-gray-400"
                                          }`}
                                      >
                                        Đang rửa
                                      </div>

                                      {/* Hoàn thành */}
                                      <div
                                        className={`rounded-lg px-2 py-2 text-center text-xs font-semibold ${item.Status ===
                                            "Completed"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-gray-200 text-gray-400"
                                          }`}
                                      >
                                        Hoàn thành
                                      </div>

                                      {/* Đã thanh toán */}
                                      <div
                                        className={`rounded-lg px-2 py-2 text-center text-xs font-semibold ${bookingPaid
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-200 text-gray-400"
                                          }`}
                                      >
                                        Đã thanh toán
                                      </div>
                                    </div>
                                  )}

                                {/* Dịch vụ */}
                                <div className="mt-4 border-t border-gray-200 pt-3">
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Dịch vụ hiện tại
                                  </p>

                                  <div className="space-y-2">
                                    {item
                                      .ServiceLineItems
                                      ?.length ? (
                                      item.ServiceLineItems.map(
                                        (line) => (
                                          <div
                                            key={
                                              line.ServiceLineItemID ||
                                              `${item.BookingItemID}-${line.ServiceID}`
                                            }
                                            className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm"
                                          >
                                            <span className="font-medium text-sky-700">
                                              {line
                                                .Services
                                                ?.ServiceName ||
                                                "Dịch vụ"}
                                            </span>

                                            <span className="font-semibold text-gray-700">
                                              {formatMoney(
                                                line.LineTotal ??
                                                line.UnitPrice
                                              )}
                                            </span>
                                          </div>
                                        )
                                      )
                                    ) : (
                                      <p className="text-sm text-gray-400">
                                        Chưa có thông
                                        tin dịch vụ
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Nút hủy */}
                      {canCancel(
                        overallStatus
                      ) && (
                          <div className="mt-5 flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                handleCancelBooking(
                                  booking.BookingGroupID
                                )
                              }
                              disabled={
                                cancelingId ===
                                booking.BookingGroupID
                              }
                              className="rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {cancelingId ===
                                booking.BookingGroupID
                                ? "Đang hủy..."
                                : "Hủy lịch"}
                            </button>
                          </div>
                        )}
                    </section>
                  );
                }
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default BookingHistory;