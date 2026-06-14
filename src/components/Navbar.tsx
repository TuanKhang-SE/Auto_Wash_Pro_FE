import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="text-2xl font-bold text-sky-600"
        >
          Auto Wash Pro
        </Link>

        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="font-medium text-gray-700 hover:text-sky-600"
          >
            Trang chủ
          </Link>

          <Link
            to="/pricing"
            className="font-medium text-gray-700 hover:text-sky-600"
          >
            Bảng giá dịch vụ
          </Link>
        </div>

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
      </div>
    </nav>
  );
};

export default Navbar;