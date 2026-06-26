import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const currentPoints = 300;

const temporaryServices: Service[] = [
    {
        id: 1,
        name: "Rửa xe cơ bản",
        price: 50000,
        duration: 30,
    },
    {
        id: 2,
        name: "Rửa xe bọt tuyết",
        price: 80000,
        duration: 45,
    },
    {
        id: 3,
        name: "Rửa nội thất",
        price: 120000,
        duration: 60,
    },
    {
        id: 4,
        name: "Combo rửa xe cao cấp",
        price: 180000,
        duration: 90,
    },
];

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

function getArrayData(responseData: any, key: string) {
    if (Array.isArray(responseData)) {
        return responseData;
    }

    if (Array.isArray(responseData?.data)) {
        return responseData.data;
    }

    if (Array.isArray(responseData?.data?.[key])) {
        return responseData.data[key];
    }

    if (Array.isArray(responseData?.[key])) {
        return responseData[key];
    }

    if (Array.isArray(responseData?.result)) {
        return responseData.result;
    }

    if (Array.isArray(responseData?.data?.result)) {
        return responseData.data.result;
    }

    if (Array.isArray(responseData?.rows)) {
        return responseData.rows;
    }

    if (Array.isArray(responseData?.data?.rows)) {
        return responseData.data.rows;
    }

    return [];
}

function formatTime(value?: string | null) {
    if (!value) {
        return "--:--";
    }

    return String(value).slice(0, 5);
}

function Booking() {
    const navigate = useNavigate();

    const userString = localStorage.getItem("user");
    const localUser = userString ? JSON.parse(userString) : null;

    const [fullName, setFullName] = useState(
        localUser?.fullName || localUser?.FullName || ""
    );

    const [phone, setPhone] = useState(
        localUser?.phone || localUser?.Phone || ""
    );

    const [branches, setBranches] = useState<Branch[]>([]);
    const [services, setServices] = useState<Service[]>(temporaryServices);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingServices, setLoadingServices] = useState(false);
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
        async function fetchBookingData() {
            try {
                setLoadingBranches(true);
                setLoadingVehicles(true);
                setLoadingServices(false);
                setMessage("");

                const token = localStorage.getItem("token");

                if (!token) {
                    setMessage("Bạn cần đăng nhập để tải dữ liệu đặt lịch");
                    return;
                }

                const headers = {
                    Authorization: `Bearer ${token}`,
                };

                const [branchRes, vehicleRes] = await Promise.all([
                    axiosClient.get("/api/branches", { headers }),
                    axiosClient.get("/api/vehicles", { headers }),
                ]);

                console.log("Branch API response:", branchRes.data);
                console.log("Vehicle API response:", vehicleRes.data);

                const branchList = getArrayData(branchRes.data, "branches");
                const vehicleList = getArrayData(vehicleRes.data, "vehicles");

                const mappedBranches: Branch[] = branchList.map((branch: any) => ({
                    id: Number(
                        branch.BranchID ||
                        branch.BranchId ||
                        branch.branchId ||
                        branch.id
                    ),
                    name:
                        branch.BranchName ||
                        branch.branchName ||
                        branch.Name ||
                        branch.name ||
                        "Chi nhánh chưa có tên",
                    address:
                        branch.Address ||
                        branch.address ||
                        branch.BranchAddress ||
                        branch.branchAddress ||
                        "",
                    phone:
                        branch.Phone ||
                        branch.phone ||
                        branch.Hotline ||
                        branch.hotline ||
                        "1900 xxxx",
                    openTime: formatTime(
                        branch.OpenTime ||
                        branch.openTime ||
                        branch.OpeningTime ||
                        branch.openingTime ||
                        "08:00"
                    ),
                    closeTime: formatTime(
                        branch.CloseTime ||
                        branch.closeTime ||
                        branch.ClosingTime ||
                        branch.closingTime ||
                        "21:00"
                    ),
                }));

                const mappedVehicles: Vehicle[] = vehicleList.map((vehicle: any) => ({
                    id: Number(
                        vehicle.VehicleID ||
                        vehicle.VehicleId ||
                        vehicle.vehicleId ||
                        vehicle.id
                    ),
                    licensePlate:
                        vehicle.LicensePlate ||
                        vehicle.licensePlate ||
                        vehicle.license_plate ||
                        "",
                    brand: vehicle.Brand || vehicle.brand || "",
                    model: vehicle.Model || vehicle.model || "",
                }));

                setBranches(mappedBranches);
                setVehicles(mappedVehicles);
                setServices(temporaryServices);
            } catch (error: any) {
                console.log(error.response?.data || error);
                setMessage("Không thể tải dữ liệu đặt lịch");
                window.scrollTo({ top: 0, behavior: "smooth" });
            } finally {
                setLoadingBranches(false);
                setLoadingServices(false);
                setLoadingVehicles(false);
            }
        }

        fetchBookingData();
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

    function showMessage(text: string) {
        setMessage(text);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        setMessage("");

        if (!fullName.trim()) {
            showMessage("Vui lòng nhập họ và tên");
            return;
        }

        if (!phone.trim()) {
            showMessage("Vui lòng nhập số điện thoại");
            return;
        }

        if (!branchId) {
            showMessage("Vui lòng chọn chi nhánh");
            return;
        }

        if (!vehicleId) {
            showMessage("Vui lòng chọn xe");
            return;
        }

        if (!serviceId) {
            showMessage("Vui lòng chọn dịch vụ");
            return;
        }

        if (!bookingDate) {
            showMessage("Vui lòng chọn ngày đặt lịch");
            return;
        }

        if (!startTime) {
            showMessage("Vui lòng chọn khung giờ");
            return;
        }

        try {
            setIsSubmitting(true);

            const fakeBookingData = {
                BookingCode: `BK-${Date.now()}`,
                Status: "Pending",
                BranchID: Number(branchId),
                BookingDate: bookingDate,
                StartTime: startTime,
            };

            navigate("/booking-success", {
                state: {
                    booking: fakeBookingData,
                    summary: {
                        customerName: fullName,
                        phone,
                        branchName: selectedBranch?.name || "",
                        vehicleName: selectedVehicle
                            ? `${selectedVehicle.licensePlate} - ${selectedVehicle.brand} ${selectedVehicle.model}`
                            : "",
                        serviceName: selectedService?.name || "",
                        serviceDuration: selectedService?.duration || 0,
                        servicePrice,
                        discountAmount,
                        finalPrice,
                        bookingDate,
                        startTime,
                        note,
                    },
                },
            });
        } catch (error: any) {
            console.log(error);
            showMessage("Đặt lịch thất bại, vui lòng thử lại");
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
                            <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
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
                                        onChange={(e) => {
                                            setBranchId(e.target.value);
                                            setServiceId("");
                                            setStartTime("");
                                        }}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    >
                                        <option value="">
                                            {loadingBranches
                                                ? "Đang tải chi nhánh..."
                                                : branches.length === 0
                                                    ? "Chưa có chi nhánh"
                                                    : "Chọn chi nhánh"}
                                        </option>

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
                                        <option value="">
                                            {loadingServices
                                                ? "Đang tải dịch vụ..."
                                                : services.length === 0
                                                    ? "Chưa có dịch vụ"
                                                    : "Chọn dịch vụ"}
                                        </option>

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