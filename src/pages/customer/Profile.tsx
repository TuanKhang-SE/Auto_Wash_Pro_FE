import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import axiosClient from "../../api/axiosClient";
import avatarImg from "../../assets/avatar.png";

function Profile() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [vehicles, setVehicles] = useState<any[]>([]);

  const [totalVisits, setTotalVisits] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const res = await axiosClient.get("/api/customers/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = res.data.data;

        setFullName(data.Users.FullName);
        setEmail(data.Users.Email);
        setPhone(data.Users.Phone || "Chưa cập nhật");

        setVehicles(data.Vehicles || []);

        setTotalVisits(data.TotalVisits || 0);
        setTotalSpent(data.TotalSpent || 0);
      } catch (error: any) {
        console.log(error.response?.data || error);

        setMessage(
          error.response?.data?.message || "Không thể tải thông tin cá nhân"
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [navigate]);

  function formatMoney(value: number) {
    return value.toLocaleString("vi-VN") + "đ";
  }

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-gray-100 px-6 py-10">
          <div className="mx-auto max-w-6xl">
            <p className="text-slate-600">Đang tải thông tin cá nhân...</p>
          </div>
        </main>
      </>
    );
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
            <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {message}
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded-2xl bg-white p-6 shadow">
              <div className="flex flex-col items-center text-center">
                <img
                  src={avatarImg}
                  alt="Avatar"
                  className="h-28 w-28 rounded-full object-cover ring-4 ring-sky-100"
                />

                <h2 className="mt-4 text-2xl font-bold text-slate-800">
                  {fullName || "Người dùng"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {email || "Chưa có email"}
                </p>

                <span className="mt-4 rounded-full bg-sky-100 px-4 py-1 text-sm font-medium text-sky-700">
                  Khách hàng
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
                    {fullName || "Chưa cập nhật"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {email || "Chưa cập nhật"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-sm text-slate-500">Số điện thoại</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {phone || "Chưa cập nhật"}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-sm text-slate-500">Vai trò</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    Customer
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-6 text-xl font-bold text-slate-800">
              Thống kê khách hàng
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-sky-50 p-5">
                <p className="text-sm text-slate-500">Tổng lượt sử dụng</p>
                <p className="mt-2 text-3xl font-bold text-sky-700">
                  {totalVisits}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-5">
                <p className="text-sm text-slate-500">Tổng chi tiêu</p>
                <p className="mt-2 text-3xl font-bold text-green-700">
                  {formatMoney(totalSpent)}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl bg-white p-6 shadow">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Xe của tôi</h2>

              <Link
                to="/register-car"
                className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700"
              >
                Đăng ký xe mới
              </Link>
            </div>

            {vehicles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                <p className="text-slate-500">
                  Chưa có dữ liệu xe. Bạn có thể đăng ký xe mới để sử dụng dịch
                  vụ.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.VehicleID}
                    className="rounded-xl border border-gray-100 p-4 shadow-sm"
                  >
                    <p className="text-lg font-bold text-slate-800">
                      {vehicle.LicensePlate}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      Loại xe:{" "}
                      <span className="font-medium text-slate-700">
                        {vehicle.VehicleType || "Chưa cập nhật"}
                      </span>
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Hãng xe:{" "}
                      <span className="font-medium text-slate-700">
                        {vehicle.Brand || "Chưa cập nhật"}
                      </span>
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Model:{" "}
                      <span className="font-medium text-slate-700">
                        {vehicle.Model || "Chưa cập nhật"}
                      </span>
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Màu xe:{" "}
                      <span className="font-medium text-slate-700">
                        {vehicle.Color || "Chưa cập nhật"}
                      </span>
                    </p>

                    <span className="mt-4 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      {vehicle.Status || "Active"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

export default Profile;