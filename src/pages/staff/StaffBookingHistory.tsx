import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  FileText,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import axiosClient, { getErrorMessage } from "../../api/axiosClient";

type ServiceLineItem = {
  LineTotal?: number | string | null;
  PriceAtBooking?: number | string | null;
  Services?: { ServiceName?: string | null } | null;
};

type BookingItem = {
  Vehicles?: {
    LicensePlate?: string | null;
    Brand?: string | null;
    Model?: string | null;
  } | null;
  ServiceLineItems?: ServiceLineItem[];
};

type BookingGroup = {
  BookingCode?: string | null;
  BookingDate?: string | null;
  StartTime?: string | null;
  branches?: { BranchName?: string | null; Address?: string | null } | null;
  BookingItems?: BookingItem[];
};

type PaymentRecord = {
  Method?: string | null;
  Amount?: number | string | null;
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
    Users?: { FullName?: string | null; Phone?: string | null } | null;
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
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
}

function formatTime(value: string | null | undefined) {
  if (!value) return "—";
  if (value.includes("T")) return value.slice(11, 16);
  return value.slice(0, 5);
}

function paymentMethodLabel(method: string | null | undefined) {
  const labels: Record<string, string> = {
    CASH: "Tiền mặt",
    BANK_TRANSFER: "Chuyển khoản",
    VNPAY: "VNPay",
  };
  return method ? labels[method] || method : "—";
}

