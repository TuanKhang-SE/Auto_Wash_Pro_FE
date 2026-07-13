import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Quản lý trạng thái hiện hoặc ẩn mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function getRedirectPath(role: string) {
    switch (role) {
      case "Admin":
        return "/admin";

      case "Manager":
        return "/manager";

      case "Staff":
        return "/staff";

      default:
        return "/home";
    }
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const res = await axiosClient.post("/api/auth/login", {
        email,
        password,
      });

      console.log("LOGIN RESPONSE:", res.data);

      const payload = res.data?.data as
        | {
            token?: string;
            user?: {
              role?: string;
              [key: string]: unknown;
            };
          }
        | undefined;

      const token = payload?.token;
      const user = payload?.user;

      if (!token || !user) {
        setMessage(res.data?.message || "Không tìm thấy token từ server");
        setLoading(false);
        return;
      }

      // Lưu token đăng nhập
      localStorage.setItem("token", token);

      // Lưu thông tin người dùng
      localStorage.setItem("user", JSON.stringify(user));

      // Lưu role
      localStorage.setItem("userRole", user.role ?? "");

      setMessage("Đăng nhập thành công");

      // Chuyển tới trang tương ứng với role
      navigate(getRedirectPath(user.role ?? ""), {
        replace: true,
      });
    } catch (error: unknown) {
      console.log(error);

      const axiosError = error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      const errorMessage =
        axiosError.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.";

      setMessage(errorMessage);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        {/* Nút quay lại */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 text-sm font-medium text-gray-600 transition hover:text-blue-600"
        >
          ← Quay lại
        </button>

        {/* Tiêu đề */}
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">
          Đăng nhập
        </h1>

        <p className="mb-6 text-center text-gray-500">
          Chào mừng bạn quay trở lại
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="Nhập email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Mật khẩu */}
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Mật khẩu
            </label>

            {/* Khung relative để đặt con mắt bên trong input */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />

              {/* Nút con mắt */}
              <button
                type="button"
                onClick={() => setShowPassword((currentValue) => !currentValue)}
                aria-label={
                  showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"
                }
                title={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-gray-500 transition hover:text-blue-600 focus:outline-none"
              >
                {showPassword ? (
                  // Mắt có gạch: bấm để ẩn mật khẩu
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m2 2 20 20" />

                    <path d="M6.71 6.71C4.88 7.9 3.32 9.71 2 12c2.4 4 5.73 6 10 6 1.55 0 2.95-.26 4.21-.78" />

                    <path d="M10.73 5.08A10.62 10.62 0 0 1 12 5c4.27 0 7.6 2 10 7a14.49 14.49 0 0 1-2.02 2.73" />

                    <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
                  </svg>
                ) : (
                  // Mắt bình thường: bấm để hiện mật khẩu
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />

                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Quên mật khẩu */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Nút đăng nhập */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        {/* Thông báo đăng nhập */}
        {message && (
          <p className="mt-4 text-center text-sm text-red-500">{message}</p>
        )}

        {/* Đăng ký */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:underline"
          >
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;