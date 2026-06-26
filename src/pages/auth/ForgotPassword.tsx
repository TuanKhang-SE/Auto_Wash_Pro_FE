import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!email.trim()) {
      setMessage("Vui lòng nhập email");
      return;
    }

    try {
      setLoading(true);

      const res = await axiosClient.post("/api/auth/forgot-password/send-code", {
        email: email.trim(),
      });

      setMessage(res.data?.message || "Mã xác minh đã được gửi đến email");
      setStep(2);
    } catch (error: any) {
      console.log(error.response?.data || error);
      setMessage(
        error.response?.data?.message || "Gửi mã xác minh thất bại"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!code.trim()) {
      setMessage("Vui lòng nhập mã xác minh");
      return;
    }

    if (!newPassword) {
      setMessage("Vui lòng nhập mật khẩu mới");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setLoading(true);

      const res = await axiosClient.post("/api/auth/forgot-password/reset", {
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });

      setMessage(res.data?.message || "Đặt lại mật khẩu thành công");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error: any) {
      console.log(error.response?.data || error);
      setMessage(
        error.response?.data?.message || "Đặt lại mật khẩu thất bại"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 text-sm font-medium text-gray-600 hover:text-blue-600"
        >
          ← Quay lại
        </button>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Quên mật khẩu
        </h1>

        <p className="text-center text-gray-500 mb-6">
          {step === 1
            ? "Nhập email để nhận mã xác minh"
            : "Nhập mã OTP và mật khẩu mới"}
        </p>

        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>

              <input
                type="email"
                placeholder="Nhập email đã đăng ký"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? "Đang gửi mã..." : "Gửi mã xác minh"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              Mã xác minh đã gửi đến:{" "}
              <span className="font-semibold">{email}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã xác minh
              </label>

              <input
                type="text"
                placeholder="Nhập mã 6 số"
                value={code}
                maxLength={6}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu mới
              </label>

              <input
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu mới
              </label>

              <input
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => setStep(1)}
              className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
            >
              Đổi email
            </button>
          </form>
        )}

        {message && (
          <p
            className={`text-center mt-4 text-sm ${
              message.includes("thành công") ||
              message.includes("đã được gửi")
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

        <p className="text-center text-sm text-gray-600 mt-6">
          Nhớ mật khẩu rồi?{" "}
          <Link
            to="/login"
            className="text-blue-600 font-medium hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;