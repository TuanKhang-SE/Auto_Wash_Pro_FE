import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  UserCog,
  CalendarCheck,
  Car,
  DollarSign,
  Shield,
} from "lucide-react";
import StatCard from "../../components/admin/AdminStatCard";
import userService from "../../services/userService";
import branchService from "../../services/branchService";
import revenueService from "../../services/revenueService";

interface BranchStats {
  branchID: number;
  branchName: string;
  address: string | null;
  totalStaff: number;
  todayBookings: number;
  revenue: number;
  occupancy: number;
  status: "Active" | "Inactive";
}

interface AdminStats {
  totalBranches: number;
  totalManagers: number;
  totalStaff: number;
  totalBookings: number;
  monthlyRevenue: number;
  activeUsers: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalBranches: 3,
    totalManagers: 0,
    totalStaff: 0,
    totalBookings: 0,
    monthlyRevenue: 0,
    activeUsers: 0,
  });
  const [branchStats, setBranchStats] = useState<BranchStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Tải song song 3 nguồn dữ liệu để hiển thị dashboard tổng quan:
    // - branchService.getAllBranches(): GET /api/branches - tổng số chi nhánh
    // - userService.getAllUsers({Role:"Manager"}): GET /api/users?Role=Manager - số Manager
    // - userService.getAllUsers({Role:"Staff"}): GET /api/users?Role=Staff - số Staff active
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [branchesData, managersData, staffData] = await Promise.all([
          branchService.getAllBranches(),
          userService.getAllUsers({ Role: "Manager" }),
          userService.getAllUsers({ Role: "Staff" }),
        ]);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        const today = now.toISOString().split("T")[0];

        let monthlyRevenue = 0;
        try {
          const cashflow = await revenueService.getDailyCashflow({
            StartDate: startOfMonth,
            EndDate: today,
          });
          monthlyRevenue = cashflow.summary.total;
        } catch {
          monthlyRevenue = 0;
        }

        const activeBranches = branchesData.filter((b) => b.Status === "Active");
        const activeStaff = staffData.filter((s) => s.Status === "Active");
        const branchStaffMap = new Map<number, number>();
        activeStaff.forEach((s) => {
          if (s.BranchID) {
            branchStaffMap.set(s.BranchID, (branchStaffMap.get(s.BranchID) || 0) + 1);
          }
        });

        const branchRevenueMap = new Map<number, number>();
        if (monthlyRevenue > 0 && activeBranches.length > 0) {
          const perBranch = monthlyRevenue / activeBranches.length;
          activeBranches.forEach((b) => branchRevenueMap.set(b.BranchID, perBranch));
        }

        const branchStatsData = branchesData.map((b) => ({
          branchID: b.BranchID,
          branchName: b.BranchName,
          address: b.Address,
          totalStaff: branchStaffMap.get(b.BranchID) || 0,
          todayBookings: 0,
          revenue: branchRevenueMap.get(b.BranchID) || 0,
          occupancy: 0,
          status: b.Status,
        }));

        setStats({
          totalBranches: activeBranches.length,
          totalManagers: managersData.length,
          totalStaff: activeStaff.length,
          totalBookings: 0,
          monthlyRevenue,
          activeUsers: managersData.filter((m) => m.Status === "Active").length + activeStaff.length,
        });

        setBranchStats(branchStatsData);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
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
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 p-6 text-white shadow-xl shadow-rose-500/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">
              Chào mừng, {user?.fullName || user?.username || "Admin"}!
            </h2>
            <p className="mt-1 text-rose-100">
              Tổng quan toàn bộ hệ thống Auto Wash Pro - {stats.totalBranches}{" "}
              chi nhánh đang hoạt động.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Tổng chi nhánh"
          value={stats.totalBranches}
          icon={<Building2 size={24} />}
          color="blue"
        />
        <StatCard
          title="Tổng Manager"
          value={stats.totalManagers}
          icon={<UserCog size={24} />}
          color="purple"
        />
        <StatCard
          title="Tổng Staff"
          value={stats.totalStaff}
          icon={<Users size={24} />}
          color="emerald"
        />
        <StatCard
          title="Lịch hẹn (tháng)"
          value={stats.totalBookings.toLocaleString("vi-VN")}
          icon={<CalendarCheck size={24} />}
          trend={{ value: 12, isUp: true }}
          color="rose"
        />
        <StatCard
          title="Doanh thu (tháng)"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={<DollarSign size={24} />}
          trend={{ value: 8, isUp: true }}
          color="amber"
        />
        <StatCard
          title="Người dùng hoạt động"
          value={stats.activeUsers}
          icon={<Shield size={24} />}
          color="blue"
        />
      </div>

      {/* Branch Performance */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Hiệu suất các Chi nhánh
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Theo dõi hoạt động của từng chi nhánh trong ngày hôm nay
            </p>
          </div>
          <a
            href="/admin/branches"
            className="text-sm font-medium text-rose-600 hover:text-rose-700"
          >
            Xem chi tiết →
          </a>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {branchStats.map((branch) => (
              <div
                key={branch.branchID}
                className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-rose-100 p-2">
                      <Building2 size={20} className="text-rose-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {branch.branchName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Mã CN: #{branch.branchID}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    branch.status === "Active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      branch.status === "Active" ? "bg-emerald-500" : "bg-slate-400"
                    }`}></span>
                    {branch.status === "Active" ? "Hoạt động" : "Ngừng"}
                  </span>
                </div>

                <div className="space-y-3">
                  {branch.address && (
                    <div className="flex items-start text-xs text-slate-500 mb-1">
                      <span className="mr-1">📍</span>
                      <span className="line-clamp-1">{branch.address}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Users size={14} />
                      Nhân viên
                    </span>
                    <span className="font-semibold text-slate-800">
                      {branch.totalStaff}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Car size={14} />
                      Lịch hẹn hôm nay
                    </span>
                    <span className="font-semibold text-slate-800">
                      {branch.todayBookings}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Doanh thu (tháng)</span>
                      <span className="font-bold text-rose-600">
                        {formatCurrency(branch.revenue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <a
          href="/admin/managers"
          className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-100 p-3 group-hover:bg-purple-200 transition">
              <UserCog size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Quản lý Manager</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Tạo và phân công Manager cho các chi nhánh
              </p>
            </div>
          </div>
        </a>

        <a
          href="/admin/staff"
          className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-emerald-100 p-3 group-hover:bg-emerald-200 transition">
              <Users size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Quản lý Staff</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Tạo và phân công Staff theo chi nhánh
              </p>
            </div>
          </div>
        </a>

        <a
          href="/admin/branches"
          className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-100 p-3 group-hover:bg-blue-200 transition">
              <Building2 size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Dữ liệu Chi nhánh</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Xem chi tiết toàn bộ dữ liệu {stats.totalBranches} chi nhánh
              </p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
};

export default AdminDashboard;