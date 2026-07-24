import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  FileText,
  LoaderCircle,
  RefreshCw,
  Search,
  Star,
  X,
} from "lucide-react";
import axiosClient, { getErrorMessage } from "../../api/axiosClient";

type Review = {
  ReviewID: number;
  Rating: number;
  Comment?: string | null;
  CreatedAt?: string | null;
};

type ServiceLineItem = {
  LineItemID?: number;
  Quantity?: number | null;
  UnitPrice?: number | string | null;
  LineTotal?: number | string | null;
  Services?: {
    ServiceName?: string | null;
  } | null;
};

type BookingItem = {
  BookingItemID?: number;
  Status?: string | null;
  Vehicles?: {
    LicensePlate?: string | null;
    Brand?: string | null;
    Model?: string | null;
  } | null;
  ServiceLineItems?: ServiceLineItem[];
};

type BookingGroup = {
  BookingGroupID?: number;
  BookingCode?: string | null;
  BookingDate?: string | null;
  StartTime?: string | null;
  Status?: string | null;
  branches?: {
    BranchName?: string | null;
    Address?: string | null;
  } | null;
  BookingItems?: BookingItem[];
  Reviews?: Review | null;
};

type PaymentRecord = {
  PaymentID?: number;
  Method?: string | null;
  Amount?: number | string | null;
  Status?: string | null;
  ConfirmedAt?: string | null;
};

type TransactionData = {
  TransactionID: number;
  Subtotal?: number | string | null;
  DiscountAmount?: number | string | null;
  FinalAmount?: number | string | null;
  Status?: string | null;
  BookingGroups?: BookingGroup | null;
  Customers?: {
    Users?: {
      FullName?: string | null;
      Phone?: string | null;
    } | null;
  } | null;
  PaymentRecords?: PaymentRecord[];
};

type InvoiceRecord = {
  InvoiceID: number;
  InvoiceNo?: string | null;
  IssuedAt?: string | null;
  Status?: string | null;
  Transactions: TransactionData;
};

type InvoiceDetail = TransactionData & {
  CurrentInvoice?: Omit<InvoiceRecord, "Transactions">;
};

function formatMoney(value: number | string | null | undefined) {
  return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const dateValue = String(value).slice(0, 10);
  const date = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN");
}

function formatTime(value: string | null | undefined) {
  if (!value) return "—";
  const text = String(value);
  return text.includes("T") ? text.slice(11, 16) : text.slice(0, 5);
}

function paymentMethodLabel(method: string | null | undefined) {
  const labels: Record<string, string> = {
    CASH: "Tiền mặt",
    BANK_TRANSFER: "Chuyển khoản",
    VNPAY: "VNPay",
  };

  return method ? labels[method] || method : "—";
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : null;
}

