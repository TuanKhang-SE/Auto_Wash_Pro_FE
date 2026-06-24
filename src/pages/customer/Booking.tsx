import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import axiosClient from "../../api/axiosClient";

type Branch = {
    id: number;
    name: string;
    address: string;
    phone: string;
    openTime: string;
    closeTime: string;
};

type Service = {
    id: number;
    name: string;
    price: number;
    duration: number;
};

type Reward = {
    id: number;
    name: string;
    requiredPoints: number;
    discountValue: number;
};

type Vehicle = {
    id: number;
    licensePlate: string;
    brand: string;
    model: string;
};

const branches: Branch[] = [
    {
        id: 1,
        name: "Auto Wash Pro - Chi nhánh Bình Thạnh",
        address: "643/40 Đường Xô Viết Nghệ Tĩnh, Bình Thạnh, TP. Hồ Chí Minh",
        phone: "1900 xxxx",
        openTime: "08:00",
        closeTime: "21:00",
    },
    {
        id: 2,
        name: "Auto Wash Pro - Chi nhánh Tăng Nhơn Phú",
        address: "Số 7 Đường D1, Phường Tăng Nhơn Phú, TP. Hồ Chí Minh",
        phone: "1900 xxxx",
        openTime: "08:00",
        closeTime: "21:00",
    },
    {
        id: 3,
        name: "Auto Wash Pro - Chi nhánh Đông Hòa",
        address: "Số 1 Đường Lưu Hữu Phước, Phường Đông Hòa, TP. Hồ Chí Minh",
        phone: "1900 xxxx",
        openTime: "08:00",
        closeTime: "21:00",
    },
];

const services: Service[] = [
    {
        id: 1,
        name: "Rửa xe cơ bản",
        price: 50000,
        duration: 30,
    },
    {
        id: 2,
        name: "Rửa xe cao cấp",
        price: 100000,
        duration: 45,
    },
    {
        id: 3,
        name: "Rửa xe và vệ sinh nội thất",
        price: 200000,
        duration: 90,
    },
];

const currentPoints = 300;

const rewards: Reward[] = [
    {
        id: 1,
        name: "Giảm 10.000đ",
        requiredPoints: 100,
        discountValue: 10000,
    },
    {
        id: 2,
        name: "Giảm 20.000đ",
        requiredPoints: 200,
        discountValue: 20000,
    },
    {
        id: 3,
        name: "Giảm 50.000đ",
        requiredPoints: 500,
        discountValue: 50000,
    },
];

const timeSlots = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
];

