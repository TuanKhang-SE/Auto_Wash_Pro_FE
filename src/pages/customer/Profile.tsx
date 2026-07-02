import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import axiosClient from "../../api/axiosClient";
import avatarImg from "../../assets/avatar.png";

type Vehicle = {
  VehicleID: number;
  LicensePlate: string;
  VehicleType?: string | null;
  Brand?: string | null;
  Model?: string | null;
  Color?: string | null;
  Status?: string | null;
};

function Profile() {
  const navigate = useNavigate();

  // Thông tin đang hiển thị trên màn hình
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Thông tin trong form chỉnh sửa
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // false = đang xem, true = đang chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);

  // false = chưa lưu, true = đang gọi API lưu
  const [saving, setSaving] = useState(false);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [totalVisits, setTotalVisits] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
        const user = data.Users || {};

        setFullName(user.FullName || "");
        setEmail(user.Email || "");
        setPhone(user.Phone || "");

        setEditFullName(user.FullName || "");
        setEditPhone(user.Phone || "");

        setVehicles(data.Vehicles || []);

        setTotalVisits(data.TotalVisits || 0);
        setTotalSpent(Number(data.TotalSpent || 0));
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

  function handleStartEdit() {
    setMessage("");
    setSuccessMessage("");

    setEditFullName(fullName);
    setEditPhone(phone);

    setIsEditing(true);
  }

  function handleCancelEdit() {
    setMessage("");
    setSuccessMessage("");

    setEditFullName(fullName);
    setEditPhone(phone);

    setIsEditing(false);
  }

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();

    setMessage("");
    setSuccessMessage("");

    const trimmedName = editFullName.trim();
    const trimmedPhone = editPhone.trim();

    if (!trimmedName) {
      setMessage("Họ và tên không được để trống");
      return;
    }

    if (!trimmedPhone) {
      setMessage("Số điện thoại không được để trống");
      return;
    }

    if (trimmedPhone.length < 10) {
      setMessage("Số điện thoại phải có ít nhất 10 số");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      setSaving(true);

      const res = await axiosClient.put(
        "/api/customers/profile",
        {
          FullName: trimmedName,
          Phone: trimmedPhone,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedUser = res.data.data;

      setFullName(updatedUser.FullName || trimmedName);
      setPhone(updatedUser.Phone || trimmedPhone);

      setEditFullName(updatedUser.FullName || trimmedName);
      setEditPhone(updatedUser.Phone || trimmedPhone);

      const oldUserString = localStorage.getItem("user");

      if (oldUserString) {
        const oldUser = JSON.parse(oldUserString);

        localStorage.setItem(
          "user",
          JSON.stringify({
            ...oldUser,
            fullName: updatedUser.FullName || trimmedName,
            phone: updatedUser.Phone || trimmedPhone,
            FullName: updatedUser.FullName || trimmedName,
            Phone: updatedUser.Phone || trimmedPhone,
          })
        );
      }

      setSuccessMessage("Cập nhật thông tin tài khoản thành công");
      setIsEditing(false);
    } catch (error: any) {
      console.log(error.response?.data || error);

      setMessage(
        error.response?.data?.message || "Cập nhật thông tin tài khoản thất bại"
      );
    } finally {
      setSaving(false);
    }
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

          {successMessage && (
            <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMessage}
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
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-800">
                  Thông tin tài khoản
                </h2>

                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700"
                  >
                    Chỉnh sửa
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      Họ và tên
                    </label>

                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      placeholder="Nhập họ và tên"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      Email
                    </label>

                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-slate-500"
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      Email đang để chỉ xem vì BE hiện chưa có API đổi email.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      Số điện thoại
                    </label>

                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-slate-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Hủy
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
                    >
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>
              ) : (
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
              )}
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