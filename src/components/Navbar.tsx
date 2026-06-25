import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

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
        <Link
          to={user ? "/home" : "/"}
          className="text-2xl font-bold text-sky-600"
        >
          Auto Wash Pro
        </Link>

        <div className="flex items-center gap-8">
          <Link
            to={user ? "/home" : "/"}
            className="font-medium text-gray-700 hover:text-sky-600"
          >
            Trang chủ
          </Link>

          <Link
            to="/about"
            className="font-medium text-gray-700 hover:text-sky-600"
          >
            Về Auto Wash Pro
          </Link>

          <Link
            to="/booking"
            className="font-medium text-gray-700 hover:text-sky-600"
          >
            Đặt lịch
          </Link>
        </div>

        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-left transition hover:bg-sky-100"
            >
              <p className="text-sm font-semibold text-slate-800">
                {user.fullName || user.email || "Người dùng"}
              </p>

              <p className="text-xs text-sky-600">Hạng: Thành viên</p>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-gray-100 bg-white p-3 shadow-2xl">
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-200 text-lg font-bold text-sky-700">
                    {(user.fullName || user.email || "N")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <p className="font-semibold text-slate-800">
                      {user.fullName || "Người dùng"}
                    </p>

                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                </div>

                <hr className="my-2" />

                <Link
                  to="/customer/profile"
                  className="block rounded-lg px-4 py-3 font-medium text-slate-700 hover:bg-gray-100"
                >
                  Thông tin cá nhân
                </Link>

                <Link
                  to="/register-car"
                  className="block rounded-lg px-4 py-3 font-medium text-slate-700 hover:bg-gray-100"
                >
                  Đăng ký xe
                </Link>

                <Link
                  to="/customer/vehicles"
                  className="block rounded-lg px-4 py-3 font-medium text-slate-700 hover:bg-gray-100"
                >
                  Thông tin xe
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg px-4 py-3 text-left font-medium text-red-600 hover:bg-red-50"
                >
                  Đăng xuất
                </button>
              </div>
            )}
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