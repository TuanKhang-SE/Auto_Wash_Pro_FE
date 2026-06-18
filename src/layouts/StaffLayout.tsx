import React from "react";
import { Outlet } from "react-router-dom";
import StaffSidebar from "../components/staff/StaffSidebar";

const StaffLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <StaffSidebar />

      {/* Main Content */}
      <main className="ml-64 flex-1 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Staff Dashboard
            </h1>
            <p className="text-sm text-slate-500">
              Auto Wash Pro Management
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">
                Nguyễn Văn Staff
              </p>
              <p className="text-xs text-emerald-500">
                ● Đang làm việc
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              S
            </div>
          </div>
        </header>

        {/* Nội dung các trang */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StaffLayout;