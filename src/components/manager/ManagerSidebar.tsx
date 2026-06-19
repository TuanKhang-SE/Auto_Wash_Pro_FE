import React, { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Car, LogOut, Building2, User } from "lucide-react";
import { managerMenu } from "../../constants/managerMenu";
import axiosClient from "../../api/axiosClient";

const ManagerSidebar: React.FC = () => {
  const navigate = useNavigate();
  const [branchName, setBranchName] = React.useState<string>("");

  useEffect(() => {
    const fetchBranchName = async () => {
      const user = getUserFromStorage();
      if (user?.branchId) {
        try {
          const token = localStorage.getItem("token");
          const res = await axiosClient.get(`/api/branches/${user.branchId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data?.success) {
            setBranchName(res.data.data.BranchName || "");
          }
        } catch {
          // fallback
        }
      }
    };
    fetchBranchName();
  }, []);

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
          <div className="rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 shadow-lg shadow-blue-500/30">
            <Car size={24} className="text-white" />
          </div>

          <div>
            <h1 className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-lg font-bold text-transparent">
              AutoWash Pro
            </h1>

            <p className="flex items-center gap-1 text-xs text-amber-400">
              <Building2 size={12} />
              Phân hệ Quản lý
            </p>
          </div>
        </div>

        {/* Branch Info */}
        <div className="mx-3 mt-4 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
          <p className="text-xs text-slate-400">Chi nhánh</p>
          <p className="font-semibold text-blue-400">
            {branchName || "Chi nhánh A"}
          </p>
        </div>

        {/* Menu */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {managerMenu.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/manager"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 border border-amber-400/50 shadow-lg shadow-amber-500/20">
            <User size={18} className="text-white" />
          </div>

          <div className="overflow-hidden">
            <p className="truncate text-sm font-semibold">
              {user?.fullName || "Quản lý"}
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

export default ManagerSidebar;
