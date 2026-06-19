import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import heroBg from "../../assets/hero-bg.jpg";

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

  async function handleLogin(e: { preventDefault: () => void }) {
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
        | { token?: string; user?: { role?: string; [k: string]: unknown } }
        | undefined;
      const token = payload?.token;
      const user = payload?.user;

      if (!token || !user) {
        setMessage(res.data?.message || "Không tìm thấy token từ server");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userRole", (user.role as string) ?? "");

      setMessage("Đăng nhập thành công");
      navigate(getRedirectPath(user.role as string), { replace: true });
    } catch (error: unknown) {
      console.log(error);

      const axiosErr = error as {
        response?: { data?: { message?: string } };
      };

      const errMsg =
        axiosErr?.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu.";

      setMessage(errMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center px-4"
      style={{ backgroundImage: `url(${heroBg})` }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white/95 p-8 shadow-lg backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Đăng nhập
        </h1>

        <p className="text-center text-gray-500 mb-6">
          Chào mừng bạn quay trở lại
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>

            <input
              type="email"
              placeholder="Nhập email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>

            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
          >
            Đăng nhập
          </button>
        </form>

        {message && (
          <p className="text-center mt-4 text-sm text-red-500">
            {message}
          </p>
        )}

        <p className="text-center text-sm text-gray-600 mt-6">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="text-blue-600 font-medium hover:underline"
          >
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
