import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";

function formatMoney(value?: number) {
    if (!value) return "0đ";
    return value.toLocaleString("vi-VN") + "đ";
}

function BookingSuccess() {
    const location = useLocation();
    const navigate = useNavigate();

    const booking = location.state?.booking;
    const summary = location.state?.summary;

    if (!summary) {
        return (
            <>
                <Navbar />

                <main className="min-h-screen bg-gray-100 px-6 py-10">
                    <section className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow">
                        <h1 className="text-2xl font-bold text-slate-800">
                            Không tìm thấy thông tin đặt lịch
                        </h1>

                        <p className="mt-3 text-slate-500">
                            Vui lòng quay lại trang đặt lịch.
                        </p>

                        <button
                            onClick={() => navigate("/booking")}
                            className="mt-6 rounded-lg bg-sky-600 px-6 py-3 font-semibold text-white hover:bg-sky-700"
                        >
                            Quay lại đặt lịch
                        </button>
                    </section>
                </main>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-gray-100 px-6 py-10">
                <section className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow">
                    <div className="text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl font-bold text-green-600">
                            ✓
                        </div>

                        <h1 className="mt-4 text-3xl font-bold text-slate-800">
                            Đặt lịch thành công!
                        </h1>

                        <p className="mt-2 text-slate-500">
                            Lịch hẹn của bạn đã được lưu vào hệ thống.
                        </p>
                    </div>

                    <div className="mt-8 rounded-xl bg-sky-50 p-5">
                        <h2 className="text-xl font-bold text-slate-800">
                            Thông tin lịch hẹn
                        </h2>

                        <div className="mt-5 space-y-3 text-sm">
                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Mã lịch hẹn</span>
                                <span className="font-semibold text-slate-800">
                                    {booking?.BookingCode || booking?.bookingCode || "Đang cập nhật"}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Trạng thái</span>
                                <span className="font-semibold text-orange-600">
                                    Chờ xác nhận
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Khách hàng</span>
                                <span className="font-semibold text-slate-800">
                                    {summary.customerName}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Số điện thoại</span>
                                <span className="font-semibold text-slate-800">
                                    {summary.phone}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Chi nhánh</span>
                                <span className="text-right font-semibold text-slate-800">
                                    {summary.branchName}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Xe</span>
                                <span className="text-right font-semibold text-slate-800">
                                    {summary.vehicleName}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Dịch vụ</span>
                                <span className="text-right font-semibold text-slate-800">
                                    {summary.serviceName}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Thời lượng</span>
                                <span className="font-semibold text-slate-800">
                                    {summary.serviceDuration || 0} phút
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500">Ngày giờ</span>
                                <span className="font-semibold text-slate-800">
                                    {summary.bookingDate} lúc {summary.startTime}
                                </span>
                            </div>

                            {summary.note && (
                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-500">Ghi chú</span>
                                    <span className="text-right font-semibold text-slate-800">
                                        {summary.note}
                                    </span>
                                </div>
                            )}

                            <div className="border-t pt-3">
                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-500">Giá dịch vụ</span>
                                    <span className="font-semibold text-slate-800">
                                        {formatMoney(summary.servicePrice)}
                                    </span>
                                </div>

                                <div className="mt-2 flex justify-between gap-4">
                                    <span className="text-slate-500">Giảm giá</span>
                                    <span className="font-semibold text-red-600">
                                        -{formatMoney(summary.discountAmount)}
                                    </span>
                                </div>

                                <div className="mt-3 flex justify-between gap-4 border-t pt-3">
                                    <span className="font-bold text-slate-700">
                                        Thanh toán
                                    </span>
                                    <span className="text-xl font-bold text-sky-700">
                                        {formatMoney(summary.finalPrice)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link
                            to="/booking"
                            className="rounded-lg border border-gray-300 px-6 py-3 text-center font-semibold text-slate-700 hover:bg-gray-50"
                        >
                            Đặt lịch khác
                        </Link>

                        <Link
                            to="/home"
                            className="rounded-lg bg-sky-600 px-6 py-3 text-center font-semibold text-white hover:bg-sky-700"
                        >
                            Về trang chủ
                        </Link>
                    </div>
                </section>
            </main>
        </>
    );
}

export default BookingSuccess;