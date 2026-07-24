import { useState, useEffect, useCallback } from "react";
import {
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  ClipboardList,
  Search,
  Eye,
  X,
} from "lucide-react";
import bookingService, {
  type BookingGroup,
  type BookingStatus,
} from "../../services/bookingService";
import invoiceService, {
  type Invoice,
  type InvoiceStatus,
} from "../../services/invoiceService";
import { getErrorMessage } from "../../api/axiosClient";

type TabType = "bookings" | "invoices";

const BOOKING_STATUS_OPTIONS: { value: BookingStatus | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "CheckedIn", label: "Đã check-in" },
  { value: "InProgress", label: "Đang rửa" },
  { value: "Completed", label: "Hoàn thành" },
];

const INVOICE_STATUS_OPTIONS: { value: InvoiceStatus | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "ISSUED", label: "Đã phát hành" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const formatCurrency = (value: number | string | null | undefined) => {
  return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const formatTime = (timeStr: string | null | undefined) => {
  if (!timeStr) return "—";
  if (timeStr.includes("T")) {
    return timeStr.substring(11, 16);
  }
  return timeStr.substring(0, 5);
};

const getBookingStatusBadge = (status: string) => {
  const statusConfig: Record<string, { bg: string; text: string }> = {
    CheckedIn: { bg: "bg-purple-100", text: "text-purple-700" },
    InProgress: { bg: "bg-indigo-100", text: "text-indigo-700" },
    Completed: { bg: "bg-green-100", text: "text-green-700" },
  };
  const config = statusConfig[status] || { bg: "bg-gray-100", text: "text-gray-700" };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.text}`}>
      {status === "CheckedIn" && "Đã check-in"}
      {status === "InProgress" && "Đang rửa"}
      {status === "Completed" && "Hoàn thành"}
    </span>
  );
};

const getInvoiceStatusBadge = (status: string | null | undefined) => {
  const statusConfig: Record<string, { bg: string; text: string }> = {
    ISSUED: { bg: "bg-green-100", text: "text-green-700" },
    PENDING: { bg: "bg-yellow-100", text: "text-yellow-700" },
    CANCELLED: { bg: "bg-red-100", text: "text-red-700" },
  };
  const config = statusConfig[status || ""] || { bg: "bg-gray-100", text: "text-gray-700" };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.text}`}>
      {status === "ISSUED" && "Đã phát hành"}
      {status === "PENDING" && "Chờ xử lý"}
      {status === "CANCELLED" && "Đã hủy"}
    </span>
  );
};

const getPaymentMethodLabel = (method: string | null | undefined) => {
  if (method === "CASH") return "Tiền mặt";
  if (method === "BANK_TRANSFER") return "Chuyển khoản";
  if (method === "VNPAY") return "VNPay";
  return method || "—";
};

