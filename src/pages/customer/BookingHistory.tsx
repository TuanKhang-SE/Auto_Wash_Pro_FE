import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "../../components/Navbar";

type BookingStatus =
    | "Pending"
    | "Confirmed"
    | "CheckedIn"
    | "InProgress"
    | "Completed"
    | "Cancelled";

type BookingHistoryItem = {
    BookingID: number;
    BookingCode: string;
    BookingDate: string;
    StartTime: string;
    EndTime: string;
    Status: BookingStatus;
    BranchName: string;
    BranchAddress: string;
    VehicleName: string;
    LicensePlate: string;
    Services: string[];
    TotalAmount: number;
    CreatedAt: string;
};

const mockBookings: BookingHistoryItem[] = [
    {
        BookingID: 1,
        BookingCode: "BK-20260701-001",
        BookingDate: "2026-07-01",
        StartTime: "08:00",
        EndTime: "08:30",
        Status: "Pending",
        BranchName: "Auto Wash Pro Quận 1",
        BranchAddress: "123 Nguyễn Huệ, Quận 1, TP.HCM",
        VehicleName: "Toyota Vios",
        LicensePlate: "51A-12345",
        Services: ["Rửa xe cơ bản"],
        TotalAmount: 80000,
        CreatedAt: "2026-07-01T07:30:00",
    },
    {
        BookingID: 2,
        BookingCode: "BK-20260628-002",
        BookingDate: "2026-06-28",
        StartTime: "14:00",
        EndTime: "15:00",
        Status: "Completed",
        BranchName: "Auto Wash Pro Thủ Đức",
        BranchAddress: "45 Võ Văn Ngân, Thủ Đức, TP.HCM",
        VehicleName: "Honda City",
        LicensePlate: "51G-67890",
        Services: ["Rửa xe cao cấp", "Vệ sinh nội thất"],
        TotalAmount: 220000,
        CreatedAt: "2026-06-27T20:15:00",
    },
    {
        BookingID: 3,
        BookingCode: "BK-20260625-003",
        BookingDate: "2026-06-25",
        StartTime: "10:30",
        EndTime: "11:00",
        Status: "Cancelled",
        BranchName: "Auto Wash Pro Bình Thạnh",
        BranchAddress: "88 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP.HCM",
        VehicleName: "Mazda 3",
        LicensePlate: "51F-24680",
        Services: ["Rửa xe cơ bản"],
        TotalAmount: 80000,
        CreatedAt: "2026-06-24T18:45:00",
    },
];

function formatMoney(value: number) {
    return value.toLocaleString("vi-VN") + "đ";
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString("vi-VN");
}

function getStatusText(status: BookingStatus) {
    switch (status) {
        case "Pending":
            return "Chờ xác nhận";
        case "Confirmed":
            return "Đã xác nhận";
        case "CheckedIn":
            return "Đã nhận xe";
        case "InProgress":
            return "Đang xử lý";
        case "Completed":
            return "Hoàn thành";
        case "Cancelled":
            return "Đã hủy";
        default:
            return status;
    }
}

function getStatusClass(status: BookingStatus) {
    switch (status) {
        case "Pending":
            return "bg-orange-100 text-orange-700";
        case "Confirmed":
            return "bg-blue-100 text-blue-700";
        case "CheckedIn":
            return "bg-indigo-100 text-indigo-700";
        case "InProgress":
            return "bg-sky-100 text-sky-700";
        case "Completed":
            return "bg-green-100 text-green-700";
        case "Cancelled":
            return "bg-red-100 text-red-700";
        default:
            return "bg-gray-100 text-gray-700";
    }
}

