import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Shield, User } from "lucide-react";
import { adminMenu } from "../../constants/adminMenu";

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) return JSON.parse(userStr);
    } catch (e) {}
    return null;
  };

  const user = getUserFromStorage();

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col justify-between border-r border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      {/* Logo */}
      <div>
        <div className="flex items-center gap-3 border-b border-slate-800 p-5">
          <div className="rounded-lg bg-gradient-to-br from-rose-600 to-pink-600 p-2.5 shadow-lg shadow-rose-500/30">
            <Shield size={24} className="text-white" />
          </div>

          <div>
            <h1 className="bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-lg font-bold text-transparent">
              AutoWash Pro
            </h1>

            <p className="flex items-center gap-1 text-xs text-amber-400">
              <Shield size={12} />
              Phân hệ Quản trị
            </p>
          </div>
        </div>

        {/* Role Badge */}
        <div className="mx-3 mt-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3">
          <p className="text-xs text-slate-400">Vai trò</p>
          <p className="font-semibold text-rose-400">Quản trị viên hệ thống</p>
        </div>

        {/* Menu */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {adminMenu.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-500/30"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      {/* User + Logout */}
      <div className="border-t border-slate-800 bg-slate-950/40 p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 border border-rose-400/50 shadow-lg shadow-rose-500/20">
            <User size={18} className="text-white" />
          </div>

          <div className="overflow-hidden">
            <p className="truncate text-sm font-semibold">
              {user?.fullName || user?.username || "Admin"}
            </p>

            <p className="flex items-center gap-1 text-xs text-emerald-400">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Đang hoạt động
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut size={20} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;