const ManagerBookingHistory = () => {
  const [activeTab, setActiveTab] = useState<TabType>("bookings");

  // Filters
  const [statusFilter, setStatusFilter] = useState<BookingStatus | InvoiceStatus | "">("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Data
  const [bookings, setBookings] = useState<BookingGroup[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);

  // Loading & Error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal
  const [selectedBooking, setSelectedBooking] = useState<BookingGroup | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const totalPages = Math.ceil(totalRecords / pageSize);

  // Fetch data when filters change
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === "bookings") {
        const query: Parameters<typeof bookingService.getBookings>[0] = {
          Status: statusFilter as BookingStatus | "",
          StartDate: startDate,
          EndDate: endDate,
          Page: currentPage,
          PageSize: pageSize,
        };

        const result = await bookingService.getBookings(query);
        let filteredData = result.data;

        if (searchQuery.trim()) {
          filteredData = filteredData.filter((b) =>
            b.BookingCode?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setBookings(filteredData);
        setTotalRecords(searchQuery.trim() ? filteredData.length : result.total);
      } else {
        const query: Parameters<typeof invoiceService.getInvoices>[0] = {
          Status: statusFilter as InvoiceStatus | "",
          StartDate: startDate,
          EndDate: endDate,
          Page: currentPage,
          PageSize: pageSize,
        };

        const result = await invoiceService.getInvoices(query);
        let filteredData = result.data;

        if (searchQuery.trim()) {
          filteredData = filteredData.filter((inv) =>
            inv.InvoiceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.BookingGroups?.BookingCode?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setInvoices(filteredData);
        setTotalRecords(searchQuery.trim() ? filteredData.length : result.total);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, statusFilter, startDate, endDate, searchQuery, currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery("");
    setStatusFilter("");
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData();
  };

  const handleReset = () => {
    setStatusFilter("");
    setStartDate(() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return d.toISOString().split("T")[0];
    });
    setEndDate(new Date().toISOString().split("T")[0]);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center justify-center gap-1 mt-4">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft size={18} />
        </button>
        {pages.map((page, idx) =>
          page === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => goToPage(page as number)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                currentPage === page
                  ? "bg-blue-500 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lịch sử</h1>
          <p className="mt-1 text-sm text-slate-500">
            Xem lịch sử booking và hóa đơn
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        <button
          onClick={() => handleTabChange("bookings")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            activeTab === "bookings"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <ClipboardList size={18} />
          Lịch sử Booking
        </button>
        <button
          onClick={() => handleTabChange("invoices")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            activeTab === "invoices"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <FileText size={18} />
          Lịch sử Hóa đơn
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Bộ lọc</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as BookingStatus | InvoiceStatus | "");
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {activeTab === "bookings"
                ? BOOKING_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))
                : INVOICE_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Từ ngày
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Đến ngày
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              {activeTab === "bookings" ? "Mã booking" : "Số hóa đơn"}
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={
                  activeTab === "bookings" ? "Tìm mã booking..." : "Tìm số hóa đơn..."
                }
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={handleReset}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Đặt lại
          </button>
          <button
            onClick={handleSearch}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition"
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : activeTab === "bookings" ? (
          bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <ClipboardList size={48} className="mb-3 opacity-30" />
              <p className="text-sm">Không có booking nào được tìm thấy</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Mã booking</th>
                    <th className="px-4 py-3">Khách hàng</th>
                    <th className="px-4 py-3">Ngày đặt</th>
                    <th className="px-4 py-3">Giờ hẹn</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((booking) => (
                    <tr key={booking.BookingGroupID} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-slate-800">
                          {booking.BookingCode}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-medium text-slate-800">
                            {booking.Customers?.FullName || "—"}
                          </p>
                          <p className="text-slate-500">
                            {booking.Customers?.Phone || "—"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(booking.BookingDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatTime(booking.StartTime)}
                      </td>
                      <td className="px-4 py-3">
                        {getBookingStatusBadge(booking.Status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                        >
                          <Eye size={14} />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <FileText size={48} className="mb-3 opacity-30" />
            <p className="text-sm">Không có hóa đơn nào được tìm thấy</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Số hóa đơn</th>
                  <th className="px-4 py-3">Mã booking</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Ngày phát hành</th>
                  <th className="px-4 py-3">Phương thức</th>
                  <th className="px-4 py-3 text-right">Tổng tiền</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.InvoiceID} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-slate-800">
                        {invoice.InvoiceNo || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {invoice.BookingGroups?.BookingCode || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-medium text-slate-800">
                          {invoice.Customers?.FullName || "—"}
                        </p>
                        <p className="text-slate-500">
                          {invoice.Customers?.Phone || "—"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDateTime(invoice.IssuedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {getPaymentMethodLabel(invoice.Transaction?.PaymentMethod)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(invoice.FinalAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getInvoiceStatusBadge(invoice.Status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                      >
                        <Eye size={14} />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalRecords > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-sm text-slate-500">
              Hiển thị {(currentPage - 1) * pageSize + 1} -{" "}
              {Math.min(currentPage * pageSize, totalRecords)} của {totalRecords} bản ghi
            </p>
            {renderPagination()}
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Chi tiết Booking
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {selectedBooking.BookingCode}
                </p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Trạng thái</p>
                  <div className="mt-0.5">
                    {getBookingStatusBadge(selectedBooking.Status)}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Ngày & Giờ hẹn</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatDate(selectedBooking.BookingDate)} - {formatTime(selectedBooking.StartTime)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium text-slate-500">Khách hàng</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedBooking.Customers?.FullName || "—"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedBooking.Customers?.Phone || "—"}
                  </p>
                </div>
              </div>

              {/* Booking Items */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                  Xe & Dịch vụ
                </h3>
                <div className="space-y-3">
                  {selectedBooking.BookingItems?.map((item) => (
                    <div key={item.BookingItemID} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-mono font-semibold text-slate-800">
                            {item.Vehicles?.LicensePlate || "—"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.Vehicles?.Brand} {item.Vehicles?.Model}
                          </p>
                        </div>
                        <div>
                          {getBookingStatusBadge(item.Status)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {item.ServiceLineItems?.map((service) => (
                          <div key={service.ServiceID} className="flex justify-between text-xs text-slate-600">
                            <span>{service.Services?.ServiceName || "Dịch vụ"}</span>
                            <span className="font-medium">
                              {formatCurrency(service.LineTotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction */}
              {selectedBooking.Transactions && selectedBooking.Transactions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    Thanh toán
                  </h3>
                  <div className="rounded-lg border border-slate-200 p-3">
                    {selectedBooking.Transactions.map((txn) => (
                      <div key={txn.TransactionID} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Phương thức</span>
                          <span className="font-medium text-slate-800">
                            {getPaymentMethodLabel(txn.PaymentMethod)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Trạng thái</span>
                          <span className="font-medium text-slate-800">
                            {txn.Status === "Paid" ? "Đã thanh toán" : txn.Status || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Số tiền</span>
                          <span className="font-semibold text-blue-600">
                            {formatCurrency(txn.FinalAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 p-5">
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Chi tiết Hóa đơn
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {selectedInvoice.InvoiceNo || "—"}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Số hóa đơn</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedInvoice.InvoiceNo || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Trạng thái</p>
                  <div className="mt-0.5">
                    {getInvoiceStatusBadge(selectedInvoice.Status)}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Mã booking</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedInvoice.BookingGroups?.BookingCode || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Ngày phát hành</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatDateTime(selectedInvoice.IssuedAt)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium text-slate-500">Khách hàng</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedInvoice.Customers?.FullName || "—"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedInvoice.Customers?.Phone || "—"}
                  </p>
                </div>
              </div>

              {/* Services */}
              {selectedInvoice.BookingGroups?.BookingItems && selectedInvoice.BookingGroups.BookingItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    Dịch vụ
                  </h3>
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-left text-xs text-slate-500">
                          <th className="px-3 py-2">Xe</th>
                          <th className="px-3 py-2">Dịch vụ</th>
                          <th className="px-3 py-2 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedInvoice.BookingGroups.BookingItems.flatMap((item) =>
                          (item.ServiceLineItems || []).map((service, idx) => (
                            <tr key={`${item.BookingItemID}-${idx}`}>
                              <td className="px-3 py-2 text-slate-600">
                                {item.Vehicles?.LicensePlate || "—"}
                              </td>
                              <td className="px-3 py-2 text-slate-600">
                                {service.Services?.ServiceName || "Dịch vụ"}
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-slate-800">
                                {formatCurrency(service.LineTotal)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tạm tính</span>
                    <span className="font-medium text-slate-800">
                      {formatCurrency(selectedInvoice.Subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Giảm giá</span>
                    <span className="font-medium text-emerald-600">
                      -{formatCurrency(selectedInvoice.DiscountAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <span className="font-semibold text-slate-800">Tổng thanh toán</span>
                    <span className="font-bold text-blue-600 text-lg">
                      {formatCurrency(selectedInvoice.FinalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction */}
              {selectedInvoice.Transaction && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    Thông tin thanh toán
                  </h3>
                  <div className="rounded-lg border border-slate-200 p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Phương thức</span>
                      <span className="font-medium text-slate-800">
                        {getPaymentMethodLabel(selectedInvoice.Transaction.PaymentMethod)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Trạng thái</span>
                      <span className="font-medium text-slate-800">
                        {selectedInvoice.Transaction.Status === "Paid" ? "Đã thanh toán" : selectedInvoice.Transaction.Status || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Thời gian</span>
                      <span className="font-medium text-slate-800">
                        {formatDateTime(selectedInvoice.Transaction.PaidAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 p-5">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerBookingHistory;
