import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);

  async function handleSendCode() {
    if (!email) {
      setMessage("Vui lòng nhập email trước");
      return;
    }

    try {
      await axiosClient.post("/api/auth/send-register-code", {
        email,
      });

      setIsCodeSent(true);
      setMessage("Mã xác minh đã được gửi đến email");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Gửi mã xác minh thất bại");
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    if (!isCodeSent) {
      setMessage("Vui lòng bấm gửi mã xác minh trước");
      return;
    }

    if (!code) {
      setMessage("Vui lòng nhập mã xác minh");
      return;
    }

    if (code.length !== 6) {
      setMessage("Mã xác minh phải có 6 số");
      return;
    }

    try {
      await axiosClient.post("/api/auth/register", {
        fullName,
        phone,
        email,
        password,
        code,
      });

      setMessage("Đăng ký thành công");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Đăng ký thất bại");
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
          Đăng ký
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Tạo tài khoản để sử dụng hệ thống
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên
            </label>

            <input
              type="text"
              placeholder="Nhập họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại
            </label>

            <input
              type="text"
              placeholder="Nhập số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>

            <input
              type="email"
              placeholder="Nhập email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setIsCodeSent(false);
                setCode("");
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={handleSendCode}
            className="w-full bg-gray-700 text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            {isCodeSent ? "Gửi lại mã xác minh" : "Gửi mã xác minh"}
          </button>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã xác minh
            </label>

            <input
              type="text"
              placeholder="Nhập mã 6 số"
              value={code}
              maxLength={6}
              onChange={(e) => {
                const onlyNumber = e.target.value.replace(/\D/g, "");
                setCode(onlyNumber);
              }}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nhập lại mật khẩu
            </label>

            <input
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
          >
            Đăng ký
          </button>
        </form>

        {message && (
          <p className="text-center mt-4 text-sm text-red-500">{message}</p>
        )}

        <p className="text-center text-sm text-gray-600 mt-6">
          Đã có tài khoản?{" "}
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

export default Register;