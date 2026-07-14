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

type MemberTierConfig = {
  TierName?: string | null;
  DiscountPercent?: number | string | null;
};

type LoyaltyAccount = {
  tier_configs?: MemberTierConfig | null;
};

type ExistingBooking = {
  BranchID: number;
  BookingDate?: string | null;
  StartTime?: string | null;
  Status?: string | null;
  BookingItems?: Array<{ VehicleID?: number | null; Status?: string | null }>;
};

type BookingPayload = {
  BranchID: number;
  BookingDate: string;
  StartTime: string;
  Items: Array<{
    VehicleID: number;
    Services: Array<{ ServiceID: number }>;
  }>;
};

function formatMoney(value: number | string | null | undefined) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function formatTime(value: string | null | undefined) {
  if (!value) {
    return "--:--";
  }

  if (value.includes("T")) {
    return value.substring(11, 16);
  }

  return value.substring(0, 5);
}

function getToday() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function Booking() {
  const navigate = useNavigate();

  // Thông tin khách hàng
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Dữ liệu lấy từ API
  const [branches, setBranches] = useState<Branch[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [memberTierName, setMemberTierName] = useState("");
  const [tierDiscountPercent, setTierDiscountPercent] = useState(0);
  const [myBookings, setMyBookings] = useState<ExistingBooking[]>([]);

  // Dữ liệu người dùng lựa chọn
  const [branchId, setBranchId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);
  const [note, setNote] = useState("");

  // Trạng thái tải dữ liệu
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [bookingOtp, setBookingOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const [pendingBookingPayload, setPendingBookingPayload] =
    useState<BookingPayload | null>(null);

  const [message, setMessage] = useState("");

  const today = getToday();

  useEffect(() => {
    if (!isOtpOpen || resendSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [isOtpOpen, resendSeconds]);

  // Tìm dữ liệu chi tiết từ ID đang được chọn
  const selectedBranch = branches.find(
    (branch) => branch.BranchID === Number(branchId)
  );

  const selectedService = services.find(
    (service) => service.ServiceID === Number(serviceId)
  );

  const selectedSlot = slots.find(
    (slot) => slot.StartTime === startTime
  );

  const bookedVehicleIdsInSelectedSlot = new Set(
    myBookings
      .filter((booking) => {
        const existingDate = booking.BookingDate?.substring(0, 10);
        return (
          booking.Status !== "Cancelled" &&
          existingDate === bookingDate &&
          formatTime(booking.StartTime) === formatTime(startTime)
        );
      })
      .flatMap((booking) =>
        (booking.BookingItems || [])
          .filter((item) => item.Status !== "Cancelled")
          .map((item) => item.VehicleID)
          .filter((vehicleId): vehicleId is number => Boolean(vehicleId))
      )
  );

  const selectedVehicles = vehicles.filter((vehicle) =>
    selectedVehicleIds.includes(vehicle.VehicleID)
  );

  // Số xe tối đa được chọn lấy từ slot của API
  const maxSelectableVehicles = selectedSlot?.Available ?? 0;

  const selectedVehicleCount = selectedVehicles.length;
  const servicePrice = Number(selectedService?.ActualPrice || 0);
  const totalServicePrice = servicePrice * selectedVehicleCount;
  const tierDiscountAmount =
    (totalServicePrice * tierDiscountPercent) / 100;
  const finalServicePrice = Math.max(
    0,
    totalServicePrice - tierDiscountAmount
  );
  const discountedPricePerVehicle = Math.max(
    0,
    servicePrice - (servicePrice * tierDiscountPercent) / 100
  );

  function showMessage(text: string) {
    setMessage(text);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function getToken() {
    return localStorage.getItem("token");
  }

  /*
   * Lấy thông tin ban đầu:
   * - Danh sách chi nhánh
   * - Thông tin khách hàng
   * - Danh sách xe của khách hàng
   */
  useEffect(() => {
    async function loadBookingData() {
      const token = getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setMessage("");

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [branchResponse, profileResponse, bookingResponse] = await Promise.all([
          axiosClient.get("/api/branches?status=Active"),
          axiosClient.get("/api/customers/profile", { headers }),
          axiosClient.get("/api/bookings/me", { headers }),
        ]);

        const profile = profileResponse.data.data;

        setBranches(branchResponse.data.data || []);
        setFullName(profile?.Users?.FullName || "");
        setPhone(profile?.Users?.Phone || "");
        setVehicles(profile?.Vehicles || []);
        setMyBookings(bookingResponse.data?.data || []);

        const loyaltyAccount = Array.isArray(profile?.LoyaltyAccounts)
          ? (profile.LoyaltyAccounts[0] as LoyaltyAccount | undefined)
          : undefined;
        const tierConfig = loyaltyAccount?.tier_configs;
        const discountPercent = Number(tierConfig?.DiscountPercent || 0);

        setMemberTierName(tierConfig?.TierName || "");
        setTierDiscountPercent(
          Number.isFinite(discountPercent)
            ? Math.min(100, Math.max(0, discountPercent))
            : 0
        );
      } catch (error) {
        console.log(error);
        setMessage(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    }

    loadBookingData();
  }, [navigate]);

  /*
   * Khi thay đổi chi nhánh thì tải lại dịch vụ.
   */
  useEffect(() => {
    async function loadServices() {
      if (!branchId) {
        setServices([]);
        return;
      }

      try {
        setLoadingServices(true);
        setMessage("");

        const response = await axiosClient.get(
          `/api/branches/${branchId}/services`
        );

        setServices(response.data.data || []);
      } catch (error) {
        console.log(error);
        setServices([]);
        setMessage(getErrorMessage(error));
      } finally {
        setLoadingServices(false);
      }
    }

    loadServices();
  }, [branchId]);

  /*
   * Khi có chi nhánh và ngày thì tải danh sách khung giờ.
   */
  useEffect(() => {
    async function loadSlots() {
      if (!branchId || !bookingDate) {
        setSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        setMessage("");

        const response = await axiosClient.get(
          "/api/bookings/available-slots",
          {
            params: {
              BranchID: Number(branchId),
              BookingDate: bookingDate,
            },
          }
        );

        setSlots(response.data.data?.Slots || []);
      } catch (error) {
        console.log(error);
        setSlots([]);
        setMessage(getErrorMessage(error));
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [branchId, bookingDate]);

  /*
   * Khi đổi chi nhánh:
   * - Xóa dịch vụ cũ
   * - Xóa ngày, khung giờ và xe đã chọn
   */
  function handleBranchChange(value: string) {
    setBranchId(value);
    setServiceId("");
    setBookingDate("");
    setStartTime("");
    setSelectedVehicleIds([]);
    setServices([]);
    setSlots([]);
    setMessage("");
  }

  /*
   * Khi đổi ngày:
   * - Xóa khung giờ cũ
   * - Xóa xe đã chọn vì số chỗ có thể thay đổi
   */
  function handleDateChange(value: string) {
    setBookingDate(value);
    setStartTime("");
    setSelectedVehicleIds([]);
    setSlots([]);
    setMessage("");
  }

  /*
   * Người dùng phải chọn khung giờ trước rồi mới chọn xe.
   * Khi đổi khung giờ thì xóa xe cũ để chọn lại theo số chỗ mới.
   */
  function handleSlotChange(slot: Slot) {
    setStartTime(slot.StartTime);
    setSelectedVehicleIds([]);
    setMessage("");
  }

  /*
   * Thêm hoặc bỏ một xe khỏi danh sách đã chọn.
   */
  function toggleVehicle(vehicleId: number) {
    if (!selectedSlot) {
      showMessage("Vui lòng chọn khung giờ trước");
      return;
    }


    if (bookedVehicleIdsInSelectedSlot.has(vehicleId)) {
      showMessage("Xe này đã được đăng ký trong cùng khung giờ. Vui lòng chọn xe hoặc khung giờ khác.");
      return;
    }

    const isSelected = selectedVehicleIds.includes(vehicleId);

    // Nếu xe đã được chọn thì bỏ chọn
    if (isSelected) {
      setSelectedVehicleIds((currentIds) =>
        currentIds.filter((id) => id !== vehicleId)
      );
      return;
    }

    // Không cho chọn vượt quá số chỗ còn lại của slot
    if (selectedVehicleIds.length >= selectedSlot.Available) {
      showMessage(
        `Khung giờ này chỉ còn ${selectedSlot.Available}/${selectedSlot.MaxCapacity} chỗ trống (${selectedSlot.Booked} chỗ đã được đặt). Vui lòng chọn khung giờ khác nếu muốn đặt thêm xe.`
      );
      return;
    }

    setSelectedVehicleIds((currentIds) => [
      ...currentIds,
      vehicleId,
    ]);
  }

  function validateForm() {
    if (!fullName.trim()) {
      showMessage("Vui lòng nhập họ và tên");
      return false;
    }

    if (!phone.trim()) {
      showMessage("Vui lòng nhập số điện thoại");
      return false;
    }

    if (!branchId) {
      showMessage("Vui lòng chọn chi nhánh");
      return false;
    }

    if (!serviceId) {
      showMessage("Vui lòng chọn dịch vụ");
      return false;
    }

    if (!bookingDate) {
      showMessage("Vui lòng chọn ngày đặt lịch");
      return false;
    }

    if (!selectedSlot) {
      showMessage("Vui lòng chọn khung giờ");
      return false;
    }

    if (selectedVehicleIds.length === 0) {
      showMessage("Vui lòng chọn ít nhất 1 xe");
      return false;
    }

    if (selectedVehicleIds.length > selectedSlot.Available) {
      showMessage(
        `Khung giờ này chỉ còn ${selectedSlot.Available}/${selectedSlot.MaxCapacity} chỗ trống. Vui lòng giảm số xe hoặc chọn khung giờ khác.`
      );
      return false;
    }

    return true;
  }

  async function requestBookingOtp() {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return false;
    }

    try {
      setIsSendingOtp(true);
      setOtpMessage("");
      setDemoOtp("");

      const response = await axiosClient.post(
        "/api/bookings/send-otp",
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const responseData = response.data?.data || {};
      setDemoOtp(responseData.demoOtp ? String(responseData.demoOtp) : "");
      setResendSeconds(Number(responseData.retryAfterSeconds || 60));
      setOtpMessage(response.data?.message || "Đã gửi mã OTP");
      return true;
    } catch (error) {
      const retryAfter = Number(
        (error as { response?: { data?: { retryAfterSeconds?: number } } })
          .response?.data?.retryAfterSeconds || 0,
      );
      if (retryAfter > 0) setResendSeconds(retryAfter);
      setOtpMessage(getErrorMessage(error));
      return false;
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!validateForm()) return;

    const bookingPayload: BookingPayload = {
      BranchID: Number(branchId),
      BookingDate: bookingDate,
      StartTime: startTime,
      Items: selectedVehicleIds.map((vehicleId) => ({
        VehicleID: vehicleId,
        Services: [{ ServiceID: Number(serviceId) }],
      })),
    };

    setPendingBookingPayload(bookingPayload);
    setBookingOtp("");
    setOtpMessage("");
    setDemoOtp("");
    setResendSeconds(0);
    setIsOtpOpen(true);
    await requestBookingOtp();
  }

  async function handleConfirmBookingOtp() {
    if (!pendingBookingPayload) return;
    if (!/^\d{6}$/.test(bookingOtp)) {
      setOtpMessage("Vui lòng nhập đúng mã OTP gồm 6 chữ số");
      return;
    }

    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setIsSubmitting(true);
      setOtpMessage("");
      const response = await axiosClient.post(
        "/api/bookings",
        { ...pendingBookingPayload, Otp: bookingOtp },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const vehicleNames = selectedVehicles.map((vehicle) => {
        const brand = vehicle.Brand || "Chưa cập nhật";
        const model = vehicle.Model || "";
        return `${vehicle.LicensePlate} - ${brand} ${model}`.trim();
      });

      navigate("/booking-success", {
        state: {
          booking: response.data.data,
          summary: {
            customerName: fullName,
            phone,
            branchName: selectedBranch?.BranchName || "",
            vehicleName: vehicleNames.join(", "),
            vehicleNames,
            vehicleCount: selectedVehicles.length,
            serviceName: selectedService?.ServiceName || "",
            serviceDuration: selectedService?.DurationMinutes || 0,
            servicePrice: totalServicePrice,
            discountAmount: tierDiscountAmount,
            discountPercent: tierDiscountPercent,
            memberTierName,
            finalPrice: finalServicePrice,
            bookingDate,
            startTime,
            note,
          },
        },
      });
    } catch (error) {
      setOtpMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendBookingOtp() {
    if (resendSeconds > 0 || isSendingOtp) return;
    setBookingOtp("");
    await requestBookingOtp();
  }

  function closeOtpModal() {
    if (isSubmitting || isSendingOtp) return;
    setIsOtpOpen(false);
    setPendingBookingPayload(null);
    setBookingOtp("");
    setOtpMessage("");
    setDemoOtp("");
    setResendSeconds(0);
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
            <button type="button" onClick={() => navigate(-1)} className="mb-5 text-sm font-semibold text-slate-300 hover:text-white">
              ← Quay lại
            </button>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
              Auto Wash Pro
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              Đặt lịch rửa xe
            </h1>

            <p className="mt-2 text-slate-300">
              Chọn chi nhánh, dịch vụ, khung giờ và các xe cần rửa.
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

            {/* Thông tin khách hàng */}
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
                  readOnly
                  placeholder="Nhập họ và tên"
                  className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>

                <input
                  value={phone}
                  readOnly
                  placeholder="Nhập số điện thoại"
                  className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-slate-600 outline-none"
                />
              </div>
            </div>

            {/* Thông tin đặt lịch */}
            <h2 className="mt-8 text-xl font-bold text-slate-800">
              Thông tin đặt lịch
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {/* Chọn chi nhánh */}
              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Chi nhánh <span className="text-red-500">*</span>
                </label>

                <select
                  value={branchId}
                  onChange={(event) =>
                    handleBranchChange(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="">Chọn chi nhánh</option>

                  {branches.map((branch) => (
                    <option
                      key={branch.BranchID}
                      value={branch.BranchID}
                    >
                      {branch.BranchName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chọn ngày */}
              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Ngày đặt lịch <span className="text-red-500">*</span>
                </label>

                <input
                  type="date"
                  min={today}
                  value={bookingDate}
                  disabled={!branchId}
                  onChange={(event) =>
                    handleDateChange(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-gray-100"
                />
              </div>

              {/* Chọn dịch vụ */}
              <div className="md:col-span-2">
                <label className="mb-2 block font-semibold text-slate-700">
                  Dịch vụ <span className="text-red-500">*</span>
                </label>

                <select
                  value={serviceId}
                  disabled={!branchId || loadingServices}
                  onChange={(event) => {
                    setServiceId(event.target.value);
                    setMessage("");
                  }}
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
                    <option
                      key={service.ServiceID}
                      value={service.ServiceID}
                    >
                      {service.ServiceName} -{" "}
                      {formatMoney(
                        Number(service.ActualPrice || 0) *
                          (1 - tierDiscountPercent / 100)
                      )}
                      {tierDiscountPercent > 0
                        ? ` (đã giảm ${tierDiscountPercent}%)`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Thông tin chi nhánh */}
            {selectedBranch && (
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  <span className="font-semibold">Địa chỉ:</span>{" "}
                  {selectedBranch.Address || "Chưa cập nhật"}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">
                    Số điện thoại:
                  </span>{" "}
                  {selectedBranch.Phone || "Chưa cập nhật"}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Giờ mở cửa:</span>{" "}
                  {formatTime(selectedBranch.OpenTime)} -{" "}
                  {formatTime(selectedBranch.CloseTime)}
                </p>
              </div>
            )}

            {/* Thông tin dịch vụ */}
            {selectedService && (
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  <span className="font-semibold">
                    Dịch vụ đã chọn:
                  </span>{" "}
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
                  {tierDiscountPercent > 0 && (
                    <span className="mr-2 text-slate-400 line-through">
                      {formatMoney(selectedService.ActualPrice)}
                    </span>
                  )}
                  <span className="font-semibold text-sky-700">
                    {formatMoney(discountedPricePerVehicle)} / xe
                  </span>
                </p>

                {tierDiscountPercent > 0 && (
                  <p className="mt-2 text-sm font-medium text-emerald-700">
                    Hạng {memberTierName}: giảm {tierDiscountPercent}%
                  </p>
                )}
              </div>
            )}

            {/* Chọn khung giờ */}
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
                    const isSelected =
                      startTime === slot.StartTime;

                    const isDisabled =
                      slot.Available <= 0 ||
                      slot.Status !== "Available";

                    return (
                      <button
                        key={slot.StartTime}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleSlotChange(slot)}
                        className={`rounded-xl border px-4 py-3 font-semibold transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 ${
                          isSelected
                            ? "border-sky-600 bg-sky-600 text-white"
                            : "border-gray-300 bg-white text-slate-700 hover:border-sky-500 hover:text-sky-600"
                        }`}
                      >
                        <div>
                          {slot.StartTime} - {slot.EndTime}
                        </div>

                        <div className="text-xs font-normal">
                          {slot.ShiftName} | Còn {slot.Available}/{slot.MaxCapacity} chỗ
                        </div>

                        <div className="mt-1 text-[11px] font-normal opacity-80">
                          Đã đặt {slot.Booked} xe
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chọn xe sau khi đã chọn khung giờ */}
            <div className="mt-8">
              <label className="mb-2 block font-semibold text-slate-700">
                Xe <span className="text-red-500">*</span>
              </label>

              {!selectedSlot && (
                <p className="mb-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-slate-500">
                  Vui lòng chọn khung giờ trước khi chọn xe.
                </p>
              )}

              {selectedSlot && (
                <p className="mb-3 rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-700">
                  Khung giờ{" "}
                  <strong>
                    {selectedSlot.StartTime} - {selectedSlot.EndTime}
                  </strong>{" "}
                  có tổng cộng <strong>{selectedSlot.MaxCapacity} chỗ</strong>,{" "}
                  đã được đặt <strong>{selectedSlot.Booked} chỗ</strong> và còn{" "}
                  <strong>{selectedSlot.Available} chỗ</strong>. Vì mỗi xe chiếm
                  một chỗ trong cùng khung giờ, bạn có thể chọn tối đa{" "}
                  <strong>{selectedSlot.Available} xe</strong>. Muốn đặt thêm,
                  hãy chọn khung giờ khác.
                </p>
              )}

              <div className="rounded-lg border border-gray-300 p-3">
                {vehicles.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Bạn chưa có xe nào. Vui lòng đăng ký xe trước.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {vehicles.map((vehicle) => {
                      const checked = selectedVehicleIds.includes(
                        vehicle.VehicleID
                      );

                      const reachedLimit =
                        selectedVehicleIds.length >=
                        maxSelectableVehicles;

                      const alreadyBooked = bookedVehicleIdsInSelectedSlot.has(
                        vehicle.VehicleID
                      );

                      const disabled =
                        !selectedSlot ||
                        alreadyBooked ||
                        (!checked && reachedLimit);

                      return (
                        <label
                          key={vehicle.VehicleID}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                            checked
                              ? "border-sky-500 bg-sky-50 text-sky-700"
                              : "border-gray-200 bg-white text-slate-700"
                          } ${
                            disabled
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() =>
                              toggleVehicle(vehicle.VehicleID)
                            }
                            className="h-4 w-4"
                          />

                          <span className="font-semibold">
                            {vehicle.LicensePlate} -{" "}
                            {vehicle.Brand || "Chưa cập nhật"}{" "}
                            {vehicle.Model || ""}
                            {alreadyBooked && (
                              <span className="ml-2 text-xs font-medium text-amber-600">
                                (Đã đặt trong khung giờ này)
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}

                    <p className="pt-1 text-xs text-slate-500">
                      {selectedSlot
                        ? `Đã chọn ${selectedVehicleIds.length}/${maxSelectableVehicles} xe`
                        : "Chưa thể chọn xe"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Chi tiết các xe đã chọn */}
            {selectedVehicles.length > 0 && (
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-700">
                  Xe đã chọn: {selectedVehicles.length}/
                  {maxSelectableVehicles}
                </p>

                <div className="mt-3 space-y-2">
                  {selectedVehicles.map((vehicle) => (
                    <div
                      key={vehicle.VehicleID}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2"
                    >
                      <p>
                        <span className="font-semibold">Biển số:</span>{" "}
                        {vehicle.LicensePlate}
                      </p>

                      <p className="mt-1">
                        <span className="font-semibold">Loại xe:</span>{" "}
                        {vehicle.VehicleType || "Chưa cập nhật"}
                      </p>

                      <p className="mt-1">
                        <span className="font-semibold">
                          Hãng / model:
                        </span>{" "}
                        {vehicle.Brand || "Chưa cập nhật"}{" "}
                        {vehicle.Model || ""}
                      </p>

                      <p className="mt-1">
                        <span className="font-semibold">Màu xe:</span>{" "}
                        {vehicle.Color || "Chưa cập nhật"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ghi chú */}
            <div className="mt-8">
              <label className="mb-2 block font-semibold text-slate-700">
                Ghi chú
              </label>

              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ví dụ: Xe nhiều bụi, cần rửa kỹ phần nội thất..."
                rows={4}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </div>

            {/* Nút chức năng */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={isSubmitting || isSendingOtp}
                className="rounded-lg bg-sky-600 px-6 py-3 font-semibold text-white hover:bg-sky-700 disabled:bg-gray-400"
              >
                {isSendingOtp ? "Đang gửi OTP..." : "Đặt lịch"}
              </button>

              <Link
                to="/register-car"
                className="rounded-lg border border-gray-300 px-6 py-3 text-center font-semibold text-slate-700 hover:bg-gray-50"
              >
                Đăng ký xe mới
              </Link>
            </div>
          </form>

          {/* Tóm tắt lịch hẹn */}
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

              <div>
                <p className="text-slate-500">Số chỗ còn lại</p>
                <p className="font-semibold text-slate-800">
                  {selectedSlot
                    ? `${selectedSlot.Available} chỗ`
                    : "Chưa chọn khung giờ"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Xe</p>

                {selectedVehicles.length === 0 ? (
                  <p className="font-semibold text-slate-800">
                    Chưa chọn
                  </p>
                ) : (
                  <ul className="list-inside list-disc font-semibold text-slate-800">
                    {selectedVehicles.map((vehicle) => (
                      <li key={vehicle.VehicleID}>
                        {vehicle.LicensePlate}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-slate-500">
                  Thanh toán dự kiến
                </p>

                {tierDiscountPercent > 0 && totalServicePrice > 0 && (
                  <>
                    <p className="mt-2 text-sm text-slate-500">
                      Giá gốc:{" "}
                      <span className="line-through">
                        {formatMoney(totalServicePrice)}
                      </span>
                    </p>
                    <p className="text-sm font-medium text-emerald-700">
                      Hạng {memberTierName} giảm {tierDiscountPercent}%: -
                      {formatMoney(tierDiscountAmount)}
                    </p>
                  </>
                )}

                <p className="text-2xl font-bold text-sky-700">
                  {formatMoney(finalServicePrice)}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedVehicleCount} xe x{" "}
                  {formatMoney(discountedPricePerVehicle)}
                </p>
              </div>
            </div>
          </aside>
        </section>
      </main>

      {isOtpOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-otp-title"
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 id="booking-otp-title" className="text-xl font-bold text-slate-900">
                  Xác nhận số điện thoại
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Nhập mã OTP gửi đến {phone ? `${phone.slice(0, 3)}****${phone.slice(-3)}` : "số đã đăng ký"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeOtpModal}
                disabled={isSubmitting || isSendingOtp}
                aria-label="Đóng"
                className="rounded-lg p-1 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label htmlFor="booking-otp" className="mb-2 block text-sm font-semibold text-slate-700">
                  Mã OTP gồm 6 chữ số
                </label>
                <input
                  id="booking-otp"
                  value={bookingOtp}
                  onChange={(event) =>
                    setBookingOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && bookingOtp.length === 6) {
                      void handleConfirmBookingOtp();
                    }
                  }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  placeholder="••••••"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl font-bold tracking-[0.45em] outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
                <p className="mt-2 text-xs text-slate-500">Mã có hiệu lực trong 5 phút.</p>
              </div>

              {otpMessage && (
                <div className="rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  {otpMessage}
                </div>
              )}

              {demoOtp && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Chế độ mô phỏng — mã OTP: <strong className="text-lg tracking-widest">{demoOtp}</strong>
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleResendBookingOtp()}
                disabled={resendSeconds > 0 || isSendingOtp || isSubmitting}
                className="text-sm font-semibold text-sky-700 hover:text-sky-800 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {isSendingOtp
                  ? "Đang gửi mã..."
                  : resendSeconds > 0
                    ? `Gửi lại sau ${resendSeconds}s`
                    : "Gửi lại mã OTP"}
              </button>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={closeOtpModal}
                disabled={isSubmitting || isSendingOtp}
                className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmBookingOtp()}
                disabled={bookingOtp.length !== 6 || isSubmitting || isSendingOtp}
                className="rounded-lg bg-sky-600 px-5 py-2 font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "Đang tạo lịch..." : "Xác nhận đặt lịch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Booking;
