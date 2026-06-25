import { useState, useEffect } from "react";
import {
  Bike,
  Clock3,
  CircleCheckBig,
  ClipboardList,
  Car,
  RefreshCw,
} from "lucide-react";
import StatCard from "../../components/staff/StatCard";
import axiosClient from "../../api/axiosClient";

interface VehicleQueueItem {
  VehicleID: number;
  LicensePlate: string;
  VehicleType: string | null;
  Brand: string | null;
  Model: string | null;
  Color: string | null;
  Status: string;
  CheckInAt: string | null;
  serviceName: string;
  staffName: string;
}

const StaffDashboard = () => {
  const [stats, setStats] = useState({
    waiting: 0,
    washing: 0,
    completed: 0,
    total: 0,
  });
  const [vehicles, setVehicles] = useState<VehicleQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [staffName, setStaffName] = useState<string>("");

  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) return JSON.parse(userStr);
    } catch {}
    return null;
  };

  useEffect(() => {
    const user = getUserFromStorage();
    setStaffName(user?.fullName || user?.email || "Nhân viên");
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [vehiclesRes] = await Promise.allSettled([
        axiosClient.get("/api/vehicles", { headers }), // GET /api/vehicles
      ]);

      if (vehiclesRes.status === "fulfilled" && vehiclesRes.value.data?.success) {
        const allVehicles = vehiclesRes.value.data.data || [];

        const waiting = allVehicles.filter(
          (v: VehicleQueueItem) =>
            v.Status === "Active" && !v.CheckInAt
        ).length;
        const washing = allVehicles.filter(
          (v: VehicleQueueItem) =>
            v.Status === "Active" && v.CheckInAt
        ).length;

        setVehicles(allVehicles);
        setStats((prev) => ({
          ...prev,
          waiting,
          washing,
          total: allVehicles.length,
        }));
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (vehicle: VehicleQueueItem) => {
    if (vehicle.CheckInAt) {
      return (
        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
          Đang rửa
        </span>
      );
    }
    return (
      <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700">
        Chờ xử lý
      </span>
    );
  };

  const getCheckInTime = (vehicle: VehicleQueueItem) => {
    if (!vehicle.CheckInAt) return "--:--";
    const date = new Date(vehicle.CheckInAt);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-xl shadow-blue-500/20">
        <h2 className="text-2xl font-bold">
          Chào buổi làm việc, {staffName}!
        </h2>
        <p className="mt-1 text-blue-100">
          Đây là tổng quan xe đang xử lý tại chi nhánh của bạn.
        </p>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Xe chờ xử lý"
          value={stats.waiting}
          icon={<Clock3 className="text-yellow-500" />}
        />

        <StatCard
          title="Xe đang rửa"
          value={stats.washing}
          icon={<Bike className="text-blue-500" />}
        />

        <StatCard
          title="Hoàn thành hôm nay"
          value={stats.completed}
          icon={<CircleCheckBig className="text-green-500" />}
        />

        <StatCard
          title="Tổng xe hôm nay"
          value={stats.total}
          icon={<ClipboardList className="text-purple-500" />}
        />
      </div>

      {/* Vehicle Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Xe đang xử lý
          </h2>
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            Chưa có xe nào trong hàng đợi
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left text-sm text-slate-500">
                  <th className="py-3 pr-4">Biển số</th>
                  <th className="px-4">Loại xe</th>
                  <th className="px-4">Dịch vụ</th>
                  <th className="px-4">Nhân viên</th>
                  <th className="px-4">Check In</th>
                  <th className="px-4">Trạng thái</th>
                </tr>
              </thead>

              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.VehicleID} className="border-b hover:bg-slate-50 transition">
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Car size={16} className="text-slate-400" />
                        <span className="font-mono font-medium">
                          {vehicle.LicensePlate}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 text-sm text-slate-600">
                      {[vehicle.Brand, vehicle.Model, vehicle.Color]
                        .filter(Boolean)
                        .join(" · ") || vehicle.VehicleType || "—"}
                    </td>
                    <td className="px-4 text-sm text-slate-600">
                      {vehicle.serviceName || "—"}
                    </td>
                    <td className="px-4 text-sm text-slate-600">
                      {vehicle.staffName || "—"}
                    </td>
                    <td className="px-4 text-sm text-slate-500">
                      {getCheckInTime(vehicle)}
                    </td>
                    <td className="px-4">
                      {getStatusBadge(vehicle)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
