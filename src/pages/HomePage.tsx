import { Outlet } from "react-router-dom";
import StaffSidebar from "../../components/staff/StaffSidebar";

const StaffLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <StaffSidebar />

      <div className="ml-72 min-h-screen bg-slate-950">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-8 py-4 shadow-lg">
          <div>
            <h1 className="text-2xl font-bold text-white">Staff Dashboard</h1>
            <p className="text-sm text-slate-400">Auto Wash Pro Management</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-white">Nguyễn Văn Staff</p>
              <p className="text-sm text-emerald-400">● Đang làm việc</p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
              S
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-80px)] bg-slate-950 px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;