import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      const res = await axiosClient.post("/api/auth/login", {
        email,
        password,
      });

      console.log("LOGIN RESPONSE:", res.data);

      const token = res.data?.data?.token || res.data?.token;
      const user = res.data?.data?.user || res.data?.user;

      if (!token) {
        setMessage("Không tìm thấy token từ server");
        return;
      }

      localStorage.setItem("token", token);

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      setMessage("Đăng nhập thành công");

      navigate("/home");
    } catch (error) {
      console.log(error);
      setMessage("Đăng nhập thất bại");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
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
          <p className="text-center mt-4 text-sm text-red-500">{message}</p>
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