import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Car,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import axiosClient, { getErrorMessage } from "../../api/axiosClient";

function getRedirectPath(role: string | null) {
  switch (role) {
    case "Admin":
      return "/admin";

    case "Manager":
      return "/manager";

    case "Staff":
      return "/staff";

    case "Customer":
      return "/home";

    default:
      return "/home";
  }
}

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setMessage("");

    if (!email.trim()) {
      setMessage("Vui lòng nhập email");
      return;
    }

    if (!password.trim()) {
      setMessage("Vui lòng nhập mật khẩu");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await axiosClient.post("/api/auth/login", {
        Email: email,
        Password: password,
      });

      const data = res.data.data || res.data;

      const token = data.token || data.Token || data.accessToken;
      const user = data.user || data.User || data.Users || data;

      const role =
        user?.Role ||
        user?.role ||
        data.Role ||
        data.role ||
        data.userRole ||
        "Customer";

      if (!token) {
        setMessage("Đăng nhập thành công nhưng không nhận được token");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", role);
      localStorage.setItem("user", JSON.stringify(user));

      navigate(getRedirectPath(role));
    } catch (error) {
      console.log(error);
      setMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-10">
      {/* Background màu */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#2563eb,transparent_35%),radial-gradient(circle_at_bottom_right,#9333ea,transparent_35%),linear-gradient(135deg,#020617,#0f172a,#111827)]" />

      <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-cyan-400/30 blur-3xl" />
      <div className="absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl" />
      <div className="absolute right-1/4 top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />

      {/* Decorative circles */}
      <div className="absolute left-20 top-24 hidden h-24 w-24 rounded-full border border-white/20 md:block" />
      <div className="absolute bottom-24 right-28 hidden h-16 w-16 rounded-full border border-cyan-300/30 md:block" />

      <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl shadow-blue-950/40 backdrop-blur-xl lg:grid-cols-2">
        {/* Left panel */}
        <div className="hidden bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-purple-700/90 p-10 text-white lg:block">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100 hover:text-white"
          >
            <ArrowLeft size={18} />
            Quay lại
          </Link>

          <div className="mt-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur">
              <Car size={34} />
            </div>

            <h1 className="mt-8 text-4xl font-black leading-tight">
              Auto Wash Pro
            </h1>

            <p className="mt-4 max-w-sm text-lg text-blue-100">
              Đăng nhập để đặt lịch rửa xe, quản lý phương tiện và theo dõi
              lịch sử dịch vụ của bạn.
            </p>

            <div className="mt-10 space-y-4">
              <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-4 backdrop-blur">
                <Sparkles className="text-yellow-300" />
                <div>
                  <p className="font-bold">Đặt lịch nhanh chóng</p>
                  <p className="text-sm text-blue-100">
                    Chọn chi nhánh, xe, dịch vụ và khung giờ phù hợp.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-4 backdrop-blur">
                <Car className="text-cyan-200" />
                <div>
                  <p className="font-bold">Quản lý xe dễ dàng</p>
                  <p className="text-sm text-blue-100">
                    Lưu thông tin xe và theo dõi trạng thái đặt lịch.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right login form */}
        <div className="bg-white p-8 sm:p-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 lg:hidden"
          >
            <ArrowLeft size={18} />
            Quay lại
          </Link>

          <div className="mx-auto mt-4 max-w-md lg:mt-0">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30">
                <Car size={34} />
              </div>

              <h2 className="mt-6 text-3xl font-black text-slate-900">
                Đăng nhập
              </h2>

              <p className="mt-2 text-slate-500">
                Chào mừng bạn quay trở lại Auto Wash Pro
              </p>
            </div>

            {message && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Email
                </label>

                <div className="relative">
                  <Mail
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-12 font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Mật khẩu
                </label>

                <div className="relative">
                  <Lock
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-12 pr-12 font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-bold text-blue-600 hover:text-purple-600"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-500/30 transition hover:scale-[1.01] hover:shadow-xl hover:shadow-purple-500/30 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition group-hover:translate-x-full" />

                <span className="relative">
                  {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </span>
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="font-bold text-blue-600 hover:text-purple-600"
              >
                Đăng ký
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;