import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import axiosClient, { getErrorMessage } from "../../api/axiosClient";

type Branch = {
  BranchID: number;
  BranchName: string;
  Address: string | null;
  Phone: string | null;
  OpenTime: string | null;
  CloseTime: string | null;
  BankAccount?: string | null;
  Status: string | null;
  Latitude?: number | null;
  Longitude?: number | null;
};

type Vehicle = {
  VehicleID: number;
  LicensePlate: string;
  VehicleType?: string | null;
  Brand?: string | null;
  Model?: string | null;
  Color?: string | null;
  Status?: string | null;
  CreatedAt?: string | null;
};

type Service = {
  BranchServiceID: number;
  ServiceID: number;
  ServiceName: string;
  Description: string | null;
  DurationMinutes: number | null;
  Type: string | null;
  BasePrice: number | string;
  PriceOverride: number | string | null;
  ActualPrice: number | string;
};

type Slot = {
  StartTime: string;
  EndTime: string;
  ShiftName: string;
  StaffCount: number;
  MaxCapacity: number;
  Booked: number;
  Available: number;
  Status: string;
};

function formatMoney(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString("vi-VN") + "đ";
}

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

function Booking() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [branches, setBranches] = useState<Branch[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  const [branchId, setBranchId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [message, setMessage] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const selectedBranch = branches.find(
    (branch) => branch.BranchID === Number(branchId)
  );

  const selectedVehicle = vehicles.find(
    (vehicle) => vehicle.VehicleID === Number(vehicleId)
  );

  const selectedService = services.find(
    (service) => service.ServiceID === Number(serviceId)
  );

  const servicePrice = Number(selectedService?.ActualPrice || 0);

  useEffect(() => {
    async function loadBookingData() {
      try {
        setLoading(true);
        setMessage("");

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const branchRes = await axiosClient.get("/api/branches?status=Active");

        const profileRes = await axiosClient.get("/api/customers/profile", {
          headers,
        });

        const profile = profileRes.data.data;

        setBranches(branchRes.data.data || []);
        setFullName(profile.Users.FullName || "");
        setPhone(profile.Users.Phone || "");
        setVehicles(profile.Vehicles || []);
      } catch (error) {
        console.log(error);
        setMessage(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    }

    loadBookingData();
  }, [navigate]);

  useEffect(() => {
    async function loadServices() {
      if (!branchId) {
        setServices([]);
        return;
      }

      try {
        setLoadingServices(true);
        setMessage("");

        setServices([]);
        setServiceId("");
        setStartTime("");

        const res = await axiosClient.get(`/api/branches/${branchId}/services`);

        setServices(res.data.data || []);
      } catch (error) {
        console.log(error);
        setMessage(getErrorMessage(error));
      } finally {
        setLoadingServices(false);
      }
    }

    loadServices();
  }, [branchId]);

  useEffect(() => {
    async function loadSlots() {
      if (!branchId || !bookingDate) {
        setSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        setMessage("");

        setSlots([]);
        setStartTime("");

        const res = await axiosClient.get("/api/bookings/available-slots", {
          params: {
            BranchID: Number(branchId),
            BookingDate: bookingDate,
          },
        });

        setSlots(res.data.data.Slots || []);
      } catch (error) {
        console.log(error);
        setMessage(getErrorMessage(error));
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [branchId, bookingDate]);

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

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
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

      const res = await axiosClient.post("/api/bookings", bookingPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate("/booking-success", {
        state: {
          booking: res.data.data,
          summary: {
            customerName: fullName,
            phone,
            branchName: selectedBranch?.BranchName || "",
            vehicleName: selectedVehicle
              ? `${selectedVehicle.LicensePlate} - ${selectedVehicle.Brand || "Chưa cập nhật"
              } ${selectedVehicle.Model || ""}`
              : "",
            serviceName: selectedService?.ServiceName || "",
            serviceDuration: selectedService?.DurationMinutes || 0,
            servicePrice,
            discountAmount: 0,
            finalPrice: servicePrice,
            bookingDate,
            startTime,
            note,
          },
        },
      });
    } catch (error) {
      console.log(error);
      showMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-gray-100 px-6 py-10">
          <div className="mx-auto max-w-6xl rounded-xl bg-white p-6 shadow">
            Đang tải dữ liệu đặt lịch...
          </div>
        </main>
      </>
    );
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

            <p className="mt-2 text-slate-300">
              Chọn chi nhánh, xe, dịch vụ và khung giờ phù hợp.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-3">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-6 shadow lg:col-span-2"
          >
            {message && (
              <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {message}
              </div>
            )}

            <h2 className="text-xl font-bold text-slate-800">
              Thông tin khách hàng
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
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

            <h2 className="mt-8 text-xl font-bold text-slate-800">
              Thông tin đặt lịch
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Chi nhánh <span className="text-red-500">*</span>
                </label>

                <select
                  value={branchId}
                  onChange={(e) => {
                    setBranchId(e.target.value);
                    setServiceId("");
                    setBookingDate("");
                    setStartTime("");
                    setSlots([]);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="">Chọn chi nhánh</option>

                  {branches.map((branch) => (
                    <option key={branch.BranchID} value={branch.BranchID}>
                      {branch.BranchName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Xe <span className="text-red-500">*</span>
                </label>

                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="">Chọn xe</option>

                  {vehicles.map((vehicle) => (
                    <option key={vehicle.VehicleID} value={vehicle.VehicleID}>
                      {vehicle.LicensePlate} -{" "}
                      {vehicle.Brand || "Chưa cập nhật"} {vehicle.Model || ""}
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
                  onChange={(e) => {
                    setBookingDate(e.target.value);
                    setStartTime("");
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Dịch vụ <span className="text-red-500">*</span>
                </label>

                <select
                  value={serviceId}
                  disabled={!branchId || loadingServices}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-gray-100"
                >
                  <option value="">
                    {!branchId
                      ? "Chọn chi nhánh trước"
                      : loadingServices
                        ? "Đang tải dịch vụ..."
                        : "Chọn dịch vụ"}
                  </option>

                  {services.map((service) => (
                    <option key={service.ServiceID} value={service.ServiceID}>
                      {service.ServiceName} - {formatMoney(service.ActualPrice)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedBranch && (
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  <span className="font-semibold">Địa chỉ:</span>{" "}
                  {selectedBranch.Address || "Chưa cập nhật"}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Số điện thoại:</span>{" "}
                  {selectedBranch.Phone || "Chưa cập nhật"}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Giờ mở cửa:</span>{" "}
                  {formatTime(selectedBranch.OpenTime)} -{" "}
                  {formatTime(selectedBranch.CloseTime)}
                </p>
              </div>
            )}

            {selectedVehicle && (
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  <span className="font-semibold">Xe đã chọn:</span>{" "}
                  {selectedVehicle.LicensePlate}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Loại xe:</span>{" "}
                  {selectedVehicle.VehicleType || "Chưa cập nhật"}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Hãng / model:</span>{" "}
                  {selectedVehicle.Brand || "Chưa cập nhật"}{" "}
                  {selectedVehicle.Model || ""}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Màu xe:</span>{" "}
                  {selectedVehicle.Color || "Chưa cập nhật"}
                </p>
              </div>
            )}

            {selectedService && (
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  <span className="font-semibold">Dịch vụ đã chọn:</span>{" "}
                  {selectedService.ServiceName}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Mô tả:</span>{" "}
                  {selectedService.Description || "Chưa có mô tả"}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Thời lượng:</span>{" "}
                  {selectedService.DurationMinutes || 0} phút
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Giá:</span>{" "}
                  {formatMoney(selectedService.ActualPrice)}
                </p>
              </div>
            )}

            <div className="mt-8">
              <label className="mb-3 block font-semibold text-slate-700">
                Khung giờ <span className="text-red-500">*</span>
              </label>

              {!branchId || !bookingDate ? (
                <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-slate-500">
                  Vui lòng chọn chi nhánh và ngày trước.
                </p>
              ) : loadingSlots ? (
                <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-slate-500">
                  Đang tải khung giờ...
                </p>
              ) : slots.length === 0 ? (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  Không có khung giờ trống.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {slots.map((slot) => {
                    let isSelected = false;

                    if (startTime === slot.StartTime) {
                      isSelected = true;
                    }

                    const isDisabled =
                      slot.Available <= 0 || slot.Status !== "Available";

                    return (
                      <button
                        key={slot.StartTime}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setStartTime(slot.StartTime)}
                        className={`rounded-xl border px-4 py-3 font-semibold transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 ${isSelected
                            ? "border-sky-600 bg-sky-600 text-white"
                            : "border-gray-300 bg-white text-slate-700 hover:border-sky-500 hover:text-sky-600"
                          }`}
                      >
                        <div>
                          {slot.StartTime} - {slot.EndTime}
                        </div>

                        <div className="text-xs font-normal">
                          {slot.ShiftName} | Còn {slot.Available} chỗ
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
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
                className="rounded-lg bg-sky-600 px-6 py-3 font-semibold text-white hover:bg-sky-700 disabled:bg-gray-400"
              >
                {isSubmitting ? "Đang đặt lịch..." : "Đặt lịch"}
              </button>

              <Link
                to="/register-car"
                className="rounded-lg border border-gray-300 px-6 py-3 text-center font-semibold text-slate-700 hover:bg-gray-50"
              >
                Đăng ký xe mới
              </Link>
            </div>
          </form>

          <aside className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-slate-800">
              Tóm tắt lịch hẹn
            </h2>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-slate-500">Khách hàng</p>
                <p className="font-semibold text-slate-800">
                  {fullName || "Chưa nhập"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Số điện thoại</p>
                <p className="font-semibold text-slate-800">
                  {phone || "Chưa nhập"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Chi nhánh</p>
                <p className="font-semibold text-slate-800">
                  {selectedBranch?.BranchName || "Chưa chọn"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Xe</p>
                <p className="font-semibold text-slate-800">
                  {selectedVehicle?.LicensePlate || "Chưa chọn"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Dịch vụ</p>
                <p className="font-semibold text-slate-800">
                  {selectedService?.ServiceName || "Chưa chọn"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Ngày giờ</p>
                <p className="font-semibold text-slate-800">
                  {bookingDate || "Chưa chọn"}{" "}
                  {startTime && `lúc ${startTime}`}
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-slate-500">Thanh toán dự kiến</p>
                <p className="text-2xl font-bold text-sky-700">
                  {formatMoney(servicePrice)}
                </p>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </>
  );
}

export default Booking;