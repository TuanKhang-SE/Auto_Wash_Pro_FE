import { useState, useEffect } from "react";
import {
    Bike,
    Clock3,
    CircleCheckBig,
    ClipboardList,
    Car,
    RefreshCw,
    Banknote,
    Landmark,
    CreditCard,
    Pencil,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import StatCard from "../../components/staff/StatCard";
import axiosClient, { getErrorMessage } from "../../api/axiosClient";

type ServiceLineItem = {
    ServiceID: number;
    UnitPrice?: number | string | null;
    LineTotal?: number | string | null;
    Services?: {
        ServiceName: string;
    };
};

type BranchServiceOption = {
    ServiceID: number;
    ServiceName: string;
    ActualPrice: number | string;
};

type ServiceEditorState = {
    booking: StaffBooking;
    item: BookingItem;
    mode: "add" | "edit";
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
    Transactions?: Array<{
        TransactionID: number;
        Status?: string | null;
        PaymentMethod?: string | null;
        FinalAmount?: number | string | null;
        PaidAt?: string | null;
    }>;
};

type StaffStats = {
    waiting: number;
    washing: number;
    completed: number;
    total: number;
};

type StaffSchedule = {
    ScheduleID: number;
    WorkDate: string;
    Status?: string | null;
    Shifts?: {
        ShiftName?: string | null;
        StartTime?: string | null;
        EndTime?: string | null;
    } | null;
};

type PaymentMethod = "CASH" | "BANK_TRANSFER" | "VNPAY";

type PaymentTransaction = {
    TransactionID: number;
    BookingGroupID: number | null;
    Subtotal: number | string | null;
    DiscountAmount: number | string | null;
    FinalAmount: number | string | null;
    Status: string | null;
};

type InvoiceRecord = {
    InvoiceID: number;
    InvoiceNo: string | null;
    IssuedAt: string | null;
    Status: string | null;
};

type InvoiceData = PaymentTransaction & {
    CreatedAt?: string | null;
    CurrentInvoice?: InvoiceRecord;
    Invoices?: InvoiceRecord[];
    Customers?: {
        Users?: {
            FullName?: string | null;
            Phone?: string | null;
        } | null;
    } | null;
    BookingGroups?: {
        BookingCode?: string | null;
        BookingDate?: string | null;
        StartTime?: string | null;
        branches?: {
            BranchName?: string | null;
            Address?: string | null;
            Phone?: string | null;
        } | null;
        BookingItems?: Array<{
            Vehicles?: {
                LicensePlate?: string | null;
                Brand?: string | null;
                Model?: string | null;
            } | null;
            ServiceLineItems?: Array<{
                Quantity?: number | null;
                UnitPrice?: number | string | null;
                LineTotal?: number | string | null;
                Services?: {
                    ServiceName?: string | null;
                } | null;
            }>;
        }>;
    } | null;
    PaymentRecords?: Array<{
        Method?: string | null;
        ConfirmedAt?: string | null;
    }>;
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

function formatMoney(value: number | string | null | undefined) {
    return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
}

function getLocalDateValue(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function timeToMinutes(value: string | null | undefined) {
    if (!value) return null;
    const text = String(value);
    const timePart = text.includes("T") ? text.substring(11, 16) : text.substring(0, 5);
    const [hours, minutes] = timePart.split(":").map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
    return hours * 60 + minutes;
}

function isNowInsideShift(schedule: StaffSchedule, now = new Date()) {
    const start = timeToMinutes(schedule.Shifts?.StartTime);
    const end = timeToMinutes(schedule.Shifts?.EndTime);
    if (start === null || end === null) return false;

    const current = now.getHours() * 60 + now.getMinutes();
    // Hỗ trợ cả ca qua đêm, ví dụ 22:00 - 06:00.
    return start <= end
        ? current >= start && current <= end
        : current >= start || current <= end;
}

function formatSelectedDate(value: string) {
    if (!value) return "";
    return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN");
}

function escapeHtml(value: unknown) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
        const entities: Record<string, string> = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
        };
        return entities[character];
    });
}

function getPaymentMethodLabel(method: string | null | undefined) {
    if (method === "CASH") return "Tiền mặt";
    if (method === "BANK_TRANSFER") return "Chuyển khoản";
    if (method === "VNPAY") return "VNPay";
    return method || "—";
}

