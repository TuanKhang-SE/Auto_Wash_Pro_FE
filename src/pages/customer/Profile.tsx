import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import axiosClient from "../../api/axiosClient";
import avatarImg from "../../assets/avatar.png";

type ProfileUser = {
  UserID?: number;
  FullName?: string;
  Phone?: string;
  Email?: string;
  Role?: string;
  Status?: string;
  CreatedAt?: string;
  UpdatedAt?: string;

  userId?: number;
  fullName?: string;
  phone?: string;
  email?: string;
  role?: string;
  status?: string;
};

const Profile = () => {
  const userString = localStorage.getItem("user");

  const localUser: ProfileUser | null = userString
    ? JSON.parse(userString)
    : null;

  const [user, setUser] = useState<ProfileUser | null>(localUser);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const userId = localUser?.userId || localUser?.UserID;

  const fullName = user?.fullName || user?.FullName || "Người dùng";
  const email = user?.email || user?.Email || "Chưa có email";
  const phone = user?.phone || user?.Phone || "Chưa cập nhật";
  const role = user?.role || user?.Role || "Customer";
  const status = user?.status || user?.Status || "Active";

  useEffect(() => {
    async function fetchProfile() {
      try {
        if (!userId) {
          setErrorMessage("Không tìm thấy ID người dùng");
          return;
        }

        const token = localStorage.getItem("token");

        const res = await axiosClient.get(`/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const apiUser = res.data?.data || res.data;

        setUser(apiUser);
      } catch (error: any) {
        console.log(error.response?.data || error);

        setErrorMessage(
          error.response?.data?.message || "Không thể tải thông tin cá nhân"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId]);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-8 text-3xl font-bold text-slate-800">
            Trang cá nhân
          </h1>

          {loading && (
            <p className="mb-4 text-sm text-slate-500">
              Đang tải thông tin cá nhân...
            </p>
          )}

          {errorMessage && (
            <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
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
                  {fullName}
                </h2>

                <p className="mt-1 text-sm text-slate-500">{email}</p>

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
                    {fullName}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {email}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-sm text-slate-500">Số điện thoại</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {phone}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-sm text-slate-500">Vai trò</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {role}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-sm text-slate-500">Trạng thái</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {status}
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
                <p className="mt-2 text-3xl font-bold text-sky-700">0</p>
              </div>

              <div className="rounded-xl bg-green-50 p-5">
                <p className="text-sm text-slate-500">Tổng chi tiêu</p>
                <p className="mt-2 text-3xl font-bold text-green-700">0đ</p>
              </div>

              <div className="rounded-xl bg-amber-50 p-5">
                <p className="text-sm text-slate-500">Điểm thành viên</p>
                <p className="mt-2 text-3xl font-bold text-amber-700">0</p>
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

            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <p className="text-slate-500">
                Chưa có dữ liệu xe. Bạn có thể đăng ký xe mới để sử dụng dịch vụ.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default Profile;