const StaffBookingHistory = () => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);

  useEffect(() => {
    async function loadInvoices() {
      const token = localStorage.getItem("token");

      try {
        setLoading(true);
        setError("");
        const response = await axiosClient.get("/api/invoices", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvoices(Array.isArray(response.data?.data) ? response.data.data : []);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    if (!keyword) return invoices;

    return invoices.filter((invoice) => {
      const transaction = invoice.Transactions;
      const booking = transaction.BookingGroups;
      const customer = transaction.Customers?.Users;
      const licensePlates = booking?.BookingItems?.map(
        (item) => item.Vehicles?.LicensePlate || "",
      ).join(" ");

      return [
        invoice.InvoiceNo,
        booking?.BookingCode,
        customer?.FullName,
        customer?.Phone,
        licensePlates,
      ].some((value) => value?.toLocaleLowerCase("vi").includes(keyword));
    });
  }, [invoices, search]);

  async function viewInvoice(invoiceId: number) {
    const token = localStorage.getItem("token");

    try {
      setDetailLoading(true);
      setError("");
      const response = await axiosClient.get(`/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedInvoice(response.data?.data || null);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setDetailLoading(false);
    }
  }

  const booking = selectedInvoice?.BookingGroups;
  const customer = selectedInvoice?.Customers?.Users;
  const payment = selectedInvoice?.PaymentRecords?.[0];
  const currentInvoice = selectedInvoice?.CurrentInvoice;

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Hóa đơn đã thực hiện
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">
            Lịch sử đặt lịch
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Xem lại các hóa đơn đã phát hành tại chi nhánh của bạn.
          </p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <span className="font-bold">{invoices.length}</span> hóa đơn
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <label className="relative block max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã hóa đơn, mã lịch, khách hàng, biển số..."
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        {error && (
          <div className="m-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
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
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Hóa đơn</th>
                  <th className="px-5 py-3">Lịch đặt</th>
                  <th className="px-5 py-3">Khách hàng</th>
                  <th className="px-5 py-3">Xe</th>
                  <th className="px-5 py-3">Thanh toán</th>
                  <th className="px-5 py-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((invoice) => {
                  const transaction = invoice.Transactions;
                  const invoiceBooking = transaction.BookingGroups;
                  const invoiceCustomer = transaction.Customers?.Users;
                  const plates = invoiceBooking?.BookingItems?.map(
                    (item) => item.Vehicles?.LicensePlate,
                  ).filter(Boolean);

                  return (
                    <tr key={invoice.InvoiceID} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{invoice.InvoiceNo || `#${invoice.InvoiceID}`}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDateTime(invoice.IssuedAt)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-700">{invoiceBooking?.BookingCode || "—"}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(invoiceBooking?.BookingDate)} · {formatTime(invoiceBooking?.StartTime)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-700">{invoiceCustomer?.FullName || "Khách vãng lai"}</p>
                        <p className="mt-1 text-xs text-slate-500">{invoiceCustomer?.Phone || "—"}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{plates?.join(", ") || "—"}</td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-emerald-600">{formatMoney(transaction.FinalAmount)}</p>
                        <p className="mt-1 text-xs text-slate-500">{paymentMethodLabel(transaction.PaymentRecords?.[0]?.Method)}</p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => viewInvoice(invoice.InvoiceID)}
                          disabled={detailLoading}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Eye size={16} /> Xem
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailLoading && !selectedInvoice && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50">
          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-xl">
            <LoaderCircle className="animate-spin text-blue-600" /> Đang tải chi tiết hóa đơn...
          </div>
        </div>
      )}

      {selectedInvoice && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Chi tiết hóa đơn</p>
                <h2 className="text-xl font-bold text-slate-800">{currentInvoice?.InvoiceNo || "Hóa đơn"}</h2>
              </div>
              <button type="button" onClick={() => setSelectedInvoice(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Đóng">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div><p className="text-xs text-slate-500">Ngày phát hành</p><p className="mt-1 font-semibold text-slate-800">{formatDateTime(currentInvoice?.IssuedAt)}</p></div>
                <div><p className="text-xs text-slate-500">Mã lịch</p><p className="mt-1 font-semibold text-slate-800">{booking?.BookingCode || "—"}</p></div>
                <div><p className="text-xs text-slate-500">Ngày đặt</p><p className="mt-1 font-semibold text-slate-800">{formatDate(booking?.BookingDate)} · {formatTime(booking?.StartTime)}</p></div>
                <div><p className="text-xs text-slate-500">Chi nhánh</p><p className="mt-1 font-semibold text-slate-800">{booking?.branches?.BranchName || "—"}</p></div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="font-bold text-slate-800">Khách hàng</h3>
                  <p className="mt-3 text-sm text-slate-700">{customer?.FullName || "Khách vãng lai"}</p>
                  <p className="mt-1 text-sm text-slate-500">{customer?.Phone || "Không có số điện thoại"}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="font-bold text-slate-800">Thanh toán</h3>
                  <p className="mt-3 text-sm text-slate-700">{paymentMethodLabel(payment?.Method)}</p>
                  <p className="mt-1 text-sm text-slate-500">{formatDateTime(payment?.ConfirmedAt)}</p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-bold text-slate-800">Xe và dịch vụ</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr><th className="px-4 py-3">Xe</th><th className="px-4 py-3">Dịch vụ</th><th className="px-4 py-3 text-right">Thành tiền</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {booking?.BookingItems?.flatMap((item, itemIndex) =>
                        (item.ServiceLineItems || []).map((line, lineIndex) => (
                          <tr key={`${itemIndex}-${lineIndex}`}>
                            <td className="px-4 py-3 font-medium text-slate-700">{item.Vehicles?.LicensePlate || "—"}<p className="text-xs font-normal text-slate-500">{[item.Vehicles?.Brand, item.Vehicles?.Model].filter(Boolean).join(" ")}</p></td>
                            <td className="px-4 py-3 text-slate-600">{line.Services?.ServiceName || "Dịch vụ"}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatMoney(line.LineTotal ?? line.PriceAtBooking)}</td>
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="ml-auto max-w-sm space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Tạm tính</span><span className="font-semibold">{formatMoney(selectedInvoice.Subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Giảm giá</span><span className="font-semibold text-red-600">-{formatMoney(selectedInvoice.DiscountAmount)}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base"><span className="font-bold text-slate-800">Tổng thanh toán</span><span className="font-bold text-blue-700">{formatMoney(selectedInvoice.FinalAmount)}</span></div>
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end border-t border-slate-200 bg-white px-6 py-4">
              <button type="button" onClick={() => setSelectedInvoice(null)} className="rounded-lg bg-slate-800 px-5 py-2.5 font-semibold text-white hover:bg-slate-900">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default StaffBookingHistory;
