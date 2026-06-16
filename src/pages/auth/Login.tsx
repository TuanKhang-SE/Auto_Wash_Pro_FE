import { useState } from "react";
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (event: any) => {
    event.preventDefault();

    console.log("Email:", email);
    console.log("Mật khẩu:", password);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <Link to="/" className="text-3xl font-bold text-sky-600">
            Auto Wash Pro
          </Link>

          <h1 className="mt-6 text-2xl font-bold text-slate-800">
            Đăng nhập
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Chào mừng bạn quay lại hệ thống
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Mật khẩu
            </label>

            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input type="checkbox" className="h-4 w-4" />
              Ghi nhớ đăng nhập
            </label>

            <Link
              to="/forgot-password"
              className="font-medium text-sky-600 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-sky-600 py-3 font-semibold text-white transition hover:bg-sky-700"
          >
            Đăng nhập
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="font-semibold text-sky-600 hover:underline"
          >
Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
