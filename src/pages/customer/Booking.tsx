import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  MapPin,
  Phone,
  Sparkles,
  Wallet,
  Wrench,
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
      showMessage(`Each time slot allows up to ${MAX_CARS_PER_SLOT} vehicles`);
      return;
    }

    setSelectedVehicleIds((prev) => [...prev, value]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setMessage("");

    if (!fullName.trim()) {
      showMessage("Please enter your full name");
      return;
    }

    if (!phone.trim()) {
      showMessage("Please enter your phone number");
      return;
    }

    if (!branchId) {
      showMessage("Please select a branch");
      return;
    }

    if (selectedVehicleIds.length === 0) {
      showMessage("Please select at least 1 vehicle");
      return;
    }

    if (selectedVehicleIds.length > MAX_CARS_PER_SLOT) {
      showMessage(`Each time slot allows up to ${MAX_CARS_PER_SLOT} vehicles`);
      return;
    }

    if (!serviceId) {
      showMessage("Please select a service");
      return;
    }

    if (!bookingDate) {
      showMessage("Please select a booking date");
      return;
    }

    if (!startTime) {
      showMessage("Please select a time slot");
      return;
    }

    const selectedSlot = slots.find((slot) => slot.StartTime === startTime);

    if (selectedSlot && selectedSlot.Available < selectedVehicleIds.length) {
      showMessage(
        `This time slot only has ${selectedSlot.Available} seats left, not enough for ${selectedVehicleIds.length} vehicles`
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
          `${vehicle.LicensePlate} - ${vehicle.Brand || "Not updated"} ${
            vehicle.Model || ""
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

        <main className="min-h-screen bg-black px-6 py-10 text-white">
          <div className="mx-auto max-w-6xl rounded-3xl border border-slate-800 bg-slate-950 p-8 shadow-2xl shadow-black">
            Loading booking data...
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-slate-100">
        <section className="relative overflow-hidden bg-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.35),transparent_20%),radial-gradient(circle_at_80%_20%,rgba(250,204,21,0.28),transparent_18%),radial-gradient(circle_at_70%_85%,rgba(168,85,247,0.25),transparent_22%)]" />

          <div className="absolute left-10 top-10 h-28 w-28 rounded-full bg-white/5" />
          <div className="absolute bottom-10 right-20 h-40 w-40 rounded-full bg-yellow-400/10" />
          <div className="absolute right-1/3 top-20 h-20 w-20 rounded-full bg-blue-500/10" />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.25em] text-yellow-300 backdrop-blur">
                <Sparkles size={16} />
                Premium Booking
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight text-white md:text-6xl">
                Book your car wash in a luxury dark style.
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Choose your branch, vehicles, service package and available time
                slot. Fast, simple and convenient.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-4 backdrop-blur">
                  <p className="text-2xl font-black text-white">
                    {branches.length}
                  </p>
                  <p className="text-sm text-slate-400">Active branches</p>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-4 backdrop-blur">
                  <p className="text-2xl font-black text-white">
                    {vehicles.length}
                  </p>
                  <p className="text-sm text-slate-400">Your vehicles</p>
                </div>

                <div className="rounded-2xl bg-yellow-400 px-5 py-4 text-slate-950 shadow-lg shadow-yellow-400/30">
                  <p className="text-2xl font-black">4</p>
                  <p className="text-sm font-semibold">Cars per slot</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-700 bg-slate-950/70 p-6 text-white shadow-2xl shadow-black/60 backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400 text-slate-950">
                  <Car size={28} />
                </div>

                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                    Smart Booking
                  </p>
                  <h2 className="text-2xl font-black">Wash appointment</h2>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <CheckCircle2 className="text-yellow-400" />
                  <span>Select multiple vehicles in one booking</span>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <Clock3 className="text-yellow-400" />
                  <span>View available time slots instantly</span>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <Wallet className="text-yellow-400" />
                  <span>See estimated payment before confirming</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_380px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-black/60"
          >
            {message && (
              <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
                {message}
              </div>
            )}

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
                <Phone size={24} />
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-400">
                  Step 1
                </p>
                <h2 className="text-2xl font-black text-white">
                  Customer Information
                </h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-bold text-slate-200">
                  Full name <span className="text-red-400">*</span>
                </label>

                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20"
                />
              </div>

              <div>
                <label className="mb-2 block font-bold text-slate-200">
                  Phone number <span className="text-red-400">*</span>
                </label>

                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20"
                />
              </div>
            </div>

            <div className="mt-10 mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/15 text-yellow-400">
                <CalendarDays size={24} />
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-400">
                  Step 2
                </p>
                <h2 className="text-2xl font-black text-white">
                  Booking Details
                </h2>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-bold text-slate-200">
                  Branch <span className="text-red-400">*</span>
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
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20"
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
                <label className="mb-2 block font-bold text-slate-200">
                  Booking date <span className="text-red-400">*</span>
                </label>

                <input
                  type="date"
                  min={today}
                  value={bookingDate}
                  onChange={(e) => {
                    setBookingDate(e.target.value);
                    setStartTime("");
                  }}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block font-bold text-slate-200">
                  Vehicles <span className="text-red-400">*</span>
                </label>

                <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
                  {vehicles.length === 0 ? (
                    <p className="text-sm text-slate-400">
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
                            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm transition ${
                              checked
                                ? "border-yellow-400 bg-yellow-400 text-slate-950 shadow-md shadow-yellow-400/30"
                                : "border-slate-700 bg-slate-950 text-slate-200 hover:border-yellow-400"
                            } ${
                              disabled ? "cursor-not-allowed opacity-50" : ""
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
                              <p
                                className={`text-xs ${
                                  checked
                                    ? "text-slate-800"
                                    : "text-slate-400"
                                }`}
                              >
                                {vehicle.Brand || "Unknown"}{" "}
                                {vehicle.Model || ""}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <p className="mt-3 text-sm font-semibold text-slate-400">
                    Selected {selectedVehicleIds.length}/{MAX_CARS_PER_SLOT}{" "}
                    vehicles
                  </p>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block font-bold text-slate-200">
                  Service <span className="text-red-400">*</span>
                </label>

                <select
                  value={serviceId}
                  disabled={!branchId || loadingServices}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 disabled:bg-slate-800 disabled:text-slate-500"
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
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300">
                <div className="mb-3 flex items-center gap-2 font-black text-yellow-400">
                  <MapPin size={18} />
                  Branch information
                </div>

                <p>
                  <span className="font-bold text-white">Address:</span>{" "}
                  {selectedBranch.Address || "Not updated"}
                </p>

                <p className="mt-1">
                  <span className="font-bold text-white">Phone:</span>{" "}
                  {selectedBranch.Phone || "Not updated"}
                </p>

                <p className="mt-1">
                  <span className="font-bold text-white">Opening hours:</span>{" "}
                  {formatTime(selectedBranch.OpenTime)} -{" "}
                  {formatTime(selectedBranch.CloseTime)}
                </p>
              </div>
            )}

            {selectedVehicles.length > 0 && (
              <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300">
                <div className="mb-3 flex items-center gap-2 font-black text-yellow-400">
                  <Car size={18} />
                  Selected vehicles: {selectedVehicles.length}/
                  {MAX_CARS_PER_SLOT}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {selectedVehicles.map((vehicle) => (
                    <div
                      key={vehicle.VehicleID}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                    >
                      <p>
                        <span className="font-bold text-white">Plate:</span>{" "}
                        {vehicle.LicensePlate}
                      </p>

                      <p className="mt-1">
                        <span className="font-bold text-white">Type:</span>{" "}
                        {vehicle.VehicleType || "Not updated"}
                      </p>

                      <p className="mt-1">
                        <span className="font-bold text-white">
                          Brand / model:
                        </span>{" "}
                        {vehicle.Brand || "Not updated"} {vehicle.Model || ""}
                      </p>

                      <p className="mt-1">
                        <span className="font-bold text-white">Color:</span>{" "}
                        {vehicle.Color || "Not updated"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedService && (
              <div className="mt-6 rounded-3xl border border-yellow-400/30 bg-yellow-400/10 p-5 text-sm text-slate-300">
                <div className="mb-3 flex items-center gap-2 font-black text-yellow-400">
                  <Wrench size={18} />
                  Selected service
                </div>

                <p>
                  <span className="font-bold text-white">Service:</span>{" "}
                  {selectedService.ServiceName}
                </p>

                <p className="mt-1">
                  <span className="font-bold text-white">Description:</span>{" "}
                  {selectedService.Description || "No description"}
                </p>

                <p className="mt-1">
                  <span className="font-bold text-white">Duration:</span>{" "}
                  {selectedService.DurationMinutes || 0} minutes
                </p>

                <p className="mt-1">
                  <span className="font-bold text-white">Price:</span>{" "}
                  {formatMoney(selectedService.ActualPrice)} / vehicle
                </p>
              </div>
            )}

            <div className="mt-10">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-400">
                  <Clock3 size={24} />
                </div>

                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">
                    Step 3
                  </p>
                  <h2 className="text-2xl font-black text-white">
                    Available Time Slots
                  </h2>
                </div>
              </div>

              {!branchId || !bookingDate ? (
                <p className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-sm text-slate-400">
                  Please select a branch and booking date first.
                </p>
              ) : loadingSlots ? (
                <p className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4 text-sm text-slate-400">
                  Loading available slots...
                </p>
              ) : slots.length === 0 ? (
                <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm font-semibold text-red-300">
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
                        className={`rounded-2xl border px-4 py-4 text-left font-bold transition disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900 disabled:text-slate-600 ${
                          isSelected
                            ? "border-yellow-400 bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-400/30"
                            : "border-slate-700 bg-slate-950 text-slate-200 hover:border-yellow-400 hover:bg-slate-900"
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
              <label className="mb-2 block font-bold text-slate-200">
                Note
              </label>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Example: Please clean the interior carefully..."
                rows={4}
                className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20"
              />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-7 py-4 font-black text-slate-950 shadow-lg shadow-yellow-400/40 transition hover:bg-yellow-300 disabled:bg-slate-700 disabled:text-slate-400"
              >
                {isSubmitting ? "Booking..." : "Confirm Booking"}
                <ArrowRight
                  size={18}
                  className="transition group-hover:translate-x-1"
                />
              </button>

              <Link
                to="/register-car"
                className="rounded-2xl border border-slate-700 px-7 py-4 text-center font-black text-slate-200 transition hover:border-yellow-400 hover:text-yellow-400"
              >
                Register New Vehicle
              </Link>
            </div>
          </form>

          <aside className="h-fit rounded-[2rem] border border-slate-800 bg-slate-950 p-6 shadow-2xl shadow-black/60 lg:sticky lg:top-28">
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-black to-slate-950 p-6 text-white ring-1 ring-slate-800">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-yellow-400">
                Summary
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Your Wash Appointment
              </h2>
            </div>

            <div className="mt-6 space-y-5 text-sm">
              <div>
                <p className="text-slate-400">Customer</p>
                <p className="font-black text-white">
                  {fullName || "Not entered"}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Phone</p>
                <p className="font-black text-white">
                  {phone || "Not entered"}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Branch</p>
                <p className="font-black text-white">
                  {selectedBranch?.BranchName || "Not selected"}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Vehicles</p>

                {selectedVehicles.length === 0 ? (
                  <p className="font-black text-white">Not selected</p>
                ) : (
                  <ul className="list-inside list-disc font-black text-white">
                    {selectedVehicles.map((vehicle) => (
                      <li key={vehicle.VehicleID}>{vehicle.LicensePlate}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="text-slate-400">Service</p>
                <p className="font-black text-white">
                  {selectedService?.ServiceName || "Not selected"}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Date & time</p>
                <p className="font-black text-white">
                  {bookingDate || "Not selected"}{" "}
                  {startTime && `at ${startTime}`}
                </p>
              </div>

              <div className="border-t border-slate-800 pt-5">
                <p className="text-slate-400">Estimated payment</p>
                <p className="mt-1 text-4xl font-black text-yellow-400">
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