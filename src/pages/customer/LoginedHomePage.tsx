import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Car,
  ClipboardList,
  FileText,
  User,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Navbar from "../../components/Navbar";

type UserInfo = {
  FullName?: string;
  fullName?: string;
  Email?: string;
  email?: string;
};

function getUserFromStorage(): UserInfo | null {
  try {
    const userStr = localStorage.getItem("user");

    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (error) {
    console.log(error);
  }

  return null;
}

function LoginedHomePage() {
  const navigate = useNavigate();

  const user = getUserFromStorage();

  const displayName =
    user?.FullName || user?.fullName || user?.Email || user?.email || "Customer";

  const quickActions = [
    {
      title: "Booking",
      description: "Book a car wash service at your preferred branch.",
      icon: <CalendarDays size={34} className="text-sky-600" />,
      path: "/booking",
      color: "bg-sky-50",
    },
    {
      title: "Booking History",
      description: "View your previous and upcoming booking records.",
      icon: <ClipboardList size={34} className="text-indigo-600" />,
      path: "/customer/bookings",
      color: "bg-indigo-50",
    },
    {
      title: "Register Vehicle",
      description: "Add a new vehicle to your Auto Wash Pro account.",
      icon: <Car size={34} className="text-rose-600" />,
      path: "/register-car",
      color: "bg-rose-50",
    },
    {
      title: "My Vehicles",
      description: "Manage your registered vehicles and vehicle details.",
      icon: <FileText size={34} className="text-purple-600" />,
      path: "/customer/vehicles",
      color: "bg-purple-50",
    },
    {
      title: "Profile",
      description: "Check and update your personal account information.",
      icon: <User size={34} className="text-violet-600" />,
      path: "/customer/profile",
      color: "bg-violet-50",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-100">
        <section
          className="relative min-h-[520px] bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(2,6,23,0.86), rgba(2,6,23,0.55), rgba(2,6,23,0.3)), url('https://images.unsplash.com/photo-1607860108855-64acf2078ed9?q=80&w=1600&auto=format&fit=crop')",
          }}
        >
          <div className="mx-auto flex min-h-[520px] max-w-7xl items-center px-6">
            <div className="max-w-3xl text-white">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-300/40 bg-white/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.35em] text-sky-300 backdrop-blur">
                <Sparkles size={16} />
                Welcome
              </div>

              <h1 className="text-6xl font-black leading-tight md:text-7xl">
                {displayName}
              </h1>

              <p className="mt-6 max-w-2xl text-xl leading-9 text-slate-100">
                You can book a car wash, manage your registered vehicles, and
                view your personal information in the Auto Wash Pro system.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/booking")}
                  className="rounded-xl bg-sky-600 px-7 py-4 font-bold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-700"
                >
                  Book a Car Wash
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/customer/vehicles")}
                  className="rounded-xl bg-white px-7 py-4 font-bold text-slate-900 shadow-lg transition hover:bg-slate-100"
                >
                  My Vehicles
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/customer/bookings")}
                  className="rounded-xl border border-white/40 bg-white/10 px-7 py-4 font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Booking History
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-14">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-sky-600">
              Customer Center
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-900">
              What would you like to do today?
            </h2>

            <p className="mt-2 text-slate-500">
              Access all main customer features from one place.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {quickActions.map((item) => (
              <Link
                key={item.title}
                to={item.path}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${item.color}`}
                >
                  {item.icon}
                </div>

                <h3 className="mt-6 text-xl font-black text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-500">
                  {item.description}
                </p>

                <div className="mt-5 flex items-center gap-2 font-bold text-sky-600">
                  Open
                  <ArrowRight
                    size={18}
                    className="transition group-hover:translate-x-1"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white py-14">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-3">
            <div className="rounded-3xl bg-slate-900 p-8 text-white">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-sky-300">
                Fast
              </p>

              <h3 className="mt-4 text-2xl font-black">
                Quick Booking Process
              </h3>

              <p className="mt-3 leading-7 text-slate-300">
                Choose your branch, vehicle, service, and available time slot in
                just a few steps.
              </p>
            </div>

            <div className="rounded-3xl bg-sky-600 p-8 text-white">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-sky-100">
                Convenient
              </p>

              <h3 className="mt-4 text-2xl font-black">
                Vehicle Management
              </h3>

              <p className="mt-3 leading-7 text-sky-50">
                Store and manage all your vehicle information directly in your
                customer account.
              </p>
            </div>

            <div className="rounded-3xl bg-indigo-600 p-8 text-white">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-indigo-100">
                Reliable
              </p>

              <h3 className="mt-4 text-2xl font-black">
                Booking Tracking
              </h3>

              <p className="mt-3 leading-7 text-indigo-50">
                Track your service history and booking status anytime inside the
                Auto Wash Pro platform.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default LoginedHomePage;