function BookingHistory() {
    const navigate = useNavigate();

    const [selectedStatus, setSelectedStatus] = useState<"All" | BookingStatus>(
        "All"
    );

    const filteredBookings =
        selectedStatus === "All"
            ? mockBookings
            : mockBookings.filter((booking) => booking.Status === selectedStatus);

    const totalBookings = mockBookings.length;

    const pendingBookings = mockBookings.filter(
        (booking) => booking.Status === "Pending"
    ).length;

    const completedBookings = mockBookings.filter(
        (booking) => booking.Status === "Completed"
    ).length;

    const cancelledBookings = mockBookings.filter(
        (booking) => booking.Status === "Cancelled"
    ).length;

    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-gray-100">
                <section className="bg-slate-800 px-6 py-10 text-white">
                    <div className="mx-auto max-w-6xl">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="mb-4 text-sm font-medium text-slate-300 hover:text-sky-300"
                        >
                            ← Quay lại
                        </button>

                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
                            Auto Wash Pro
                        </p>

                        <h1 className="mt-3 text-3xl font-bold">Lịch sử đặt lịch</h1>

                        <p className="mt-2 max-w-2xl text-slate-300">
                            Theo dõi các lịch rửa xe đã đặt, trạng thái xử lý và thông tin
                            dịch vụ của bạn.
                        </p>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-6 py-8">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="rounded-2xl bg-white p-5 shadow-sm">
                            <p className="text-sm text-slate-500">Tổng lịch đặt</p>
                            <p className="mt-2 text-3xl font-bold text-slate-800">
                                {totalBookings}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white p-5 shadow-sm">
                            <p className="text-sm text-slate-500">Chờ xác nhận</p>
                            <p className="mt-2 text-3xl font-bold text-orange-600">
                                {pendingBookings}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white p-5 shadow-sm">
                            <p className="text-sm text-slate-500">Hoàn thành</p>
                            <p className="mt-2 text-3xl font-bold text-green-600">
                                {completedBookings}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white p-5 shadow-sm">
                            <p className="text-sm text-slate-500">Đã hủy</p>
                            <p className="mt-2 text-3xl font-bold text-red-600">
                                {cancelledBookings}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    Danh sách lịch hẹn
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Bạn có thể lọc lịch hẹn theo trạng thái.
                                </p>
                            </div>

                            <Link
                                to="/booking"
                                className="rounded-lg bg-sky-600 px-5 py-3 text-center font-semibold text-white hover:bg-sky-700"
                            >
                                Đặt lịch mới
                            </Link>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                            {[
                                { label: "Tất cả", value: "All" },
                                { label: "Chờ xác nhận", value: "Pending" },
                                { label: "Đã xác nhận", value: "Confirmed" },
                                { label: "Đang xử lý", value: "InProgress" },
                                { label: "Hoàn thành", value: "Completed" },
                                { label: "Đã hủy", value: "Cancelled" },
                            ].map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() =>
                                        setSelectedStatus(item.value as "All" | BookingStatus)
                                    }
                                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${selectedStatus === item.value
                                            ? "bg-sky-600 text-white"
                                            : "bg-gray-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700"
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredBookings.length === 0 ? (
                        <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-3xl">
                                📅
                            </div>

                            <h2 className="mt-4 text-xl font-bold text-slate-800">
                                Chưa có lịch đặt nào
                            </h2>

                            <p className="mt-2 text-slate-500">
                                Khi bạn đặt lịch rửa xe, thông tin sẽ hiển thị tại đây.
                            </p>

                            <Link
                                to="/booking"
                                className="mt-5 inline-block rounded-lg bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700"
                            >
                                Đặt lịch ngay
                            </Link>
                        </div>
                    ) : (
                        <div className="mt-6 space-y-5">
                            {filteredBookings.map((booking) => (
                                <div
                                    key={booking.BookingID}
                                    className="overflow-hidden rounded-2xl bg-white shadow-sm"
                                >
                                    <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-5 md:flex-row md:items-center">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-xl font-bold text-slate-800">
                                                    {booking.BookingCode}
                                                </h3>

                                                <span
                                                    className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusClass(
                                                        booking.Status
                                                    )}`}
                                                >
                                                    {getStatusText(booking.Status)}
                                                </span>
                                            </div>

                                            <p className="mt-2 text-sm text-slate-500">
                                                Ngày tạo lịch: {formatDate(booking.CreatedAt)}
                                            </p>
                                        </div>

                                        <div className="text-left md:text-right">
                                            <p className="text-sm text-slate-500">
                                                Thanh toán dự kiến
                                            </p>

                                            <p className="text-2xl font-bold text-sky-700">
                                                {formatMoney(booking.TotalAmount)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-5 p-5 lg:grid-cols-3">
                                        <div className="rounded-xl bg-slate-50 p-4">
                                            <p className="text-sm text-slate-500">Thời gian hẹn</p>

                                            <p className="mt-2 text-lg font-bold text-slate-800">
                                                {formatDate(booking.BookingDate)}
                                            </p>

                                            <p className="mt-1 font-semibold text-sky-700">
                                                {booking.StartTime} - {booking.EndTime}
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-4">
                                            <p className="text-sm text-slate-500">Chi nhánh</p>

                                            <p className="mt-2 font-bold text-slate-800">
                                                {booking.BranchName}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500">
                                                {booking.BranchAddress}
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-4">
                                            <p className="text-sm text-slate-500">Xe</p>

                                            <p className="mt-2 font-bold text-slate-800">
                                                {booking.LicensePlate}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500">
                                                {booking.VehicleName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 px-5 py-4">
                                        <p className="text-sm font-semibold text-slate-700">
                                            Dịch vụ đã chọn
                                        </p>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {booking.Services.map((service) => (
                                                <span
                                                    key={service}
                                                    className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700"
                                                >
                                                    {service}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end">
                                        <button
                                            type="button"
                                            className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-slate-700 hover:bg-white"
                                        >
                                            Xem chi tiết
                                        </button>

                                        {booking.Status === "Pending" && (
                                            <button
                                                type="button"
                                                className="rounded-lg border border-red-300 px-5 py-2.5 font-semibold text-red-600 hover:bg-red-50"
                                            >
                                                Hủy lịch
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}

export default BookingHistory;