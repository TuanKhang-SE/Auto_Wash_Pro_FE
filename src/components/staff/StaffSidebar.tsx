import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Car, LogOut, User } from "lucide-react";
import { staffMenu } from "../../constants/staffMenu";

const StaffSidebar: React.FC = () => {
  const navigate = useNavigate();
  const [staffName, setStaffName] = useState("Nhân viên");

  useEffect(() => {
    const getUserFromStorage = () => {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setStaffName(user?.fullName || user?.email || "Nhân viên");
        }
      } catch {}
    };
    getUserFromStorage();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col justify-between border-r border-slate-800 bg-slate-900 text-white">
      {/* Logo */}
      <div>
        <div className="flex items-center gap-3 border-b border-slate-800 p-5">
          <div className="rounded-lg bg-blue-600 p-2">
            <Car size={24} className="text-white" />
          </div>

          <div>
            <h1 className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-lg font-bold text-transparent">
              AutoWash Pro
            </h1>

            <p className="text-xs text-slate-400">
              Phân hệ Nhân viên
            </p>
          </div>
        </div>

        {/* Menu */}
        <nav className="mt-6 px-3">
          <div className="space-y-2">
            {staffMenu.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 border border-blue-500">
            <User size={18} className="text-blue-400" />
          </div>

          <div className="overflow-hidden">
            <p className="truncate text-sm font-semibold">
              {staffName}
            </p>

            <p className="flex items-center gap-1 text-xs text-emerald-400">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
              Đang làm ca
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

export default StaffSidebar;