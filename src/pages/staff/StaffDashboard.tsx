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
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-8 py-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff Dashboard</h1>
          <p className="text-sm text-slate-400">Auto Wash Pro Management</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-semibold text-white">Nguyễn Văn Staff</p>
            <p className="text-sm text-emerald-400">● Working</p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
            S
          </div>
        </div>
      </header>

      <main className="px-8 py-8">
        <section className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-slate-900 via-blue-950 to-violet-950 px-8 py-8 text-white shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
            Staff Panel
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            Welcome to your shift, {staffName}!
          </h2>

          <p className="mt-3 text-lg text-slate-300">
            This is the overview page for Auto Wash Pro staff members.
          </p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/20 text-3xl">
                📋
              </div>

              <div>
                <p className="text-sm text-slate-400">Main task</p>
                <h3 className="mt-1 text-xl font-bold text-white">
                  Process bookings
                </h3>
              </div>
            </div>

            <p className="mt-5 leading-relaxed text-slate-400">
              View today&apos;s bookings, check in vehicles, start washing, and
              complete services.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/20 text-3xl">
                👥
              </div>

              <div>
                <p className="text-sm text-slate-400">Role</p>
                <h3 className="mt-1 text-xl font-bold text-white">Staff</h3>
              </div>
            </div>

            <p className="mt-5 leading-relaxed text-slate-400">
              Staff members can only manage bookings assigned to their own
              branch.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/20 text-3xl">
                🗓️
              </div>

              <div>
                <p className="text-sm text-slate-400">Frequently used page</p>
                <h3 className="mt-1 text-xl font-bold text-white">
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

        <section className="mt-8 rounded-2xl border border-blue-500/30 bg-blue-950/40 px-6 py-5 text-blue-200">
          Tip: Go to <span className="font-bold text-sky-300">Booking Management</span>{" "}
          to view today&apos;s booking list and update the status of each
          vehicle.
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white">Today&apos;s Workflow</h3>

            <div className="mt-5 space-y-4">
              <div className="flex gap-4 rounded-xl bg-slate-800/70 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white">Check bookings</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Review all bookings assigned to your branch.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-xl bg-slate-800/70 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold text-white">Check in vehicles</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Confirm customer arrival and update vehicle status.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 rounded-xl bg-slate-800/70 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold text-white">Complete services</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Finish washing and mark the booking item as completed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white">Quick Notes</h3>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                <p className="font-semibold text-white">Only update real status</p>
                <p className="mt-1 text-sm text-slate-400">
                  Do not mark a vehicle as completed before the service is
                  actually finished.
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                <p className="font-semibold text-white">Check customer details</p>
                <p className="mt-1 text-sm text-slate-400">
                  Make sure the license plate and selected services match the
                  customer&apos;s booking.
                </p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                <p className="font-semibold text-white">Keep the queue updated</p>
                <p className="mt-1 text-sm text-slate-400">
                  Status updates help managers track the branch operation in
                  real time.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StaffDashboard;