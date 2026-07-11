import { Link } from "react-router-dom";

function getStaffName() {
  const userString = localStorage.getItem("user");

  if (!userString) {
    return "Staff";
  }

  try {
    const user = JSON.parse(userString);
    return (
      user.fullName ||
      user.FullName ||
      user.name ||
      user.Name ||
      user.email ||
      user.Email ||
      "Staff"
    );
  } catch {
    return "Staff";
  }
}

const StaffDashboard = () => {
  const staffName = getStaffName();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Staff Dashboard
          </h1>
          <p className="text-sm text-slate-500">Auto Wash Pro Management</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold text-slate-800">Nguyễn Văn Staff</p>
            <p className="text-sm text-emerald-500">● Working</p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
            S
          </div>
        </div>
      </header>

      <main className="px-8 py-8">
        <section className="rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-8 py-8 text-white shadow-sm">
          <h2 className="text-3xl font-bold">
            Welcome to your shift, {staffName}!
          </h2>

          <p className="mt-3 text-lg text-blue-50">
            This is the overview page for Auto Wash Pro staff members.
          </p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-3xl">
                📋
              </div>

              <div>
                <p className="text-sm text-slate-500">Main task</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  Process bookings
                </h3>
              </div>
            </div>

            <p className="mt-5 leading-relaxed text-slate-500">
              View today&apos;s bookings, check in vehicles, start washing, and
              complete services.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 text-3xl">
                👥
              </div>

              <div>
                <p className="text-sm text-slate-500">Role</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  Staff
                </h3>
              </div>
            </div>

            <p className="mt-5 leading-relaxed text-slate-500">
              Staff members can only manage bookings assigned to their own
              branch.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100 text-3xl">
                🗓️
              </div>

              <div>
                <p className="text-sm text-slate-500">Frequently used page</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  Booking Management
                </h3>
              </div>
            </div>

            <Link
              to="/staff/bookings"
              className="mt-6 inline-flex items-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Go to Booking Management →
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 px-6 py-5 text-blue-700">
          Tip: Go to{" "}
          <span className="font-bold">Booking Management</span> to view
          today&apos;s booking list and update the status of each vehicle.
        </section>
      </main>
    </div>
  );
};

export default StaffDashboard;