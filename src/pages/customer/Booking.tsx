import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  Sparkles,
  Wallet,
  Wrench,
  ArrowRight,
} from "lucide-react";
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

const MAX_CARS_PER_SLOT = 4;

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
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
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

  const selectedVehicles = vehicles.filter((vehicle) =>
    selectedVehicleIds.includes(String(vehicle.VehicleID))
  );

  const selectedVehicleCount = selectedVehicles.length;

  const selectedService = services.find(
    (service) => service.ServiceID === Number(serviceId)
  );

  const servicePrice = Number(selectedService?.ActualPrice || 0);
  const totalServicePrice = servicePrice * selectedVehicleCount;

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

  function toggleVehicle(vehicleId: number) {
    const value = String(vehicleId);

    setStartTime("");

    if (selectedVehicleIds.includes(value)) {
      setSelectedVehicleIds((prev) => prev.filter((id) => id !== value));
      return;
    }

    if (selectedVehicleIds.length >= MAX_CARS_PER_SLOT) {
      showMessage(`Mỗi khung giờ chỉ được đặt tối đa ${MAX_CARS_PER_SLOT} xe`);
      return;
    }

    setSelectedVehicleIds((prev) => [...prev, value]);
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

    if (selectedVehicleIds.length === 0) {
      showMessage("Vui lòng chọn ít nhất 1 xe");
      return;
    }

    if (selectedVehicleIds.length > MAX_CARS_PER_SLOT) {
      showMessage(`Mỗi khung giờ chỉ được đặt tối đa ${MAX_CARS_PER_SLOT} xe`);
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

    const selectedSlot = slots.find((slot) => slot.StartTime === startTime);

    if (selectedSlot && selectedSlot.Available < selectedVehicleIds.length) {
      showMessage(
        `Khung giờ này chỉ còn ${selectedSlot.Available} chỗ, không đủ cho ${selectedVehicleIds.length} xe`
      );
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
        Items: selectedVehicleIds.map((id) => ({
          VehicleID: Number(id),
          Services: [
            {
              ServiceID: Number(serviceId),
            },
          ],
        })),
      };

      const res = await axiosClient.post("/api/bookings", bookingPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const vehicleNames = selectedVehicles.map(
        (vehicle) =>
          `${vehicle.LicensePlate} - ${vehicle.Brand || "Chưa cập nhật"} ${vehicle.Model || ""
          }`
      );

      navigate("/booking-success", {
        state: {
          booking: res.data.data,
          summary: {
            customerName: fullName,
            phone,
            branchName: selectedBranch?.BranchName || "",

            vehicleName: vehicleNames.join(", "),
            vehicleNames,
            vehicleCount: selectedVehicles.length,

            serviceName: selectedService?.ServiceName || "",
            serviceDuration: selectedService?.DurationMinutes || 0,
            servicePrice,
            discountAmount: 0,
            finalPrice: totalServicePrice,

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

        <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-100 px-6 py-10">
          <div className="mx-auto max-w-6xl rounded-3xl border border-sky-100 bg-white p-8 shadow-xl">
            Đang tải dữ liệu đặt lịch...
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-50">
        <section className="relative overflow-hidden bg-sky-600">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.25),transparent_18%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.22),transparent_16%),radial-gradient(circle_at_70%_85%,rgba(255,255,255,0.18),transparent_20%)]" />

          <div className="absolute left-10 top-10 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute bottom-10 right-20 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute right-1/3 top-20 h-20 w-20 rounded-full bg-yellow-300/20" />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="text-white">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] backdrop-blur">
                <Sparkles size={16} className="text-yellow-300" />
                Auto Wash Pro
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                Book your car wash in minutes.
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-sky-50">
                Choose your branch, vehicles, service package and available time
                slot. Fast, simple and convenient.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <div className="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur">
                  <p className="text-2xl font-black">{branches.length}</p>
                  <p className="text-sm text-sky-100">Active branches</p>
                </div>

                <div className="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur">
                  <p className="text-2xl font-black">{vehicles.length}</p>
                  <p className="text-sm text-sky-100">Your vehicles</p>
                </div>

                <div className="rounded-2xl bg-yellow-300 px-5 py-4 text-slate-900 shadow-lg shadow-yellow-500/30">
                  <p className="text-2xl font-black">4</p>
                  <p className="text-sm font-semibold">Cars per slot</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/30 bg-white/15 p-6 text-white shadow-2xl backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-300 text-slate-900">
                  <Car size={28} />
                </div>

                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-sky-100">
                    Smart Booking
                  </p>
                  <h2 className="text-2xl font-black">Wash appointment</h2>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-4">
                  <CheckCircle2 className="text-yellow-300" />
                  <span>Select multiple vehicles in one booking</span>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-4">
                  <Clock3 className="text-yellow-300" />
                  <span>View available time slots instantly</span>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-4">
                  <Wallet className="text-yellow-300" />
                  <span>See estimated payment before confirming</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_380px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-sky-100 bg-white p-6 shadow-xl shadow-sky-100/70"
          >
            {message && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {message}
              </div>
            )}

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Phone size={24} />
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">
                  Step 1
                </p>
                <h2 className="text-2xl font-black text-slate-900">
                  Customer Information
                </h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-bold text-slate-700">
                  Full name <span className="text-red-500">*</span>
                </label>

                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="mb-2 block font-bold text-slate-700">
                  Phone number <span className="text-red-500">*</span>
                </label>

                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </div>
            </div>

            <div className="mt-10 mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
                <CalendarDays size={24} />
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-600">
                  Step 2
                </p>
                <h2 className="text-2xl font-black text-slate-900">
                  Booking Details
                </h2>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-bold text-slate-700">
                  Branch <span className="text-red-500">*</span>
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
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                >
                  <option value="">Select branch</option>

                  {branches.map((branch) => (
                    <option key={branch.BranchID} value={branch.BranchID}>
                      {branch.BranchName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-bold text-slate-700">
                  Booking date <span className="text-red-500">*</span>
                </label>

                <input
                  type="date"
                  min={today}
                  value={bookingDate}
                  onChange={(e) => {
                    setBookingDate(e.target.value);
                    setStartTime("");
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block font-bold text-slate-700">
                  Vehicles <span className="text-red-500">*</span>
                </label>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  {vehicles.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      You have not registered any vehicles yet.
                    </p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {vehicles.map((vehicle) => {
                        const value = String(vehicle.VehicleID);
                        const checked = selectedVehicleIds.includes(value);
                        const disabled =
                          !checked &&
                          selectedVehicleIds.length >= MAX_CARS_PER_SLOT;

                        return (
                          <label
                            key={vehicle.VehicleID}
                            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm transition ${checked
                                ? "border-sky-500 bg-sky-100 text-sky-800 shadow-md shadow-sky-100"
                                : "border-slate-200 bg-white text-slate-700 hover:border-sky-300"
                              } ${disabled ? "cursor-not-allowed opacity-50" : ""
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => toggleVehicle(vehicle.VehicleID)}
                              className="h-5 w-5"
                            />

                            <div>
                              <p className="font-black">
                                {vehicle.LicensePlate}
                              </p>
                              <p className="text-xs text-slate-500">
                                {vehicle.Brand || "Unknown"}{" "}
                                {vehicle.Model || ""}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <p className="mt-3 text-sm font-semibold text-slate-500">
                    Selected {selectedVehicleIds.length}/{MAX_CARS_PER_SLOT}{" "}
                    vehicles
                  </p>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block font-bold text-slate-700">
                  Service <span className="text-red-500">*</span>
                </label>

                <select
                  value={serviceId}
                  disabled={!branchId || loadingServices}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:bg-slate-100"
                >
                  <option value="">
                    {!branchId
                      ? "Select branch first"
                      : loadingServices
                        ? "Loading services..."
                        : "Select service"}
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
              <div className="mt-6 rounded-3xl border border-sky-100 bg-sky-50 p-5 text-sm text-slate-700">
                <div className="mb-3 flex items-center gap-2 font-black text-sky-800">
                  <MapPin size={18} />
                  Branch information
                </div>

                <p>
                  <span className="font-bold">Address:</span>{" "}
                  {selectedBranch.Address || "Not updated"}
                </p>

                <p className="mt-1">
                  <span className="font-bold">Phone:</span>{" "}
                  {selectedBranch.Phone || "Not updated"}
                </p>

                <p className="mt-1">
                  <span className="font-bold">Opening hours:</span>{" "}
                  {formatTime(selectedBranch.OpenTime)} -{" "}
                  {formatTime(selectedBranch.CloseTime)}
                </p>
              </div>
            )}

            {selectedVehicles.length > 0 && (
              <div className="mt-6 rounded-3xl border border-indigo-100 bg-indigo-50 p-5 text-sm text-slate-700">
                <div className="mb-3 flex items-center gap-2 font-black text-indigo-800">
                  <Car size={18} />
                  Selected vehicles: {selectedVehicles.length}/
                  {MAX_CARS_PER_SLOT}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {selectedVehicles.map((vehicle) => (
                    <div
                      key={vehicle.VehicleID}
                      className="rounded-2xl bg-white p-4 shadow-sm"
                    >
                      <p>
                        <span className="font-bold">Plate:</span>{" "}
                        {vehicle.LicensePlate}
                      </p>

                      <p className="mt-1">
                        <span className="font-bold">Type:</span>{" "}
                        {vehicle.VehicleType || "Not updated"}
                      </p>

                      <p className="mt-1">
                        <span className="font-bold">Brand / model:</span>{" "}
                        {vehicle.Brand || "Not updated"} {vehicle.Model || ""}
                      </p>

                      <p className="mt-1">
                        <span className="font-bold">Color:</span>{" "}
                        {vehicle.Color || "Not updated"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedService && (
              <div className="mt-6 rounded-3xl border border-yellow-200 bg-yellow-50 p-5 text-sm text-slate-700">
                <div className="mb-3 flex items-center gap-2 font-black text-yellow-800">
                  <Wrench size={18} />
                  Selected service
                </div>

                <p>
                  <span className="font-bold">Service:</span>{" "}
                  {selectedService.ServiceName}
                </p>

                <p className="mt-1">
                  <span className="font-bold">Description:</span>{" "}
                  {selectedService.Description || "No description"}
                </p>

                <p className="mt-1">
                  <span className="font-bold">Duration:</span>{" "}
                  {selectedService.DurationMinutes || 0} minutes
                </p>

                <p className="mt-1">
                  <span className="font-bold">Price:</span>{" "}
                  {formatMoney(selectedService.ActualPrice)} / vehicle
                </p>
              </div>
            )}

            <div className="mt-10">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Clock3 size={24} />
                </div>

                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">
                    Step 3
                  </p>
                  <h2 className="text-2xl font-black text-slate-900">
                    Available Time Slots
                  </h2>
                </div>
              </div>

              {!branchId || !bookingDate ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  Please select a branch and booking date first.
                </p>
              ) : loadingSlots ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  Loading available slots...
                </p>
              ) : slots.length === 0 ? (
                <p className="rounded-2xl bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
                  No available time slots.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {slots.map((slot) => {
                    const isSelected = startTime === slot.StartTime;

                    const isDisabled =
                      slot.Available <= 0 ||
                      slot.Status !== "Available" ||
                      (selectedVehicleCount > 0 &&
                        slot.Available < selectedVehicleCount);

                    return (
                      <button
                        key={slot.StartTime}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setStartTime(slot.StartTime)}
                        className={`rounded-2xl border px-4 py-4 text-left font-bold transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${isSelected
                            ? "border-sky-600 bg-sky-600 text-white shadow-lg shadow-sky-300"
                            : "border-slate-200 bg-white text-slate-700 hover:border-sky-400 hover:bg-sky-50"
                          }`}
                      >
                        <div>
                          {slot.StartTime} - {slot.EndTime}
                        </div>

                        <div className="mt-1 text-xs font-semibold opacity-80">
                          {slot.ShiftName} | {slot.Available} seats left
                          {selectedVehicleCount > 0 &&
                            slot.Available < selectedVehicleCount
                            ? " | Not enough"
                            : ""}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-8">
              <label className="mb-2 block font-bold text-slate-700">
                Note
              </label>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Example: Please clean the interior carefully..."
                rows={4}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex items-center justify-center gap-2 rounded-2xl bg-yellow-300 px-7 py-4 font-black text-slate-900 shadow-lg shadow-yellow-300/40 transition hover:bg-yellow-400 disabled:bg-slate-300"
              >
                {isSubmitting ? "Booking..." : "Confirm Booking"}
                <ArrowRight
                  size={18}
                  className="transition group-hover:translate-x-1"
                />
              </button>

              <Link
                to="/register-car"
                className="rounded-2xl border border-slate-300 px-7 py-4 text-center font-black text-slate-700 transition hover:bg-slate-50"
              >
                Register New Vehicle
              </Link>
            </div>
          </form>

          <aside className="h-fit rounded-[2rem] border border-sky-100 bg-white p-6 shadow-xl shadow-sky-100/70 lg:sticky lg:top-28">
            <div className="rounded-3xl bg-gradient-to-br from-sky-600 to-indigo-600 p-6 text-white">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-sky-100">
                Summary
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Your Wash Appointment
              </h2>
            </div>

            <div className="mt-6 space-y-5 text-sm">
              <div>
                <p className="text-slate-500">Customer</p>
                <p className="font-black text-slate-900">
                  {fullName || "Not entered"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Phone</p>
                <p className="font-black text-slate-900">
                  {phone || "Not entered"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Branch</p>
                <p className="font-black text-slate-900">
                  {selectedBranch?.BranchName || "Not selected"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Vehicles</p>

                {selectedVehicles.length === 0 ? (
                  <p className="font-black text-slate-900">Not selected</p>
                ) : (
                  <ul className="list-inside list-disc font-black text-slate-900">
                    {selectedVehicles.map((vehicle) => (
                      <li key={vehicle.VehicleID}>{vehicle.LicensePlate}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="text-slate-500">Service</p>
                <p className="font-black text-slate-900">
                  {selectedService?.ServiceName || "Not selected"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Date & time</p>
                <p className="font-black text-slate-900">
                  {bookingDate || "Not selected"}{" "}
                  {startTime && `at ${startTime}`}
                </p>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <p className="text-slate-500">Estimated payment</p>
                <p className="mt-1 text-4xl font-black text-sky-700">
                  {formatMoney(totalServicePrice)}
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {selectedVehicleCount || 0} vehicles x{" "}
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