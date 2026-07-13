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

/*
 * Chỉ chấp nhận:
 * - Chữ cái tiếng Việt
 * - Chữ cái tiếng Anh
 * - Một khoảng trắng giữa các từ
 *
 * Không chấp nhận:
 * - Số
 * - Ký tự đặc biệt
 * - Nhiều khoảng trắng liên tiếp
 */
const FULL_NAME_REGEX = /^[\p{L}]+(?: [\p{L}]+)*$/u;

/*
 * Xóa khoảng trắng đầu, cuối.
 * Gộp nhiều khoảng trắng thành một khoảng trắng.
 */
function normalizeFullName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

/*
 * Loại bỏ số và ký tự đặc biệt ngay khi nhập.
 */
function filterFullNameInput(value: string) {
  return value
    .replace(/[^\p{L} ]/gu, "")
    .replace(/ {2,}/g, " ");
}

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
          error.response?.data?.message ||
            "Không thể tải thông tin cá nhân"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [navigate]);

  function formatMoney(value: number) {
    return value.toLocaleString("vi-VN") + "đ";
  }

  function handleStartEdit() {
    setMessage("");
    setSuccessMessage("");

    /*
     * Loại bỏ số và ký tự đặc biệt từ tên cũ khi mở form.
     * Ví dụ tên cũ Hieu1 sẽ được đưa vào form thành Hieu.
     */
    setEditFullName(filterFullNameInput(fullName));
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

  async function handleUpdateProfile(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setMessage("");
    setSuccessMessage("");

    const normalizedName = normalizeFullName(editFullName);
    const normalizedPhone = editPhone.trim();

    /*
     * Validate họ và tên ở Frontend.
     */
    if (!normalizedName) {
      setMessage("Họ và tên không được để trống");
      return;
    }

    if (normalizedName.length < 2) {
      setMessage("Họ và tên phải có ít nhất 2 ký tự");
      return;
    }

    if (normalizedName.length > 100) {
      setMessage("Họ và tên không được vượt quá 100 ký tự");
      return;
    }

    if (!FULL_NAME_REGEX.test(normalizedName)) {
      setMessage(
        "Họ và tên chỉ được chứa chữ cái và khoảng trắng, không được chứa số hoặc ký tự đặc biệt"
      );
      return;
    }

    /*
     * Validate số điện thoại ở Frontend.
     */
    if (!normalizedPhone) {
      setMessage("Số điện thoại không được để trống");
      return;
    }

    if (!/^0\d{9}$/.test(normalizedPhone)) {
      setMessage(
        "Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số"
      );
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
          FullName: normalizedName,
          Phone: normalizedPhone,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedUser = res.data.data;

      const newFullName =
        updatedUser?.FullName || normalizedName;

      const newPhone =
        updatedUser?.Phone || normalizedPhone;

      setFullName(newFullName);
      setPhone(newPhone);

      setEditFullName(newFullName);
      setEditPhone(newPhone);

      /*
       * Cập nhật lại thông tin trong localStorage
       * để Navbar và các trang khác hiển thị tên mới.
       */
      const oldUserString = localStorage.getItem("user");

      if (oldUserString) {
        try {
          const oldUser = JSON.parse(oldUserString);

          localStorage.setItem(
            "user",
            JSON.stringify({
              ...oldUser,
              fullName: newFullName,
              phone: newPhone,
              FullName: newFullName,
              Phone: newPhone,
            })
          );
        } catch (parseError) {
          console.log(
            "Không thể đọc thông tin user trong localStorage:",
            parseError
          );
        }
      }

      setSuccessMessage(
        "Cập nhật thông tin tài khoản thành công"
      );

      setIsEditing(false);
    } catch (error: any) {
      console.log(error.response?.data || error);

      setMessage(
        error.response?.data?.message ||
          "Cập nhật thông tin tài khoản thất bại"
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
            <p className="text-slate-600">
              Đang tải thông tin cá nhân...
            </p>
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
                <form
                  onSubmit={handleUpdateProfile}
                  className="space-y-4"
                >
                  {/* Họ và tên */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-1 block text-sm font-medium text-slate-600"
                    >
                      Họ và tên
                    </label>

                    <input
                      id="fullName"
                      type="text"
                      value={editFullName}
                      maxLength={100}
                      autoComplete="name"
                      onChange={(e) => {
                        /*
                         * Xóa số và ký tự đặc biệt
                         * ngay khi người dùng nhập hoặc dán.
                         */
                        const validName =
                          filterFullNameInput(e.target.value);

                        setEditFullName(validName);
                        setMessage("");
                      }}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      placeholder="Ví dụ: Nguyễn Văn Hiếu"
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      Họ tên chỉ được chứa chữ cái và khoảng
                      trắng, không được chứa số hoặc ký tự đặc
                      biệt.
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1 block text-sm font-medium text-slate-600"
                    >
                      Email
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-slate-500"
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      Liên hệ quản trị viên để đổi email.
                    </p>
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1 block text-sm font-medium text-slate-600"
                    >
                      Số điện thoại
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={editPhone}
                      autoComplete="tel"
                      onChange={(e) => {
                        /*
                         * Chỉ cho phép nhập chữ số.
                         */
                        const onlyNumbers =
                          e.target.value.replace(/\D/g, "");

                        setEditPhone(onlyNumbers);
                        setMessage("");
                      }}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      placeholder="Ví dụ: 0938983427"
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      Số điện thoại phải bắt đầu bằng 0 và có đúng
                      10 chữ số.
                    </p>
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
                      {saving
                        ? "Đang lưu..."
                        : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-sm text-slate-500">
                      Họ và tên
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {fullName || "Chưa cập nhật"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-sm text-slate-500">
                      Email
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {email || "Chưa cập nhật"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-sm text-slate-500">
                      Số điện thoại
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {phone || "Chưa cập nhật"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-sm text-slate-500">
                      Vai trò
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      Customer
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Thống kê */}
          <section className="mt-6 rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-6 text-xl font-bold text-slate-800">
              Thống kê khách hàng
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-sky-50 p-5">
                <p className="text-sm text-slate-500">
                  Tổng lượt sử dụng
                </p>

                <p className="mt-2 text-3xl font-bold text-sky-700">
                  {totalVisits}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-5">
                <p className="text-sm text-slate-500">
                  Tổng chi tiêu
                </p>

                <p className="mt-2 text-3xl font-bold text-green-700">
                  {formatMoney(totalSpent)}
                </p>
              </div>
            </div>
          </section>

          {/* Danh sách xe */}
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

            {vehicles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                <p className="text-slate-500">
                  Chưa có dữ liệu xe. Bạn có thể đăng ký xe mới
                  để sử dụng dịch vụ.
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
                        {vehicle.VehicleType ||
                          "Chưa cập nhật"}
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