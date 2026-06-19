import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import ManagerSidebar from "../components/manager/ManagerSidebar";

const ManagerLayout: React.FC = () => {
  const navigate = useNavigate();

  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) return JSON.parse(userStr);
    } catch (e) {}
    return null;
  };

  const user = getUserFromStorage();

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <ManagerSidebar />

      {/* Main Content */}
      <main className="ml-64 flex-1 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 h-16 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shadow-lg">
          <div>
            <h1 className="text-xl font-bold text-white">
              Bảng điều khiển Quản lý
            </h1>
            <p className="text-sm text-slate-400">
              Auto Wash Pro - Hệ thống quản lý chi nhánh
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Branch Badge */}
            <div className="flex items-center gap-2 rounded-full bg-blue-500/20 border border-blue-500/30 px-4 py-1.5">
              <span className="text-sm text-blue-400 font-medium">
                {user?.BranchName || "Chi nhánh A"}
              </span>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">
                  {user?.FullName || user?.username || "Quản lý"}
                </p>
                <p className="text-xs text-emerald-400">
                  ● Trực tuyến
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-semibold shadow-lg">
                {user?.FullName?.[0] || user?.username?.[0] || "M"}
              </div>
            </div>
          </div>
        </header>

        {/* Nội dung các trang */}
        <div className="p-6 bg-slate-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ManagerLayout;