function StaffInvoiceHistory() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(
    null
  );
  const [selectedReview, setSelectedReview] = useState<{
    bookingCode: string;
    review: Review;
  } | null>(null);

  const loadInvoices = useCallback(async () => {
    const headers = getAuthHeaders();

    if (!headers) {
      setInvoices([]);
      setError("Bạn cần đăng nhập bằng tài khoản Staff");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await axiosClient.get("/api/invoices", { headers });
      const data = response.data?.data;
      setInvoices(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setInvoices([]);
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const filteredInvoices = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    if (!keyword) return invoices;

    return invoices.filter((invoice) => {
      const transaction = invoice.Transactions;
      const booking = transaction.BookingGroups;
      const customer = transaction.Customers?.Users;
      const licensePlates = (booking?.BookingItems || [])
        .map((item) => item.Vehicles?.LicensePlate || "")
        .join(" ");

      return [
        invoice.InvoiceNo,
        booking?.BookingCode,
        customer?.FullName,
        customer?.Phone,
        licensePlates,
      ].some((value) =>
        String(value || "")
          .toLocaleLowerCase("vi")
          .includes(keyword)
      );
    });
  }, [invoices, search]);

  const reviewCount = useMemo(
    () =>
      invoices.filter(
        (invoice) => Boolean(invoice.Transactions.BookingGroups?.Reviews)
      ).length,
    [invoices]
  );

  async function viewInvoice(invoiceId: number) {
    const headers = getAuthHeaders();

    if (!headers) {
      setError("Bạn cần đăng nhập bằng tài khoản Staff");
      return;
    }

    try {
      setLoadingInvoiceId(invoiceId);
      setError("");

      const response = await axiosClient.get(`/api/invoices/${invoiceId}`, {
        headers,
      });
      setSelectedInvoice(response.data?.data || null);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoadingInvoiceId(null);
    }
  }

  function openReview(booking: BookingGroup | null | undefined) {
    if (!booking?.Reviews) return;

    setSelectedReview({
      bookingCode: booking.BookingCode || "Booking",
      review: booking.Reviews,
    });
  }

  const detailBooking = selectedInvoice?.BookingGroups;
  const detailCustomer = selectedInvoice?.Customers?.Users;
  const detailPayment = selectedInvoice?.PaymentRecords?.[0];
  const detailHeader = selectedInvoice?.CurrentInvoice;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-xl shadow-blue-500/20 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-100">
            Hóa đơn đã phát hành
          </p>
          <h1 className="mt-1 text-2xl font-bold">Lịch sử hóa đơn</h1>
          <p className="mt-1 text-sm text-blue-100">
            Xem hóa đơn và đánh giá của khách hàng tại chi nhánh của bạn.
          </p>
        </div>

        <div className="flex gap-3 text-sm">
          <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur">
            <span className="font-bold">{invoices.length}</span> hóa đơn
          </div>
          <div className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur">
            <span className="font-bold">{reviewCount}</span> đánh giá
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full max-w-xl">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã hóa đơn, mã booking, khách hàng, biển số..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <button
            type="button"
            onClick={loadInvoices}
            disabled={isLoading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        {error && (
          <div className="m-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-slate-500">
            <LoaderCircle className="animate-spin" size={20} />
            Đang tải lịch sử hóa đơn...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="mx-auto mb-3 text-slate-300" size={42} />
            Không tìm thấy hóa đơn phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Hóa đơn</th>
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-5 py-3">Khách hàng</th>
                  <th className="px-5 py-3">Xe</th>
                  <th className="px-5 py-3">Thanh toán</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((invoice) => {
                  const transaction = invoice.Transactions;
                  const booking = transaction.BookingGroups;
                  const customer = transaction.Customers?.Users;
                  const plates = (booking?.BookingItems || [])
                    .map((item) => item.Vehicles?.LicensePlate)
                    .filter(Boolean);
                  const review = booking?.Reviews;

                  return (
                    <tr
                      key={invoice.InvoiceID}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {invoice.InvoiceNo || `#${invoice.InvoiceID}`}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(invoice.IssuedAt)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-700">
                          {booking?.BookingCode || "—"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(booking?.BookingDate)} ·{" "}
                          {formatTime(booking?.StartTime)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-700">
                          {customer?.FullName || "Khách vãng lai"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {customer?.Phone || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {plates.join(", ") || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-emerald-600">
                          {formatMoney(transaction.FinalAmount)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {paymentMethodLabel(
                            transaction.PaymentRecords?.[0]?.Method
                          )}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={!review}
                            onClick={() => openReview(booking)}
                            className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-3 py-2 font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                          >
                            <Star size={16} />
                            {review ? `${review.Rating}/5` : "Chưa đánh giá"}
                          </button>
                          <button
                            type="button"
                            onClick={() => viewInvoice(invoice.InvoiceID)}
                            disabled={loadingInvoiceId !== null}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {loadingInvoiceId === invoice.InvoiceID ? (
                              <LoaderCircle className="animate-spin" size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                            Xem hóa đơn
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Chi tiết hóa đơn
                </p>
                <h2 className="text-xl font-bold text-slate-800">
                  {detailHeader?.InvoiceNo || "Hóa đơn"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Đóng hóa đơn"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500">Ngày phát hành</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {formatDateTime(detailHeader?.IssuedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Mã booking</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {detailBooking?.BookingCode || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Ngày đặt</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {formatDate(detailBooking?.BookingDate)} ·{" "}
                    {formatTime(detailBooking?.StartTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Chi nhánh</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {detailBooking?.branches?.BranchName || "—"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="font-bold text-slate-800">Khách hàng</h3>
                  <p className="mt-3 text-sm text-slate-700">
                    {detailCustomer?.FullName || "Khách vãng lai"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {detailCustomer?.Phone || "Không có số điện thoại"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="font-bold text-slate-800">Thanh toán</h3>
                  <p className="mt-3 text-sm text-slate-700">
                    {paymentMethodLabel(detailPayment?.Method)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDateTime(detailPayment?.ConfirmedAt)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-bold text-slate-800">Xe và dịch vụ</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Xe</th>
                        <th className="px-4 py-3">Dịch vụ</th>
                        <th className="px-4 py-3 text-center">SL</th>
                        <th className="px-4 py-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(detailBooking?.BookingItems || []).flatMap(
                        (item, itemIndex) =>
                          (item.ServiceLineItems || []).map(
                            (line, lineIndex) => (
                              <tr
                                key={
                                  line.LineItemID ||
                                  `${item.BookingItemID || itemIndex}-${lineIndex}`
                                }
                              >
                                <td className="px-4 py-3 font-medium text-slate-700">
                                  {item.Vehicles?.LicensePlate || "—"}
                                  <p className="text-xs font-normal text-slate-500">
                                    {[item.Vehicles?.Brand, item.Vehicles?.Model]
                                      .filter(Boolean)
                                      .join(" ")}
                                  </p>
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {line.Services?.ServiceName || "Dịch vụ"}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {line.Quantity || 1}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-800">
                                  {formatMoney(line.LineTotal ?? line.UnitPrice)}
                                </td>
                              </tr>
                            )
                          )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="ml-auto max-w-sm space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tạm tính</span>
                  <span className="font-semibold">
                    {formatMoney(selectedInvoice.Subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Giảm giá</span>
                  <span className="font-semibold text-red-600">
                    -{formatMoney(selectedInvoice.DiscountAmount)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                  <span className="font-bold text-slate-800">Tổng thanh toán</span>
                  <span className="font-bold text-blue-700">
                    {formatMoney(selectedInvoice.FinalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
              {detailBooking?.Reviews && (
                <button
                  type="button"
                  onClick={() => openReview(detailBooking)}
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-5 py-2.5 font-semibold text-amber-700 hover:bg-amber-50"
                >
                  <Star size={17} />
                  Xem đánh giá
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg bg-slate-800 px-5 py-2.5 font-semibold text-white hover:bg-slate-900"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedReview && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Đánh giá khách hàng
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-800">
                  {selectedReview.bookingCode}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng đánh giá"
              >
                <X size={21} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="text-center">
                <div className="flex justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={32}
                      className={
                        star <= selectedReview.review.Rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }
                    />
                  ))}
                </div>
                <p className="mt-2 font-bold text-amber-600">
                  {selectedReview.review.Rating}/5 sao
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bình luận
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {selectedReview.review.Comment?.trim() ||
                    "Khách hàng không để lại bình luận."}
                </p>
              </div>

              <div className="flex justify-between text-xs text-slate-500">
                <span>Ngày đánh giá</span>
                <span className="font-medium text-slate-700">
                  {formatDateTime(selectedReview.review.CreatedAt)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-800"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default StaffInvoiceHistory;
