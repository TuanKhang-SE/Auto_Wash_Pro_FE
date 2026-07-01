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

const NOT_UPDATED_TEXT = "Not updated";
const NOT_SELECTED_TEXT = "Not selected";

function formatMoney(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString("en-US") + " VND";
}

function formatVehicleName(vehicle: Vehicle) {
  const brand = vehicle.Brand || NOT_UPDATED_TEXT;
  const model = vehicle.Model ? ` ${vehicle.Model}` : "";

  return `${vehicle.LicensePlate} - ${brand}${model}`;
}

function formatBookingDate(value: string) {
  if (!value) {
    return NOT_SELECTED_TEXT;
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
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

  const selectedSlot = slots.find((slot) => slot.StartTime === startTime);

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

    if (!vehicleId) {
      showMessage("Please select a vehicle");
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
            vehicleName: selectedVehicle ? formatVehicleName(selectedVehicle) : "",
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
            Loading booking data...
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

            <h1 className="mt-3 text-3xl font-bold">Book a Car Wash</h1>

            <p className="mt-2 text-slate-300">
              Select a branch, vehicle, service, and a suitable time slot.
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
              Customer Information
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Full Name <span className="text-red-500">*</span>
                </label>

                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            <h2 className="mt-8 text-xl font-bold text-slate-800">
              Booking Information
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-semibold text-slate-700">
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="">Select a branch</option>

                  {branches.map((branch) => (
                    <option key={branch.BranchID} value={branch.BranchID}>
                      {branch.BranchName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Vehicle <span className="text-red-500">*</span>
                </label>

                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="">Select a vehicle</option>

                  {vehicles.map((vehicle) => (
                    <option key={vehicle.VehicleID} value={vehicle.VehicleID}>
                      {formatVehicleName(vehicle)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-700">
                  Booking Date <span className="text-red-500">*</span>
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
                  Service <span className="text-red-500">*</span>
                </label>

                <select
                  value={serviceId}
                  disabled={!branchId || loadingServices}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-gray-100"
                >
                  <option value="">
                    {!branchId
                      ? "Select a branch first"
                      : loadingServices
                      ? "Loading services..."
                      : "Select a service"}
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
                  <span className="font-semibold">Address:</span>{" "}
                  {selectedBranch.Address || NOT_UPDATED_TEXT}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Phone:</span>{" "}
                  {selectedBranch.Phone || NOT_UPDATED_TEXT}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Opening Hours:</span>{" "}
                  {formatTime(selectedBranch.OpenTime)} -{" "}
                  {formatTime(selectedBranch.CloseTime)}
                </p>
              </div>
            )}

            {selectedVehicle && (
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  <span className="font-semibold">Selected Vehicle:</span>{" "}
                  {selectedVehicle.LicensePlate}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Vehicle Type:</span>{" "}
                  {selectedVehicle.VehicleType || NOT_UPDATED_TEXT}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Brand / Model:</span>{" "}
                  {selectedVehicle.Brand || NOT_UPDATED_TEXT}{" "}
                  {selectedVehicle.Model || ""}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Color:</span>{" "}
                  {selectedVehicle.Color || NOT_UPDATED_TEXT}
                </p>
              </div>
            )}

            {selectedService && (
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  <span className="font-semibold">Selected Service:</span>{" "}
                  {selectedService.ServiceName}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Description:</span>{" "}
                  {selectedService.Description || "No description available"}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Duration:</span>{" "}
                  {selectedService.DurationMinutes || 0} minutes
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Price:</span>{" "}
                  {formatMoney(selectedService.ActualPrice)}
                </p>
              </div>
            )}

            <div className="mt-8">
              <label className="mb-3 block font-semibold text-slate-700">
                Time Slot <span className="text-red-500">*</span>
              </label>

              {!branchId || !bookingDate ? (
                <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-slate-500">
                  Please select a branch and date first.
                </p>
              ) : loadingSlots ? (
                <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-slate-500">
                  Loading time slots...
                </p>
              ) : slots.length === 0 ? (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  No available time slots.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {slots.map((slot) => {
                    const isSelected = startTime === slot.StartTime;

                    const isDisabled =
                      slot.Available <= 0 || slot.Status !== "Available";

                    return (
                      <button
                        key={slot.StartTime}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setStartTime(slot.StartTime)}
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
                          {slot.ShiftName} | {slot.Available}/
                          {slot.MaxCapacity} spots left
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedSlot && (
              <div className="mt-5 rounded-xl bg-sky-50 p-4 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Selected Time Slot:</span>{" "}
                  {selectedSlot.StartTime} - {selectedSlot.EndTime}
                </p>

                <p className="mt-1">
                  <span className="font-semibold">Remaining Capacity:</span>{" "}
                  {selectedSlot.Available}/{selectedSlot.MaxCapacity} spots
                </p>
              </div>
            )}

            <div className="mt-8">
              <label className="mb-2 block font-semibold text-slate-700">
                Note
              </label>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Example: The car is very dusty; please clean the interior carefully..."
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
                {isSubmitting ? "Booking..." : "Book Now"}
              </button>

              <Link
                to="/register-car"
                className="rounded-lg border border-gray-300 px-6 py-3 text-center font-semibold text-slate-700 hover:bg-gray-50"
              >
                Register New Vehicle
              </Link>
            </div>
          </form>

          <aside className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-slate-800">
              Appointment Summary
            </h2>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-slate-500">Customer</p>
                <p className="font-semibold text-slate-800">
                  {fullName || "Not entered"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Phone Number</p>
                <p className="font-semibold text-slate-800">
                  {phone || "Not entered"}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Branch</p>
                <p className="font-semibold text-slate-800">
                  {selectedBranch?.BranchName || NOT_SELECTED_TEXT}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Vehicle</p>
                <p className="font-semibold text-slate-800">
                  {selectedVehicle
                    ? formatVehicleName(selectedVehicle)
                    : NOT_SELECTED_TEXT}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Service</p>
                <p className="font-semibold text-slate-800">
                  {selectedService?.ServiceName || NOT_SELECTED_TEXT}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Date & Time</p>
                <p className="font-semibold text-slate-800">
                  {formatBookingDate(bookingDate)}{" "}
                  {startTime && `at ${startTime}`}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Note</p>
                <p className="font-semibold text-slate-800">
                  {note || "No note"}
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-slate-500">Estimated Payment</p>
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