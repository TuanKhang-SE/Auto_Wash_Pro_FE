import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";

const AdminLayout: React.FC = () => {
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
      <AdminSidebar />

      {/* Main Content */}
      <main className="ml-64 flex-1 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 h-16 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shadow-lg">
          <div>
            <h1 className="text-xl font-bold text-white">
              Bảng điều khiển Quản trị
            </h1>
            <p className="text-sm text-slate-400">
              Auto Wash Pro - Quản lý toàn bộ hệ thống
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Role Badge */}
            <div className="flex items-center gap-2 rounded-full bg-rose-500/20 border border-rose-500/30 px-4 py-1.5">
              <span className="text-sm text-rose-400 font-medium">
                Quản trị viên
              </span>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">
                  {user?.fullName || user?.username || "Admin"}
                </p>
                <p className="text-xs text-emerald-400">
                  ● Trực tuyến
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center font-semibold shadow-lg">
                {user?.fullName?.[0] || user?.username?.[0] || "A"}
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

export default AdminLayout;