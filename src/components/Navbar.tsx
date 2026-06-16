import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");
  const user = token && userString ? JSON.parse(userString) : null;

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-2xl font-bold text-sky-600">
          Auto Wash Pro
        </Link>

        <div className="flex items-center gap-8">
          <Link to="/" className="font-medium text-gray-700 hover:text-sky-600">
            Trang chủ
          </Link>

          <Link
            to="/"
            className="font-medium text-gray-700 hover:text-sky-600"
          >
            Bảng giá dịch vụ
          </Link>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2">
              <p className="text-sm font-semibold text-slate-800">
                {user.fullName || user.email || "Người dùng"}
              </p>

              <p className="text-xs text-sky-600">Hạng: Thành viên</p>
            </div>

            <Link
              to="/register-car"
              className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700"
            >
              Đăng ký xe
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-600"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Link
              to="/login"
              className="rounded-lg border border-sky-600 px-4 py-2 text-sky-600 transition hover:bg-sky-50"
            >
              Đăng nhập
            </Link>

            <Link
              to="/register"
              className="rounded-lg bg-sky-600 px-4 py-2 text-white transition hover:bg-sky-700"
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;