function Booking() {
    const userString = localStorage.getItem("user");
    const localUser = userString ? JSON.parse(userString) : null;

    const [fullName, setFullName] = useState(
        localUser?.fullName || localUser?.FullName || ""
    );

    const [phone, setPhone] = useState(
        localUser?.phone || localUser?.Phone || ""
    );

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loadingVehicles, setLoadingVehicles] = useState(false);

    const [branchId, setBranchId] = useState("");
    const [vehicleId, setVehicleId] = useState("");
    const [serviceId, setServiceId] = useState("");
    const [rewardId, setRewardId] = useState("");
    const [bookingDate, setBookingDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [note, setNote] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const today = useMemo(() => {
        return new Date().toISOString().split("T")[0];
    }, []);

    useEffect(() => {
        async function fetchVehicles() {
            try {
                setLoadingVehicles(true);

                const token = localStorage.getItem("token");

                if (!token) {
                    setMessage("Bạn cần đăng nhập để tải danh sách xe");
                    return;
                }

                const res = await axiosClient.get("/api/vehicles", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const apiVehicles = res.data?.data || res.data || [];
                const vehicleList = Array.isArray(apiVehicles)
                    ? apiVehicles
                    : apiVehicles?.vehicles || [];

                const mappedVehicles: Vehicle[] = vehicleList.map((vehicle: any) => ({
                    id: vehicle.VehicleID || vehicle.vehicleId || vehicle.id,
                    licensePlate:
                        vehicle.LicensePlate ||
                        vehicle.licensePlate ||
                        vehicle.license_plate ||
                        "",
                    brand: vehicle.Brand || vehicle.brand || "",
                    model: vehicle.Model || vehicle.model || "",
                }));

                setVehicles(mappedVehicles);
            } catch (error: any) {
                console.log(error.response?.data || error);
                setMessage("Không thể tải danh sách xe");
            } finally {
                setLoadingVehicles(false);
            }
        }

        fetchVehicles();
    }, []);

    const selectedBranch = branches.find(
        (branch) => String(branch.id) === branchId
    );

    const selectedVehicle = vehicles.find(
        (vehicle) => String(vehicle.id) === vehicleId
    );

    const selectedService = services.find(
        (service) => String(service.id) === serviceId
    );

    const selectedReward = rewards.find(
        (reward) => String(reward.id) === rewardId
    );

    const servicePrice = selectedService?.price || 0;

    const discountAmount =
        selectedReward && currentPoints >= selectedReward.requiredPoints
            ? selectedReward.discountValue
            : 0;

    const finalPrice = Math.max(servicePrice - discountAmount, 0);

    function formatMoney(value?: number) {
        if (!value) {
            return "0đ";
        }

        return value.toLocaleString("vi-VN") + "đ";
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setMessage("");

        if (!fullName.trim()) {
            setMessage("Vui lòng nhập họ và tên");
            return;
        }

        if (!phone.trim()) {
            setMessage("Vui lòng nhập số điện thoại");
            return;
        }

        if (!branchId) {
            setMessage("Vui lòng chọn chi nhánh");
            return;
        }

        if (!vehicleId) {
            setMessage("Vui lòng chọn xe");
            return;
        }

        if (!serviceId) {
            setMessage("Vui lòng chọn dịch vụ");
            return;
        }

        if (!bookingDate) {
            setMessage("Vui lòng chọn ngày đặt lịch");
            return;
        }

        if (!startTime) {
            setMessage("Vui lòng chọn khung giờ");
            return;
        }

        try {
            setIsSubmitting(true);

            const token = localStorage.getItem("token");

            if (!token) {
                setMessage("Bạn cần đăng nhập để đặt lịch");
                return;
            }

            const bookingPayload = {
                BranchID: Number(branchId),
                BookingDate: bookingDate,
                StartTime: startTime,
                Items: [
                    {
                        VehicleID: Number(vehicleId),
                        Services: [
                            {
                                ServiceID: Number(serviceId),
                            },
                        ],
                    },
                ],
            };

            console.log("Dữ liệu gửi lên API:", bookingPayload);

            const res = await axiosClient.post("/api/bookings", bookingPayload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("Kết quả API booking:", res.data);

            setMessage("Đặt lịch thành công! Lịch hẹn đã được lưu vào hệ thống.");
        } catch (error: any) {
            console.log(error.response?.data || error);

            setMessage(
                error.response?.data?.message || "Đặt lịch thất bại, vui lòng thử lại"
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <Navbar />

            <main className="min-h-screen bg-gray-100">
                <section className="bg-slate-800 px-6 py-10 text-white">
                    <div className="mx-auto max-w-6xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
                            Auto Wash Pro
                        </p>

                        <h1 className="mt-3 text-3xl font-bold">Đặt lịch rửa xe</h1>

                        <p className="mt-2 max-w-2xl text-slate-300">
                            Chọn chi nhánh, xe, dịch vụ và khung giờ phù hợp để đặt lịch rửa xe.
                        </p>
                    </div>
                </section>

                <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-3">
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-2xl bg-white p-6 shadow lg:col-span-2"
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-800">
                                Thông tin khách hàng
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Dấu <span className="text-red-500">*</span> là thông tin bắt buộc
                            </p>
                        </div>

                        {message && (
                            <div className="mb-5 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
                                {message}
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block font-semibold text-slate-700">
                                    Họ và tên <span className="text-red-500">*</span>
                                </label>

                                <input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Nhập họ và tên"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block font-semibold text-slate-700">
                                    Số điện thoại <span className="text-red-500">*</span>
                                </label>

                                <input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Nhập số điện thoại"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>
                        </div>

                        <div className="mt-8">
                            <h2 className="mb-4 text-xl font-bold text-slate-800">
                                Thông tin dịch vụ
                            </h2>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block font-semibold text-slate-700">
                                        Chọn chi nhánh <span className="text-red-500">*</span>
                                    </label>

                                    <select
                                        value={branchId}
                                        onChange={(e) => setBranchId(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    >
                                        <option value="">Chọn chi nhánh</option>

                                        {branches.map((branch) => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block font-semibold text-slate-700">
                                        Chọn xe <span className="text-red-500">*</span>
                                    </label>

                                    <select
                                        value={vehicleId}
                                        onChange={(e) => setVehicleId(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    >
                                        <option value="">
                                            {loadingVehicles
                                                ? "Đang tải danh sách xe..."
                                                : vehicles.length === 0
                                                    ? "Bạn chưa có xe nào"
                                                    : "Chọn xe của bạn"}
                                        </option>

                                        {vehicles.map((vehicle) => (
                                            <option key={vehicle.id} value={vehicle.id}>
                                                {vehicle.licensePlate} - {vehicle.brand} {vehicle.model}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block font-semibold text-slate-700">
                                        Ngày đặt lịch <span className="text-red-500">*</span>
                                    </label>

                                    <input
                                        type="date"
                                        min={today}
                                        value={bookingDate}
                                        onChange={(e) => setBookingDate(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block font-semibold text-slate-700">
                                        Chọn dịch vụ <span className="text-red-500">*</span>
                                    </label>

                                    <select
                                        value={serviceId}
                                        onChange={(e) => setServiceId(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    >
                                        <option value="">Chọn dịch vụ</option>

                                        {services.map((service) => (
                                            <option key={service.id} value={service.id}>
                                                {service.name} - {formatMoney(service.price)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-2 block font-semibold text-slate-700">
                                        Ưu đãi / Đổi điểm giảm giá
                                    </label>

                                    <select
                                        value={rewardId}
                                        onChange={(e) => setRewardId(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    >
                                        <option value="">Không sử dụng ưu đãi</option>

                                        {rewards.map((reward) => (
                                            <option
                                                key={reward.id}
                                                value={reward.id}
                                                disabled={currentPoints < reward.requiredPoints}
                                            >
                                                {reward.name} - Cần {reward.requiredPoints} điểm
                                                {currentPoints < reward.requiredPoints
                                                    ? " - Không đủ điểm"
                                                    : ""}
                                            </option>
                                        ))}
                                    </select>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Điểm hiện có:{" "}
                                        <span className="font-semibold text-sky-700">
                                            {currentPoints}
                                        </span>{" "}
                                        điểm
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <label className="mb-3 block font-semibold text-slate-700">
                                Chọn khung giờ dịch vụ <span className="text-red-500">*</span>
                            </label>

                            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
                                {timeSlots.map((time) => {
                                    const isSelected = startTime === time;

                                    return (
                                        <button
                                            key={time}
                                            type="button"
                                            onClick={() => setStartTime(time)}
                                            className={`rounded-xl border px-4 py-3 font-semibold transition ${isSelected
                                                    ? "border-sky-600 bg-sky-600 text-white"
                                                    : "border-gray-300 bg-white text-slate-600 hover:border-sky-500 hover:text-sky-600"
                                                }`}
                                        >
                                            {time}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-8">
                            <label className="mb-2 block font-semibold text-slate-700">
                                Ghi chú
                            </label>

                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Ví dụ: Xe nhiều bụi, cần rửa kỹ phần nội thất..."
                                rows={4}
                                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            />
                        </div>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-lg bg-sky-600 px-6 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                            >
                                {isSubmitting ? "Đang đặt lịch..." : "Đặt lịch"}
                            </button>

                            <Link
                                to="/register-car"
                                className="rounded-lg border border-gray-300 px-6 py-3 text-center font-semibold text-slate-700 transition hover:bg-gray-50"
                            >
                                Đăng ký xe mới
                            </Link>
                        </div>
                    </form>

                    <aside className="space-y-6">
                        <section className="rounded-2xl border border-sky-100 bg-sky-50 p-6 shadow">
                            <h2 className="text-xl font-bold text-slate-800">
                                Auto Wash Pro
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                Dịch vụ rửa xe nhanh, tiện lợi và chuyên nghiệp.
                            </p>

                            <div className="mt-5 space-y-3 text-sm">
                                <div>
                                    <p className="text-slate-500">Chi nhánh đã chọn</p>
                                    <p className="font-semibold text-slate-800">
                                        {selectedBranch?.name || "Chưa chọn chi nhánh"}
                                    </p>

                                    {selectedBranch?.address && (
                                        <p className="mt-1 text-slate-500">
                                            {selectedBranch.address}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <p className="text-slate-500">Hotline</p>
                                    <p className="font-semibold text-slate-800">
                                        {selectedBranch?.phone || "Chưa có hotline"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500">Giờ mở cửa</p>
                                    <p className="font-semibold text-slate-800">
                                        {selectedBranch
                                            ? `${selectedBranch.openTime} - ${selectedBranch.closeTime}`
                                            : "Chưa chọn chi nhánh"}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-sky-100 bg-sky-50 p-6 shadow">
                            <h2 className="text-xl font-bold text-slate-800">
                                Tóm tắt lịch hẹn
                            </h2>

                            <div className="mt-5 space-y-3 text-sm">
                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-500">Khách hàng</span>
                                    <span className="text-right font-semibold text-slate-800">
                                        {fullName || "Chưa nhập"}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-500">Số điện thoại</span>
                                    <span className="text-right font-semibold text-slate-800">
                                        {phone || "Chưa nhập"}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-500">Xe</span>
                                    <span className="text-right font-semibold text-slate-800">
                                        {selectedVehicle?.licensePlate || "Chưa chọn"}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-500">Dịch vụ</span>
                                    <span className="text-right font-semibold text-slate-800">
                                        {selectedService?.name || "Chưa chọn"}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-500">Thời lượng</span>
                                    <span className="font-semibold text-slate-800">
                                        {selectedService?.duration || 0} phút
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-500">Ngày</span>
                                    <span className="font-semibold text-slate-800">
                                        {bookingDate || "Chưa chọn"}
                                    </span>
                                </div>

                                <div className="flex justify-between gap-4">
                                    <span className="text-slate-500">Giờ</span>
                                    <span className="font-semibold text-slate-800">
                                        {startTime || "Chưa chọn"}
                                    </span>
                                </div>

                                <div className="border-t pt-3">
                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-500">Giá dịch vụ</span>
                                        <span className="font-semibold text-slate-800">
                                            {formatMoney(servicePrice)}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex justify-between gap-4">
                                        <span className="text-slate-500">Ưu đãi</span>
                                        <span className="text-right font-semibold text-slate-800">
                                            {selectedReward ? selectedReward.name : "Không sử dụng"}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex justify-between gap-4">
                                        <span className="text-slate-500">Điểm sử dụng</span>
                                        <span className="font-semibold text-slate-800">
                                            {selectedReward ? selectedReward.requiredPoints : 0} điểm
                                        </span>
                                    </div>

                                    <div className="mt-2 flex justify-between gap-4">
                                        <span className="text-slate-500">Giảm giá</span>
                                        <span className="font-semibold text-red-600">
                                            -{formatMoney(discountAmount)}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex justify-between gap-4 border-t pt-3">
                                        <span className="font-semibold text-slate-700">
                                            Thanh toán
                                        </span>
                                        <span className="text-xl font-bold text-sky-700">
                                            {formatMoney(finalPrice)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </aside>
                </section>
            </main>
        </>
    );
}

export default Booking;