function buildInvoiceHtml(invoice: InvoiceData) {
    const booking = invoice.BookingGroups;
    const branch = booking?.branches;
    const customer = invoice.Customers?.Users;
    const payment = invoice.PaymentRecords?.[0];
    const issuedInvoice = invoice.CurrentInvoice || invoice.Invoices?.find(
        (item) => item.Status === "ISSUED"
    );
    const lineItems = (booking?.BookingItems || []).flatMap((item) =>
        (item.ServiceLineItems || []).map((line) => ({
            vehicle: [
                item.Vehicles?.LicensePlate,
                item.Vehicles?.Brand,
                item.Vehicles?.Model,
            ].filter(Boolean).join(" - "),
            service: line.Services?.ServiceName || "Dịch vụ",
            quantity: line.Quantity || 1,
            unitPrice: line.UnitPrice,
            lineTotal: line.LineTotal,
        }))
    );
    const rows = lineItems.map((line, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(line.vehicle || "—")}</td>
            <td>${escapeHtml(line.service)}</td>
            <td class="center">${line.quantity}</td>
            <td class="right">${escapeHtml(formatMoney(line.unitPrice))}</td>
            <td class="right">${escapeHtml(formatMoney(line.lineTotal))}</td>
        </tr>
    `).join("");

    return `<!doctype html>
<html lang="vi">
<head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(issuedInvoice?.InvoiceNo || "Hóa đơn Auto Wash Pro")}</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; color: #0f172a; font: 14px Arial, sans-serif; }
        .invoice { width: 190mm; min-height: 270mm; margin: 0 auto; padding: 12mm; }
        .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #2563eb; padding-bottom: 16px; }
        h1 { margin: 0; color: #1d4ed8; font-size: 27px; }
        h2 { margin: 5px 0 0; font-size: 18px; }
        p { margin: 5px 0; }
        .invoice-meta { text-align: right; }
        .section { margin-top: 18px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 28px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #cbd5e1; padding: 9px 8px; vertical-align: top; }
        th { background: #eff6ff; text-align: left; }
        .right { text-align: right; }
        .center { text-align: center; }
        .totals { width: 310px; margin: 16px 0 0 auto; }
        .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
        .grand-total { border-top: 2px solid #0f172a; margin-top: 5px; padding-top: 10px; font-size: 18px; font-weight: 700; }
        .footer { margin-top: 36px; text-align: center; color: #475569; }
        @media print { .invoice { width: auto; min-height: auto; margin: 0; padding: 0; } }
    </style>
</head>
<body>
    <main class="invoice">
        <div class="header">
            <div>
                <h1>AUTO WASH PRO</h1>
                <h2>${escapeHtml(branch?.BranchName || "Chi nhánh")}</h2>
                <p>${escapeHtml(branch?.Address || "")}</p>
                <p>Điện thoại: ${escapeHtml(branch?.Phone || "—")}</p>
            </div>
            <div class="invoice-meta">
                <h2>HÓA ĐƠN THANH TOÁN</h2>
                <p><strong>Số:</strong> ${escapeHtml(issuedInvoice?.InvoiceNo || "—")}</p>
                <p><strong>Ngày:</strong> ${escapeHtml(
        new Date(issuedInvoice?.IssuedAt || Date.now()).toLocaleString("vi-VN")
    )}</p>
            </div>
        </div>

        <section class="section grid">
            <p><strong>Khách hàng:</strong> ${escapeHtml(customer?.FullName || "Khách lẻ")}</p>
            <p><strong>Số điện thoại:</strong> ${escapeHtml(customer?.Phone || "—")}</p>
            <p><strong>Mã booking:</strong> ${escapeHtml(booking?.BookingCode || "—")}</p>
            <p><strong>Phương thức:</strong> ${escapeHtml(getPaymentMethodLabel(payment?.Method))}</p>
        </section>

        <section class="section">
            <table>
                <thead>
                    <tr><th>STT</th><th>Xe</th><th>Dịch vụ</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr>
                </thead>
                <tbody>${rows || '<tr><td colspan="6" class="center">Không có chi tiết dịch vụ</td></tr>'}</tbody>
            </table>
        </section>

        <div class="totals">
            <div class="totals-row"><span>Tạm tính</span><strong>${escapeHtml(formatMoney(invoice.Subtotal))}</strong></div>
            <div class="totals-row"><span>Giảm giá</span><strong>-${escapeHtml(formatMoney(invoice.DiscountAmount))}</strong></div>
            <div class="totals-row grand-total"><span>Tổng thanh toán</span><span>${escapeHtml(formatMoney(invoice.FinalAmount))}</span></div>
        </div>

        <div class="footer">
            <p>Cảm ơn quý khách đã sử dụng dịch vụ Auto Wash Pro!</p>
            <p>Hóa đơn được tạo tự động từ hệ thống.</p>
        </div>
    </main>
</body>
</html>`;
}

function isBookingCompleted(booking: StaffBooking) {
    const items = booking.BookingItems || [];
    return items.length > 0 && items.every((item) => item.Status === "Completed");
}

function calculateStats(data: StaffBooking[]): StaffStats {
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

    return {
        waiting,
        washing,
        completed,
        total,
    };
}

function getUpdatedTimeFields(status: string) {
    const now = new Date().toISOString();

    if (status === "CheckedIn") {
        return {
            CheckInAt: now,
        };
    }

    if (status === "InProgress") {
        return {
            WashStartAt: now,
        };
    }

    if (status === "Completed") {
        return {
            CompletedAt: now,
        };
    }

    return {};
}

const StaffBookings = () => {
    const [selectedDate, setSelectedDate] = useState(getLocalDateValue);
    const [bookings, setBookings] = useState<StaffBooking[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
    const [message, setMessage] = useState("");
    const [paymentBooking, setPaymentBooking] = useState<StaffBooking | null>(null);
    const [paymentTransaction, setPaymentTransaction] =
        useState<PaymentTransaction | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
    const [paymentError, setPaymentError] = useState("");
    const [paymentSuccess, setPaymentSuccess] = useState("");
    const [isPreparingPayment, setIsPreparingPayment] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
    const [invoicePreviewHtml, setInvoicePreviewHtml] = useState("");
    const [serviceEditor, setServiceEditor] = useState<ServiceEditorState | null>(null);
    const [branchServiceOptions, setBranchServiceOptions] = useState<BranchServiceOption[]>([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(false);
    const [isSavingServices, setIsSavingServices] = useState(false);
    const [serviceError, setServiceError] = useState("");
    const [staffSchedules, setStaffSchedules] = useState<StaffSchedule[]>([]);
    const [accessNow, setAccessNow] = useState(() => new Date());
    const [isLoadingShift, setIsLoadingShift] = useState(false);

    const isSelectedToday = selectedDate === getLocalDateValue(accessNow);
    const activeShift = staffSchedules.find(
        (schedule) =>
            String(schedule.Status || "Active").toLowerCase() === "active" &&
            isNowInsideShift(schedule, accessNow)
    );
    const canOperate = isSelectedToday && Boolean(activeShift);
    const operationDisabledReason = !isSelectedToday
        ? "Chỉ được thao tác booking trong ngày hiện tại"
        : staffSchedules.length === 0
            ? "Bạn chưa được xếp ca làm hôm nay"
            : "Chỉ được thao tác trong đúng khung giờ ca làm được phân công";

    const [stats, setStats] = useState<StaffStats>({
        waiting: 0,
        washing: 0,
        completed: 0,
        total: 0,
    });

    useEffect(() => {
        fetchBookings();
        fetchStaffSchedules(selectedDate);
        // Chỉ tải ngày mặc định một lần khi mở trang.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => setAccessNow(new Date()), 30_000);
        return () => window.clearInterval(timer);
    }, []);

    async function fetchStaffSchedules(workDate: string) {
        const token = localStorage.getItem("token");
        if (!token) {
            setStaffSchedules([]);
            return;
        }

        try {
            setIsLoadingShift(true);
            const response = await axiosClient.get("/api/staff-schedules", {
                headers: { Authorization: `Bearer ${token}` },
                params: { from: workDate, to: workDate, Status: "Active" },
            });
            setStaffSchedules(response.data?.data || []);
            setAccessNow(new Date());
        } catch (error) {
            setStaffSchedules([]);
            setMessage(getErrorMessage(error));
        } finally {
            setIsLoadingShift(false);
        }
    }

    async function fetchBookings(silent = false, bookingDate = selectedDate) {
        try {
            if (!silent) setIsLoading(true);
            setMessage("");

            const token = localStorage.getItem("token");

            if (!token) {
                setMessage("Bạn cần đăng nhập bằng tài khoản staff");
                return;
            }

            const res = await axiosClient.get(
                "/api/staff-operations/today-bookings",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params: {
                        bookingDate,
                        refreshTime: Date.now(),
                    },
                }
            );

            const apiBookings: StaffBooking[] = res.data?.data || [];

            /*
             * Backend đã loại booking có Transaction.Status = Paid.
             * FE lọc thêm một lần để tránh dữ liệu cũ còn nằm trên giao diện.
             */
            const unpaidBookings = apiBookings.filter(
                (booking) =>
                    !booking.Transactions?.some(
                        (transaction) =>
                            String(transaction.Status || "").toLowerCase() ===
                            "paid"
                    )
            );

            setBookings(unpaidBookings);
            setStats(calculateStats(unpaidBookings));
        } catch (error) {
            console.log(error);
            setMessage(getErrorMessage(error));
        } finally {
            if (!silent) setIsLoading(false);
        }
    }

    async function updateItemStatus(bookingItemId: number, status: string) {
        if (!canOperate) {
            setMessage(operationDisabledReason);
            return;
        }

        try {
            setMessage("");
            setUpdatingItemId(bookingItemId);

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

            const updatedBookings = bookings.map((booking) => {
                const updatedItems = booking.BookingItems?.map((item) => {
                    if (item.BookingItemID !== bookingItemId) {
                        return item;
                    }

                    return {
                        ...item,
                        Status: status,
                        ...getUpdatedTimeFields(status),
                    };
                });

                const updatedBooking = {
                    ...booking,
                    BookingItems: updatedItems,
                };

                return isBookingCompleted(updatedBooking)
                    ? { ...updatedBooking, Status: "Completed" }
                    : updatedBooking;
            });

            setBookings(updatedBookings);
            setStats(calculateStats(updatedBookings));

            if (status === "Completed") {
                const completedBooking = updatedBookings.find((booking) =>
                    booking.BookingItems?.some(
                        (item) => item.BookingItemID === bookingItemId
                    )
                );

                if (completedBooking && isBookingCompleted(completedBooking)) {
                    await preparePayment(completedBooking);
                }
            }
        } catch (error) {
            console.log(error);
            setMessage(getErrorMessage(error));
        } finally {
            setUpdatingItemId(null);
        }
    }

    async function handleDateChange(value: string) {
        const nextDate = value || getLocalDateValue();
        setSelectedDate(nextDate);
        setAccessNow(new Date());
        await Promise.all([
            fetchBookings(false, nextDate),
            fetchStaffSchedules(nextDate),
        ]);
    }

    function getAuthHeader() {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : null;
    }

    async function openServiceEditor(
        booking: StaffBooking,
        item: BookingItem,
        mode: "add" | "edit"
    ) {
        if (!canOperate) {
            setMessage(operationDisabledReason);
            return;
        }

        if (item.Status !== "CheckedIn") {
            setMessage("Chỉ có thể thay đổi dịch vụ khi xe đang ở bước Check-in");
            return;
        }

        const headers = getAuthHeader();
        if (!headers) {
            setMessage("Bạn cần đăng nhập bằng tài khoản Staff");
            return;
        }

        setServiceEditor({ booking, item, mode });
        setSelectedServiceIds(
            mode === "edit"
                ? item.ServiceLineItems?.map((line) => line.ServiceID) || []
                : []
        );
        setBranchServiceOptions([]);
        setServiceError("");
        setIsLoadingServices(true);

        try {
            const response = await axiosClient.get(
                `/api/branches/${booking.BranchID}/services`,
                { headers }
            );
            setBranchServiceOptions(response.data?.data || []);
        } catch (error) {
            setServiceError(getErrorMessage(error));
        } finally {
            setIsLoadingServices(false);
        }
    }

    function closeServiceEditor() {
        if (isSavingServices) return;
        setServiceEditor(null);
        setBranchServiceOptions([]);
        setSelectedServiceIds([]);
        setServiceError("");
    }

    function toggleServiceSelection(serviceId: number) {
        setSelectedServiceIds((current) =>
            current.includes(serviceId)
                ? current.filter((id) => id !== serviceId)
                : [...current, serviceId]
        );
    }

    async function saveServices() {
        if (!serviceEditor) return;

        if (!canOperate) {
            setServiceError(operationDisabledReason);
            return;
        }

        if (selectedServiceIds.length === 0) {
            setServiceError(
                serviceEditor.mode === "add"
                    ? "Vui lòng chọn ít nhất một dịch vụ cần thêm"
                    : "Mỗi xe phải có ít nhất một dịch vụ"
            );
            return;
        }

        const headers = getAuthHeader();
        if (!headers) {
            setServiceError("Bạn cần đăng nhập bằng tài khoản Staff");
            return;
        }

        try {
            setIsSavingServices(true);
            setServiceError("");

            const path = `/api/staff-operations/booking-items/${serviceEditor.item.BookingItemID}`;
            if (serviceEditor.mode === "add") {
                await axiosClient.post(
                    `${path}/add-services`,
                    { serviceIds: selectedServiceIds },
                    { headers }
                );
            } else {
                await axiosClient.put(
                    `${path}/update-services`,
                    { serviceIds: selectedServiceIds },
                    { headers }
                );
            }

            closeServiceEditor();
            await fetchBookings(true);
        } catch (error) {
            setServiceError(getErrorMessage(error));
        } finally {
            setIsSavingServices(false);
        }
    }

    async function deleteService(item: BookingItem, serviceId: number) {
        if (!canOperate) {
            setMessage(operationDisabledReason);
            return;
        }

        const currentServiceIds = Array.from(
            new Set(item.ServiceLineItems?.map((line) => line.ServiceID) || [])
        );

        if (item.Status !== "CheckedIn") {
            setMessage("Chỉ có thể xóa dịch vụ khi xe đang ở bước Check-in");
            return;
        }

        if (currentServiceIds.length <= 1) {
            setMessage("Không thể xóa dịch vụ cuối cùng của xe");
            return;
        }

        if (!window.confirm("Bạn có chắc muốn xóa dịch vụ này khỏi xe?")) return;

        const headers = getAuthHeader();
        if (!headers) {
            setMessage("Bạn cần đăng nhập bằng tài khoản Staff");
            return;
        }

        try {
            setUpdatingItemId(item.BookingItemID);
            setMessage("");
            await axiosClient.put(
                `/api/staff-operations/booking-items/${item.BookingItemID}/update-services`,
                { serviceIds: currentServiceIds.filter((id) => id !== serviceId) },
                { headers }
            );
            await fetchBookings(true);
        } catch (error) {
            setMessage(getErrorMessage(error));
        } finally {
            setUpdatingItemId(null);
        }
    }

    async function preparePayment(booking: StaffBooking) {
        setPaymentBooking(booking);
        setPaymentTransaction(null);
        setPaymentMethod("CASH");
        setPaymentError("");
        setPaymentSuccess("");
        setIsPreparingPayment(true);

        try {
            const headers = getAuthHeader();
            if (!headers) {
                throw new Error("Bạn cần đăng nhập bằng tài khoản Staff");
            }

            const response = await axiosClient.post(
                `/api/transactions/from-booking/${booking.BookingGroupID}`,
                {},
                { headers }
            );

            const transaction = response.data?.data as PaymentTransaction | undefined;
            if (!transaction?.TransactionID) {
                throw new Error("Backend không trả về thông tin giao dịch");
            }

            setPaymentTransaction(transaction);
        } catch (error) {
            setPaymentError(getErrorMessage(error));
        } finally {
            setIsPreparingPayment(false);
        }
    }

    function closePaymentModal() {
        if (isPreparingPayment || isPaying || isLoadingInvoice) return;
        setPaymentBooking(null);
        setPaymentTransaction(null);
        setPaymentError("");
        setPaymentSuccess("");
        setInvoicePreviewHtml("");
    }

    async function showInvoicePreview(transactionId: number) {
        const headers = getAuthHeader();
        if (!headers) {
            setPaymentError("Bạn cần đăng nhập bằng tài khoản Staff");
            return false;
        }

        setIsLoadingInvoice(true);
        setPaymentError("");

        try {
            const previewResponse = await axiosClient.get(
                `/api/invoices/preview/${transactionId}`,
                { headers }
            );
            const preview = previewResponse.data?.data as InvoiceData | undefined;

            if (!preview) {
                throw new Error("Backend không trả về dữ liệu hóa đơn");
            }
            if (preview.Status !== "Paid") {
                throw new Error(
                    "VNPay chưa xác nhận thanh toán. Vui lòng đợi vài giây rồi thử in lại."
                );
            }

            let issuedInvoice = preview.Invoices?.find(
                (invoice) => invoice.Status === "ISSUED"
            );

            if (!issuedInvoice) {
                const generateResponse = await axiosClient.post(
                    `/api/invoices/generate/${transactionId}`,
                    {},
                    { headers }
                );
                issuedInvoice = generateResponse.data?.data as InvoiceRecord | undefined;
            }

            if (!issuedInvoice?.InvoiceID) {
                throw new Error("Không thể phát hành hóa đơn");
            }

            const invoiceResponse = await axiosClient.get(
                `/api/invoices/${issuedInvoice.InvoiceID}`,
                { headers }
            );
            const invoice = invoiceResponse.data?.data as InvoiceData | undefined;

            if (!invoice) {
                throw new Error("Không thể tải chi tiết hóa đơn");
            }

            setInvoicePreviewHtml(buildInvoiceHtml(invoice));

            setPaymentSuccess((current) =>
                current.includes("Hóa đơn")
                    ? current
                    : `${current} Hóa đơn mô phỏng đã sẵn sàng để xem.`.trim()
            );

            /*
             * Gọi lại API danh sách. Booking đã Paid sẽ không còn được
             * Backend trả về và sẽ biến mất khỏi trang quản lý.
             */
            await fetchBookings(true);

            return true;
        } catch (error) {
            setPaymentError(getErrorMessage(error));
            return false;
        } finally {
            setIsLoadingInvoice(false);
        }
    }

    async function handleViewInvoice() {
        if (!paymentTransaction) return;
        await showInvoicePreview(paymentTransaction.TransactionID);
    }

    async function handlePayment() {
        if (!paymentTransaction) return;

        const headers = getAuthHeader();
        if (!headers) {
            setPaymentError("Bạn cần đăng nhập bằng tài khoản Staff");
            return;
        }

        setPaymentError("");
        setPaymentSuccess("");
        setIsPaying(true);

        let paymentWindow: Window | null = null;

        try {
            if (paymentMethod === "VNPAY") {
                paymentWindow = window.open("about:blank", "_blank");
                if (!paymentWindow) {
                    throw new Error("Trình duyệt đang chặn cửa sổ thanh toán VNPay");
                }
                paymentWindow.opener = null;

                const response = await axiosClient.post(
                    `/api/transactions/${paymentTransaction.TransactionID}/create-vnpay-url`,
                    {},
                    { headers }
                );

                const paymentUrl = response.data?.data?.url as string | undefined;
                if (!paymentUrl) {
                    throw new Error("Backend không trả về đường dẫn thanh toán VNPay");
                }

                paymentWindow.location.href = paymentUrl;
                setPaymentSuccess(
                    "Đã mở VNPay. Giao dịch sẽ được xác nhận sau khi khách thanh toán thành công."
                );
                return;
            }

            await axiosClient.post(
                `/api/transactions/${paymentTransaction.TransactionID}/pay-manual`,
                { method: paymentMethod },
                { headers }
            );

            setPaymentTransaction((current) =>
                current ? { ...current, Status: "Paid" } : current
            );
            setPaymentSuccess(
                paymentMethod === "CASH"
                    ? "Đã xác nhận thanh toán tiền mặt thành công. Đơn đã được chuyển vào lịch sử."
                    : "Đã xác nhận thanh toán chuyển khoản thành công. Đơn đã được chuyển vào lịch sử."
            );

            /*
             * Làm đơn biến mất ngay sau khi Transaction chuyển thành Paid.
             * Đây chỉ là làm mới danh sách, không xóa dữ liệu trong database.
             */
            await fetchBookings(true);

            await showInvoicePreview(paymentTransaction.TransactionID);
        } catch (error) {
            if (paymentWindow && !paymentWindow.closed) {
                paymentWindow.close();
            }
            setPaymentError(getErrorMessage(error));
        } finally {
            setIsPaying(false);
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

    function isItemUpdating(itemId: number) {
        return updatingItemId === itemId;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-xl shadow-blue-500/20 md:flex-row md:items-end md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Quản lý đặt lịch</h2>

                    <p className="mt-1 text-blue-100">
                        Đang xem booking ngày {formatSelectedDate(selectedDate)} tại chi nhánh của bạn.
                    </p>
                </div>

                <label className="w-full md:w-auto">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-blue-100">
                        Chọn ngày cần xem
                    </span>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(event) => handleDateChange(event.target.value)}
                        disabled={isLoading || updatingItemId !== null}
                        className="w-full rounded-xl border border-white/30 bg-white px-4 py-2.5 font-semibold text-slate-800 outline-none ring-white/30 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70 md:w-48"
                    />
                </label>
            </div>

            <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                    canOperate
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                }`}
            >
                {isLoadingShift
                    ? "Đang kiểm tra ca làm việc..."
                    : canOperate
                        ? `Được phép thao tác · ${activeShift?.Shifts?.ShiftName || "Ca được phân công"} (${formatTime(activeShift?.Shifts?.StartTime)} - ${formatTime(activeShift?.Shifts?.EndTime)})`
                        : operationDisabledReason}
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
                    title="Xe hoàn thành"
                    value={stats.completed}
                    icon={<CircleCheckBig className="text-green-500" />}
                />

                <StatCard
                    title="Tổng xe trong ngày"
                    value={stats.total}
                    icon={<ClipboardList className="text-purple-500" />}
                />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Danh sách booking</h2>
                        <p className="text-sm text-slate-500">Ngày {formatSelectedDate(selectedDate)}</p>
                    </div>

                    <button
                        onClick={() => fetchBookings()}
                        disabled={isLoading || updatingItemId !== null}
                        className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                        Không có booking nào đang chờ xử lý trong ngày {formatSelectedDate(selectedDate)}
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

                                    <div className="flex items-center gap-3">
                                        <div className="text-sm font-semibold text-blue-600">
                                            Giờ hẹn: {formatTime(booking.StartTime)}
                                        </div>

                                        {isBookingCompleted(booking) && (
                                            <button
                                                type="button"
                                                onClick={() => preparePayment(booking)}
                                                disabled={isPreparingPayment || isPaying}
                                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Thanh toán
                                            </button>
                                        )}
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

                                                    <td className="px-4 py-3 text-sm text-slate-600">
                                                        <div className="flex max-w-sm flex-wrap gap-2">
                                                            {item.ServiceLineItems?.length ? (
                                                                item.ServiceLineItems.map((line) => (
                                                                    <span
                                                                        key={line.ServiceID}
                                                                        className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700"
                                                                    >
                                                                        {line.Services?.ServiceName || "Dịch vụ"}
                                                                        {item.Status === "CheckedIn" && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => deleteService(item, line.ServiceID)}
                                                                                disabled={
                                                                                    !canOperate ||
                                                                                    (item.ServiceLineItems?.length || 0) <= 1 ||
                                                                                    isItemUpdating(item.BookingItemID)
                                                                                }
                                                                                title={
                                                                                    !canOperate
                                                                                        ? operationDisabledReason
                                                                                        : (item.ServiceLineItems?.length || 0) <= 1
                                                                                            ? "Xe phải còn ít nhất một dịch vụ"
                                                                                            : "Xóa dịch vụ"
                                                                                }
                                                                                className="rounded-full p-0.5 text-sky-500 hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        )}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span>Chưa có dịch vụ</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-4">{getStatusBadge(item.Status)}</td>

                                                    <td className="px-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            {item.Status === "CheckedIn" && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openServiceEditor(booking, item, "add")}
                                                                        disabled={!canOperate || isItemUpdating(item.BookingItemID)}
                                                                        title={!canOperate ? operationDisabledReason : "Thêm dịch vụ"}
                                                                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                                                                    >
                                                                        <Plus size={14} /> Thêm dịch vụ
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openServiceEditor(booking, item, "edit")}
                                                                        disabled={!canOperate || isItemUpdating(item.BookingItemID)}
                                                                        title={!canOperate ? operationDisabledReason : "Sửa dịch vụ"}
                                                                        className="inline-flex items-center gap-1 rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                                                                    >
                                                                        <Pencil size={14} /> Sửa dịch vụ
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    !canOperate ||
                                                                    item.Status !== "Pending" ||
                                                                    isItemUpdating(item.BookingItemID)
                                                                }
                                                                onClick={() =>
                                                                    updateItemStatus(
                                                                        item.BookingItemID,
                                                                        "CheckedIn"
                                                                    )
                                                                }
                                                                className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                                            >
                                                                {isItemUpdating(item.BookingItemID)
                                                                    ? "Đang xử lý..."
                                                                    : "Check-in"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    !canOperate ||
                                                                    item.Status !== "CheckedIn" ||
                                                                    isItemUpdating(item.BookingItemID)
                                                                }
                                                                onClick={() =>
                                                                    updateItemStatus(
                                                                        item.BookingItemID,
                                                                        "InProgress"
                                                                    )
                                                                }
                                                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                                            >
                                                                {isItemUpdating(item.BookingItemID)
                                                                    ? "Đang xử lý..."
                                                                    : "Bắt đầu rửa"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    !canOperate ||
                                                                    item.Status !== "InProgress" ||
                                                                    isItemUpdating(item.BookingItemID)
                                                                }
                                                                onClick={() =>
                                                                    updateItemStatus(
                                                                        item.BookingItemID,
                                                                        "Completed"
                                                                    )
                                                                }
                                                                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                                            >
                                                                {isItemUpdating(item.BookingItemID)
                                                                    ? "Đang xử lý..."
                                                                    : "Hoàn thành"}
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

            {serviceEditor && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-start justify-between border-b border-slate-200 p-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {serviceEditor.mode === "add"
                                        ? "Thêm dịch vụ"
                                        : "Sửa danh sách dịch vụ"}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Xe {serviceEditor.item.Vehicles?.LicensePlate || "—"} · Chỉ thao tác tại bước Check-in
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeServiceEditor}
                                disabled={isSavingServices}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                                aria-label="Đóng"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5">
                            {serviceError && (
                                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {serviceError}
                                </div>
                            )}

                            {serviceEditor.mode === "edit" && (
                                <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                    Bỏ chọn để xóa dịch vụ. Mỗi xe bắt buộc phải còn ít nhất một dịch vụ.
                                </p>
                            )}

                            {isLoadingServices ? (
                                <div className="flex justify-center py-10">
                                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                </div>
                            ) : (
                                <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                                    {branchServiceOptions
                                        .filter((service) =>
                                            serviceEditor.mode === "edit" ||
                                            !serviceEditor.item.ServiceLineItems?.some(
                                                (line) => line.ServiceID === service.ServiceID
                                            )
                                        )
                                        .map((service) => {
                                            const checked = selectedServiceIds.includes(service.ServiceID);
                                            const isLastSelected =
                                                serviceEditor.mode === "edit" &&
                                                checked &&
                                                selectedServiceIds.length === 1;

                                            return (
                                                <label
                                                    key={service.ServiceID}
                                                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${checked
                                                            ? "border-blue-400 bg-blue-50"
                                                            : "border-slate-200 hover:bg-slate-50"
                                                        } ${isLastSelected ? "cursor-not-allowed" : "cursor-pointer"}`}
                                                >
                                                    <span className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            disabled={isLastSelected}
                                                            onChange={() => toggleServiceSelection(service.ServiceID)}
                                                            className="h-4 w-4"
                                                        />
                                                        <span className="font-medium text-slate-700">
                                                            {service.ServiceName}
                                                        </span>
                                                    </span>
                                                    <span className="text-sm font-semibold text-blue-700">
                                                        {formatMoney(service.ActualPrice)}
                                                    </span>
                                                </label>
                                            );
                                        })}

                                    {serviceEditor.mode === "add" &&
                                        branchServiceOptions.every((service) =>
                                            serviceEditor.item.ServiceLineItems?.some(
                                                (line) => line.ServiceID === service.ServiceID
                                            )
                                        ) && (
                                            <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                                                Xe đã sử dụng tất cả dịch vụ đang có tại chi nhánh.
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
                            <button
                                type="button"
                                onClick={closeServiceEditor}
                                disabled={isSavingServices}
                                className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={saveServices}
                                disabled={isSavingServices || isLoadingServices || selectedServiceIds.length === 0}
                                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSavingServices
                                    ? "Đang lưu..."
                                    : serviceEditor.mode === "add"
                                        ? "Thêm dịch vụ"
                                        : "Lưu thay đổi"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {paymentBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-start justify-between border-b border-slate-200 p-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    Thanh toán booking
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {paymentBooking.BookingCode} · {paymentBooking.Customers?.Users?.FullName || "Khách hàng"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closePaymentModal}
                                disabled={isPreparingPayment || isPaying || isLoadingInvoice}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                                aria-label="Đóng"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-5 p-5">
                            {isPreparingPayment ? (
                                <div className="flex items-center justify-center gap-3 py-10 text-slate-600">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                    Đang tạo giao dịch...
                                </div>
                            ) : paymentTransaction ? (
                                <>
                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <div className="flex justify-between text-sm text-slate-600">
                                            <span>Tạm tính</span>
                                            <span>{formatMoney(paymentTransaction.Subtotal)}</span>
                                        </div>
                                        <div className="mt-2 flex justify-between text-sm text-emerald-700">
                                            <span>Giảm giá</span>
                                            <span>-{formatMoney(paymentTransaction.DiscountAmount)}</span>
                                        </div>
                                        <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-slate-900">
                                            <span>Khách cần trả</span>
                                            <span className="text-blue-700">
                                                {formatMoney(paymentTransaction.FinalAmount)}
                                            </span>
                                        </div>
                                    </div>

                                    {paymentTransaction.Status !== "Paid" && !paymentSuccess && (
                                        <div>
                                            <p className="mb-3 text-sm font-semibold text-slate-700">
                                                Phương thức thanh toán
                                            </p>
                                            <div className="grid gap-3 sm:grid-cols-3">
                                                {([
                                                    ["CASH", "Tiền mặt", Banknote],
                                                    ["BANK_TRANSFER", "Chuyển khoản", Landmark],
                                                    ["VNPAY", "VNPay", CreditCard],
                                                ] as const).map(([value, label, Icon]) => (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() => setPaymentMethod(value)}
                                                        className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${paymentMethod === value
                                                                ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                                                                : "border-slate-200 text-slate-600 hover:border-blue-300"
                                                            }`}
                                                    >
                                                        <Icon size={22} />
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {paymentError && (
                                        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                                            {paymentError}
                                        </div>
                                    )}

                                    {paymentSuccess && (
                                        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                            {paymentSuccess}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={closePaymentModal}
                                            disabled={isPaying || isLoadingInvoice}
                                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            {paymentSuccess ? "Đóng" : "Thanh toán sau"}
                                        </button>

                                        {paymentSuccess && (
                                            <button
                                                type="button"
                                                onClick={handleViewInvoice}
                                                disabled={isLoadingInvoice || isPaying}
                                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
                                            >
                                                {isLoadingInvoice
                                                    ? "Đang tải hóa đơn..."
                                                    : paymentMethod === "VNPAY"
                                                        ? "Kiểm tra & xem hóa đơn"
                                                        : "Xem hóa đơn"}
                                            </button>
                                        )}

                                        {!paymentSuccess && paymentTransaction.Status !== "Paid" && (
                                            <button
                                                type="button"
                                                onClick={handlePayment}
                                                disabled={isPaying}
                                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                                            >
                                                {isPaying
                                                    ? "Đang xử lý..."
                                                    : paymentMethod === "VNPAY"
                                                        ? "Mở VNPay"
                                                        : "Xác nhận đã thanh toán"}
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4 py-4">
                                    <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {paymentError || "Không thể tạo giao dịch cho booking này."}
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={closePaymentModal}
                                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Đóng
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => preparePayment(paymentBooking)}
                                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                        >
                                            Thử lại
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {invoicePreviewHtml && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4">
                    <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    Hóa đơn mô phỏng
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Bản xem trước trên hệ thống, không gửi lệnh đến máy in.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setInvoicePreviewHtml("")}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                aria-label="Đóng bản xem hóa đơn"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <iframe
                            title="Hóa đơn mô phỏng"
                            srcDoc={invoicePreviewHtml}
                            sandbox=""
                            className="min-h-0 flex-1 bg-slate-100"
                        />

                        <div className="flex justify-end border-t border-slate-200 px-5 py-3">
                            <button
                                type="button"
                                onClick={() => setInvoicePreviewHtml("")}
                                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                            >
                                Đóng bản xem
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffBookings;