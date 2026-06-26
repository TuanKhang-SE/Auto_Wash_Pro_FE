import { useState, useEffect } from "react";
import {
  Users,
  CalendarCheck,
  Car,
  TrendingUp,
  Clock,
  CircleCheckBig,
  AlertCircle,
} from "lucide-react";
import StatCard from "../../components/staff/StatCard";
import axiosClient from "../../api/axiosClient";
import userService from "../../services/userService";

interface Stats {
  totalStaff: number;
  todayBookings: number;
  completedToday: number;
  pendingBookings: number;
}

interface RecentBooking {
  id: number;
  customerName: string;
  licensePlate: string;
  service: string;
  time: string;
  status: "pending" | "in_progress" | "completed";
}

const ManagerDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalStaff: 0,
    todayBookings: 0,
    completedToday: 0,
    pendingBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  void setRecentBookings;
  const [branchName, setBranchName] = useState<string>("");

  useEffect(() => {
    const fetchBranchName = async () => {
      const user = getUserFromStorage();
      if (user?.branchId) {
        try {
          const token = localStorage.getItem("token");
          const res = await axiosClient.get(`/api/branches/${user.branchId}`, { // GET /api/branches/:id
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

  useEffect(() => {
    const fetchTotalStaff = async () => {
      const user = getUserFromStorage();
      if (!user?.branchId) return;
      try {
        // GET /api/users?Role=Staff&BranchID=<branchId> → chỉ Manager
        // mới gọi được với filter BranchID (đã được roleMiddleware bảo vệ),
        // trả về danh sách Staff thuộc đúng chi nhánh của Manager đang đăng nhập.
        const staff = await userService.getAllUsers({
          Role: "Staff",
          BranchID: user.branchId,
        });
        setStats((prev) => ({ ...prev, totalStaff: staff.length }));
      } catch (err) {
        console.error("Lỗi tải danh sách nhân viên:", err);
        // Không setState khi lỗi — giữ giá trị mặc định 0
      }
    };
    fetchTotalStaff();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            Hoàn thành
          </span>
        );
      case "in_progress":
        return (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            Đang rửa
          </span>
        );
      case "pending":
        return (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Chờ xử lý
          </span>
        );
      default:
        return null;
    }
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
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-xl shadow-blue-500/20">
        <h2 className="text-2xl font-bold">
          Chào mừng, {user?.fullName || user?.email || "Quản lý"}!
        </h2>
        <p className="mt-1 text-blue-100">
          Đây là tổng quan về hoạt động của chi nhánh{" "}
          <span className="font-semibold">{branchName || "Chi nhánh"}</span> hôm nay.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng nhân viên"
          value={stats.totalStaff}
          icon={<Users className="text-blue-600" size={28} />}
        />

        <StatCard
          title="Lịch hẹn hôm nay"
          value={stats.todayBookings}
          icon={<CalendarCheck className="text-purple-600" size={28} />}
        />

        <StatCard
          title="Đã hoàn thành"
          value={stats.completedToday}
          icon={<CircleCheckBig className="text-emerald-600" size={28} />}
        />

        <StatCard
          title="Đang chờ xử lý"
          value={stats.pendingBookings}
          icon={<Clock className="text-amber-600" size={28} />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Bookings */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">
              Lịch hẹn gần đây
            </h3>
            <a
              href="/manager/bookings"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Xem tất cả
            </a>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Biển số</th>
                  <th className="px-4 py-3">Dịch vụ</th>
                  <th className="px-4 py-3">Giờ</th>
                  <th className="px-4 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Car size={16} className="text-slate-400" />
                        <span className="font-mono font-medium">
                          {booking.licensePlate}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {booking.service}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {booking.time}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(booking.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Branch Info Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            Thông tin Chi nhánh
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Nhân viên</p>
                  <p className="font-semibold">{stats.totalStaff} người</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2">
                  <TrendingUp size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Tỷ lệ hoàn thành</p>
                  <p className="font-semibold">
                    {stats.todayBookings > 0
                      ? Math.round((stats.completedToday / stats.todayBookings) * 100)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-2">
                  <AlertCircle size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Cảnh báo</p>
                  <p className="font-semibold text-amber-600">
                    {stats.pendingBookings} lịch hẹn chờ
                  </p>
                </div>
              </div>
            </div>
          </div>

          <a
            href="/manager/branch"
            className="mt-4 block w-full rounded-lg bg-blue-600 py-2.5 text-center text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Xem chi tiết chi nhánh
          </a>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
