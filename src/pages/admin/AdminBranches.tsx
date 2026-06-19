import { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  Users,
  UserCog,
  CalendarCheck,
  TrendingUp,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import { BRANCHES } from "../../constants/branches";

interface BranchDetail {
  branchID: number;
  branchName: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  status: "Active" | "Inactive";
  manager: { fullName: string; email: string; phone: string } | null;
  totalStaff: number;
  todayBookings: number;
  monthBookings: number;
  revenue: number;
  occupancy: number;
  rating: number;
}

const AdminBranches = () => {
  const [branches, setBranches] = useState<BranchDetail[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<BranchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      const mock: BranchDetail[] = BRANCHES.map((b) => ({
        ...b,
        openTime: "07:00",
        closeTime: "20:00",
        manager:
          b.branchID === 1
            ? { fullName: "Nguyễn Văn An", email: "manager01@autowash.com", phone: "0901111111" }
            : b.branchID === 2
            ? { fullName: "Trần Thị Bình", email: "manager02@autowash.com", phone: "0902222222" }
            : { fullName: "Lê Văn Cường", email: "manager03@autowash.com", phone: "0903333333" },
        totalStaff: b.branchID === 1 ? 9 : b.branchID === 2 ? 8 : 7,
        todayBookings: b.branchID === 1 ? 32 : b.branchID === 2 ? 27 : 22,
        monthBookings: b.branchID === 1 ? 487 : b.branchID === 2 ? 412 : 388,
        revenue: b.branchID === 1 ? 58400000 : b.branchID === 2 ? 49600000 : 48800000,
        occupancy: b.branchID === 1 ? 85 : b.branchID === 2 ? 72 : 68,
        rating: b.branchID === 1 ? 4.8 : b.branchID === 2 ? 4.6 : 4.5,
      }));
      setBranches(mock);
      setSelectedBranch(mock[0]);
      setIsLoading(false);
    }, 500);
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Dữ liệu các Chi nhánh
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Xem và so sánh dữ liệu hoạt động của toàn bộ {branches.length} chi nhánh
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Branch Cards */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {branches.map((b) => (
              <button
                key={b.branchID}
                onClick={() => setSelectedBranch(b)}
                className={`text-left rounded-xl border-2 p-5 transition shadow-sm ${
                  selectedBranch?.branchID === b.branchID
                    ? "border-rose-500 bg-rose-50/50 shadow-lg"
                    : "border-slate-200 bg-white hover:border-rose-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg p-2 ${
                        selectedBranch?.branchID === b.branchID
                          ? "bg-rose-500 text-white"
                          : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      <Building2 size={22} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {b.branchName}
                      </p>
                      <p className="text-xs text-slate-500">Mã CN: #{b.branchID}</p>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className={
                      selectedBranch?.branchID === b.branchID
                        ? "text-rose-600"
                        : "text-slate-400"
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white border border-slate-100 p-3">
                    <p className="text-xs text-slate-500">Nhân viên</p>
                    <p className="text-xl font-bold text-slate-800">
                      {b.totalStaff}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-100 p-3">
                    <p className="text-xs text-slate-500">Hôm nay</p>
                    <p className="text-xl font-bold text-slate-800">
                      {b.todayBookings}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Doanh thu tháng</span>
                    <span className="font-bold text-rose-600">
                      {formatCurrency(b.revenue)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Selected Branch Detail */}
          {selectedBranch && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 p-3 text-white shadow-lg">
                    <Building2 size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {selectedBranch.branchName}
                    </h2>
                    <p className="text-sm text-slate-500">
                      Chi tiết dữ liệu chi nhánh
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    selectedBranch.status === "Active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      selectedBranch.status === "Active"
                        ? "bg-emerald-500"
                        : "bg-red-500"
                    }`}
                  ></span>
                  {selectedBranch.status === "Active" ? "Hoạt động" : "Ngừng"}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Branch Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Building2 size={18} className="text-rose-600" />
                    Thông tin chi nhánh
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                      <MapPin size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Địa chỉ</p>
                        <p className="text-sm font-medium text-slate-800">
                          {selectedBranch.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                      <Phone size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Số điện thoại</p>
                        <p className="text-sm font-medium text-slate-800">
                          {selectedBranch.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                      <Clock size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500">Giờ hoạt động</p>
                        <p className="text-sm font-medium text-slate-800">
                          {selectedBranch.openTime} - {selectedBranch.closeTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manager Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <UserCog size={18} className="text-purple-600" />
                    Manager phụ trách
                  </h3>

                  {selectedBranch.manager ? (
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-white font-bold">
                          {selectedBranch.manager.fullName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">
                            {selectedBranch.manager.fullName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {selectedBranch.manager.email}
                          </p>
                          <p className="text-xs text-slate-500">
                            {selectedBranch.manager.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-center">
                      <p className="text-sm font-medium text-amber-700">
                        Chi nhánh chưa có Manager
                      </p>
                      <a
                        href="/admin/managers"
                        className="mt-2 inline-block text-xs font-medium text-amber-700 underline"
                      >
                        Tạo Manager →
                      </a>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users size={14} className="text-slate-400" />
                        <p className="text-xs text-slate-500">Staff</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-800">
                        {selectedBranch.totalStaff}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-amber-500 text-sm">⭐</span>
                        <p className="text-xs text-slate-500">Đánh giá</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-800">
                        {selectedBranch.rating}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                  <TrendingUp size={18} className="text-emerald-600" />
                  Hiệu suất hoạt động
                </h3>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarCheck size={16} className="text-blue-600" />
                      <p className="text-xs text-slate-600">Lịch hẹn hôm nay</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedBranch.todayBookings}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-purple-50 to-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarCheck size={16} className="text-purple-600" />
                      <p className="text-xs text-slate-600">Lịch hẹn tháng</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {selectedBranch.monthBookings}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign size={16} className="text-emerald-600" />
                      <p className="text-xs text-slate-600">Doanh thu tháng</p>
                    </div>
                    <p className="text-lg font-bold text-emerald-600">
                      {formatCurrency(selectedBranch.revenue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminBranches;
