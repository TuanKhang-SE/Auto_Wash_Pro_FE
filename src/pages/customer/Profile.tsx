import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import avatarImg from "../../assets/avatar.png";
import axiosClient from "../../api/axiosClient";

type Vehicle = {
  VehicleID: number;
  LicensePlate: string;
  VehicleType?: string | null;
  Brand?: string | null;
  Model?: string | null;
  Color?: string | null;
  Status?: string | null;
  CreatedAt?: string | null;
};

type ProfileData = {
  user: {
    userId: number;
    fullName: string;
    phone?: string | null;
    email?: string | null;
    role?: string | null;
    status?: string | null;
    createdAt?: string | null;
  };
  customer: {
    customerId: number;
    totalVisits: number;
    totalSpent: number;
  } | null;
  loyalty: {
    accountId: number;
    currentPoints: number;
    lifetimePoints: number;
  } | null;
  vehicles: Vehicle[];
};

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const res = await axiosClient.get("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProfile(res.data.data);
    } catch (error) {
      console.log(error);
      setMessage("Không thể tải thông tin cá nhân");
    } finally {
      setLoading(false);
    }
  }

  function formatMoney(value?: number) {
    if (!value) {
      return "0đ";
    }

    return Number(value).toLocaleString("vi-VN") + "đ";
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-8 text-3xl font-bold text-slate-800">
            Trang cá nhân
          </h1>

          {message && (
            <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-red-600">
              {message}
            </div>
          )}

          {loading && (
            <div className="rounded-2xl bg-white p-8 text-center shadow">
              <p className="text-slate-500">Đang tải thông tin cá nhân...</p>
            </div>
          )}

          {!loading && profile && (
            <>
              <div className="grid gap-6 lg:grid-cols-3">
                <section className="rounded-2xl bg-white p-6 shadow">
                  <div className="flex flex-col items-center text-center">
                    <img
                      src={avatarImg}
                      alt="Avatar"
                      className="h-28 w-28 rounded-full object-cover ring-4 ring-sky-100"
                    />

                    <h2 className="mt-4 text-2xl font-bold text-slate-800">
                      {profile.user.fullName || "Người dùng"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {profile.user.email || "Chưa có email"}
                    </p>

                    <span className="mt-4 rounded-full bg-sky-100 px-4 py-1 text-sm font-medium text-sky-700">
                      Hạng: Thành viên
                    </span>
                  </div>
                </section>

                <section className="rounded-2xl bg-white p-6 shadow lg:col-span-2">
                  <h2 className="mb-6 text-xl font-bold text-slate-800">
                    Thông tin tài khoản
                  </h2>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-gray-100 p-4">
                      <p className="text-sm text-slate-500">Họ và tên</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {profile.user.fullName || "Chưa cập nhật"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 p-4">
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {profile.user.email || "Chưa cập nhật"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 p-4">
                      <p className="text-sm text-slate-500">Số điện thoại</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {profile.user.phone || "Chưa cập nhật"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 p-4">
                      <p className="text-sm text-slate-500">Vai trò</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {profile.user.role || "Customer"}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <section className="mt-6 rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-6 text-xl font-bold text-slate-800">
                  Thống kê khách hàng
                </h2>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-sky-50 p-5">
                    <p className="text-sm text-slate-500">Tổng lượt sử dụng</p>
                    <p className="mt-2 text-3xl font-bold text-sky-700">
                      {profile.customer?.totalVisits || 0}
                    </p>
                  </div>

                  <div className="rounded-xl bg-green-50 p-5">
                    <p className="text-sm text-slate-500">Tổng chi tiêu</p>
                    <p className="mt-2 text-3xl font-bold text-green-700">
                      {formatMoney(profile.customer?.totalSpent)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50 p-5">
                    <p className="text-sm text-slate-500">Điểm thành viên</p>
                    <p className="mt-2 text-3xl font-bold text-amber-700">
                      {profile.loyalty?.currentPoints || 0}
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-6 rounded-2xl bg-white p-6 shadow">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800">
                    Xe của tôi
                  </h2>

                  <Link
                    to="/register-car"
                    className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700"
                  >
                    Đăng ký xe mới
                  </Link>
                </div>

                {profile.vehicles.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                    <p className="text-slate-500">
                      Chưa có dữ liệu xe. Bạn có thể đăng ký xe mới để sử dụng
                      dịch vụ.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {profile.vehicles.map((vehicle) => (
                      <div
                        key={vehicle.VehicleID}
                        className="rounded-xl border border-gray-100 p-4"
                      >
                        <p className="text-sm text-slate-500">Biển số xe</p>
                        <h3 className="mt-1 text-xl font-bold text-sky-700">
                          {vehicle.LicensePlate}
                        </h3>

                        <div className="mt-3 space-y-1 text-sm text-slate-600">
                          <p>Loại xe: {vehicle.VehicleType || "Chưa cập nhật"}</p>
                          <p>Hãng xe: {vehicle.Brand || "Chưa cập nhật"}</p>
                          <p>Model: {vehicle.Model || "Chưa cập nhật"}</p>
                          <p>Màu xe: {vehicle.Color || "Chưa cập nhật"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default Profile;