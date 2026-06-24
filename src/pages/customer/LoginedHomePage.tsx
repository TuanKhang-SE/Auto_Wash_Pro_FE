import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import heroBg from "../../assets/hero-bg.jpg";


const LoginedHomePage = () => {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section
        className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center text-white"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <h1 className="text-7xl font-bold">Auto Wash Pro</h1>

        <p className="mt-3 text-lg">
          Hệ thống đặt lịch và quản lý rửa xe tự động
        </p>

        <Link
          to="/booking"
          className="rounded-xl mt-10 bg-white px-5 py-3 font-semibold text-black transition hover:scale-105"
        >
          Đặt lịch ngay
        </Link>
      </section>

      {/* Dịch vụ */}
      <section className="bg-white py-10">
        <div className="flex flex-col items-center justify-center w-full gap-6">
          <h2 className="text-center text-3xl font-bold">
            Dịch vụ nổi bật
          </h2>

          <div className="flex flex-row justify-center items-center gap-8 w-full max-w-2xl px-4">
            <div className="flex-1 min-w-[150px] max-w-[250px] text-center bg-white py-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
              Rửa xe máy
            </div>

            <div className="flex-1 min-w-[150px] max-w-[250px] text-center bg-white py-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition">
              Chăm sóc xe
            </div>
          </div>
        </div>
      </section>

      {/* Giới thiệu */}
      <section className="mx-auto max-w-6xl px-6 py-16 bg-white">
        <h2 className="mb-10 text-center text-3xl font-bold">
          Vì sao chọn Auto Wash Pro?
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-xl bg-sky-200 p-6 shadow">
            <h3 className="mb-3 text-xl text-black font-semibold">
              Nhanh chóng
            </h3>

            <p className="text-black">
              Quy trình tự động giúp tiết kiệm thời gian.
            </p>
          </div>

          <div className="rounded-xl bg-sky-200 p-6 shadow">
            <h3 className="mb-3 text-xl text-black font-semibold">
              Chuyên nghiệp
            </h3>

            <p className="text-black">
              Trang thiết bị hiện đại và dịch vụ chất lượng.
            </p>
          </div>

          <div className="rounded-xl bg-sky-200 p-6 shadow">
            <h3 className="mb-3 text-xl text-black font-semibold">
              Tiện lợi
            </h3>

            <p className="text-black">
              Đặt lịch trực tuyến mọi lúc mọi nơi.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="flex flex-col gap-4">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Auto Wash Pro
              </h3>

              <p className="text-sm text-slate-400 leading-relaxed">
                Hệ thống chăm sóc và rửa xe chuyên nghiệp tự động. Mang lại trải
                nghiệm sạch sẽ, nhanh chóng và an tâm tuyệt đối cho xế yêu của bạn.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-lg font-semibold text-white">Dịch vụ</h4>

              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-sky-400 transition">
                    Rửa xe máy
                  </a>
                </li>

                <li>
                  <a href="#" className="hover:text-sky-400 transition">
                    Chăm sóc & Đánh bóng
                  </a>
                </li>

                <li>
                  <a href="#" className="hover:text-sky-400 transition">
                    Đặt lịch trước
                  </a>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-lg font-semibold text-white">Liên hệ</h4>

              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  📍 Địa chỉ: 643/40 Đường Xô Viết Nghệ Tĩnh Bình Thạnh, TP. Hồ Chí Minh
                </li>
                <li>
                  📍 Số 7 Đường D1 Phường Tăng Nhơn Phú, TP. Hồ Chí Minh
                </li>
                <li>
                  📍 Số 1 Đường Lưu Hữu Phước Phường Đông Hòa, TP. Hồ Chí Minh
                </li>
                <li>📞 Hotline: 1900 xxxx</li>
                <li>✉️ Email: support@autowashpro.com</li>
              </ul>
            </div>
          </div>

          <hr className="border-slate-800 my-6" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>© 2026 Auto Wash Pro. All rights reserved.</p>

            <div className="flex gap-4">
              <a href="#" className="hover:underline">
                Chính sách bảo mật
              </a>

              <a href="#" className="hover:underline">
                Điều khoản dịch vụ
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default LoginedHomePage;