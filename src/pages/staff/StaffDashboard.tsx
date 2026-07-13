import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  ClipboardList,
  UserCheck,
  ArrowRight,
  Star,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

function getUserFromStorage() {
  try {
    const userStr = localStorage.getItem("user");

    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (error) {
    console.log(error);
  }

  return null;
}

const StaffDashboard = () => {
  const user = getUserFromStorage();

  const staffName =
    user?.fullName || user?.FullName || user?.email || "Nhân viên";
  const branchId = Number(user?.branchId || user?.BranchID || 0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    async function loadReviewSummary() {
      if (!branchId) return;
      try {
        const response = await axiosClient.get(`/api/reviews/branch/${branchId}`);
        setAverageRating(Number(response.data?.data?.averageRating || 0));
        setTotalReviews(Number(response.data?.data?.totalReviews || 0));
      } catch {
        setAverageRating(0);
        setTotalReviews(0);
      }
    }

    loadReviewSummary();
  }, [branchId]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-xl shadow-blue-500/20">
        <h2 className="text-2xl font-bold">Chào buổi làm việc, {staffName}!</h2>

        <p className="mt-1 text-blue-100">
          Đây là trang tổng quan dành cho nhân viên Auto Wash Pro.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3">
              <ClipboardList className="text-blue-600" />
            </div>

            <div>
              <p className="text-sm text-slate-500">Công việc chính</p>
              <p className="text-lg font-bold text-slate-800">
                Xử lý booking
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Xem lịch đặt hôm nay, check-in xe, bắt đầu rửa và hoàn thành dịch vụ.
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3">
              <Star className="fill-amber-400 text-amber-500" />
            </div>

            <div>
              <p className="text-sm text-slate-500">Đánh giá trung bình</p>
              <p className="text-lg font-bold text-slate-800">
                {averageRating.toFixed(1)}/5 sao
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Tổng hợp từ {totalReviews.toLocaleString("vi-VN")} lượt đánh giá tại chi nhánh.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3">
              <UserCheck className="text-green-600" />
            </div>

            <div>
              <p className="text-sm text-slate-500">Vai trò</p>
              <p className="text-lg font-bold text-slate-800">Staff</p>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Staff chỉ quản lý booking thuộc chi nhánh của mình.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-50 p-3">
              <CalendarCheck className="text-purple-600" />
            </div>

            <div>
              <p className="text-sm text-slate-500">Trang cần dùng</p>
              <p className="text-lg font-bold text-slate-800">
                Quản lý đặt lịch
              </p>
            </div>
          </div>

          <Link
            to="/staff/bookings"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Đi tới quản lý đặt lịch
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-700">
        Gợi ý: Vào mục <span className="font-semibold">Quản lý đặt lịch</span>{" "}
        để xem danh sách booking hôm nay và cập nhật trạng thái từng xe.
      </div>
    </div>
  );
};

export default StaffDashboard;
