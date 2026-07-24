import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosClient, { getErrorMessage } from "../../api/axiosClient";
import PasswordInput from "../../components/PasswordInput";

const fullNameRegex = /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u;
const phoneRegex = /^0\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const verificationCodeRegex = /^\d{6}$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,64}$/;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

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
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  async function handleSendCode() {
    const normalizedEmail = normalizeEmail(email);

    setMessage("");

    if (!normalizedEmail) {
      setMessage("Vui lòng nhập email trước");
      return;
    }

    if (!emailRegex.test(normalizedEmail)) {
      setMessage("Email không đúng định dạng, ví dụ: example@gmail.com");
      return;
    }

    try {
      setIsSendingCode(true);

      await axiosClient.post("/api/auth/send-register-code", {
        email: normalizedEmail,
      });

      setEmail(normalizedEmail);
      setIsCodeSent(true);
      setMessage("Mã xác minh đã được gửi đến email");
    } catch (error: unknown) {
      setIsCodeSent(false);
      setMessage(getErrorMessage(error) || "Gửi mã xác minh thất bại");
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");

    const trimmedFullName = fullName.trim().replace(/\s+/g, " ");
    const trimmedPhone = phone.trim();
    const normalizedEmail = normalizeEmail(email);

    if (!trimmedFullName) {
      setMessage("Vui lòng nhập họ và tên");
      return;
    }

    if (!fullNameRegex.test(trimmedFullName)) {
      setMessage("Họ và tên chỉ được chứa chữ cái, khoảng trắng, dấu nháy đơn hoặc dấu gạch nối");
      return;
    }

    if (!phoneRegex.test(trimmedPhone)) {
      setMessage("Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số");
      return;
    }

    if (!emailRegex.test(normalizedEmail)) {
      setMessage("Email không đúng định dạng, ví dụ: example@gmail.com");
      return;
    }

    if (!isCodeSent) {
      setMessage("Vui lòng bấm gửi mã xác minh trước");
      return;
    }

    if (!verificationCodeRegex.test(code)) {
      setMessage("Mã xác minh phải có đúng 6 chữ số");
      return;
    }

    if (!passwordRegex.test(password)) {
      setMessage(
        "Mật khẩu phải có 8–64 ký tự, gồm chữ thường, chữ hoa, số, ký tự đặc biệt và không có khoảng trắng"
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setIsRegistering(true);

      await axiosClient.post("/api/auth/register", {
        fullName: trimmedFullName,
        phone: trimmedPhone,
        email: normalizedEmail,
        password,
        code,
      });

      setMessage("Đăng ký thành công");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error) || "Đăng ký thất bại");
    } finally {
      setIsRegistering(false);
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
              Họ và tên <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              placeholder="Nhập họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value.replace(/\d/g, ""))}
              autoComplete="name"
              maxLength={100}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>

            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              pattern="0[0-9]{9}"
              placeholder="Nhập số điện thoại"
              value={phone}
              onChange={(e) => {
                const onlyNumbers = e.target.value.replace(/\D/g, "").slice(0, 10);
                setPhone(onlyNumbers);
              }}
              autoComplete="tel"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

<p className="mt-1 text-xs text-gray-500">
  Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số.
</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
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
              autoComplete="email"
              maxLength={254}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

<p className="mt-1 text-xs text-gray-500">
  Email phải đúng định dạng, ví dụ: example@gmail.com.
</p>

          <button
            type="button"
            onClick={handleSendCode}
            disabled={isSendingCode || isRegistering}
            className="w-full bg-gray-700 text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isSendingCode
              ? "Đang gửi mã..."
              : isCodeSent
                ? "Gửi lại mã xác minh"
                : "Gửi mã xác minh"}
          </button>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã xác minh <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              inputMode="numeric"
              placeholder="Nhập mã 6 số"
              value={code}
              maxLength={6}
              pattern="[0-9]{6}"
              onChange={(e) => {
                const onlyNumber = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(onlyNumber);
              }}
              autoComplete="one-time-code"
              disabled={!isCodeSent || isRegistering}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu <span className="text-red-500">*</span>
            </label>

            <PasswordInput
              id="register-password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={64}
              required
              revealLabel="mật khẩu"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-12 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

<p className="mt-1 text-xs text-gray-500">
  8–64 ký tự, gồm chữ thường, chữ hoa, số, ký tự đặc biệt và không có khoảng trắng.
</p>

          <div>
            <label htmlFor="register-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              Nhập lại mật khẩu <span className="text-red-500">*</span>
            </label>

            <PasswordInput
              id="register-confirm-password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={64}
              required
              revealLabel="mật khẩu xác nhận"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-12 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isRegistering || isSendingCode}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isRegistering ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        {message && (
          <p className="text-center mt-4 text-sm text-red-500" aria-live="polite">
            {message}
          </p>
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
