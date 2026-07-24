import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import PasswordInput from "../../components/PasswordInput";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
          onClick={() => navigate("/")}
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

            <PasswordInput
              id="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              revealLabel="mật khẩu"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
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