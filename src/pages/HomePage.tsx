import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import axiosClient from "../api/axiosClient";
import heroBg from "../assets/hero-bg.jpg";

type Branch = {
  BranchID: number;
  BranchName: string;
  Address: string | null;
  Phone: string | null;
  Status: string | null;
};

const HomePage = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchMessage, setBranchMessage] = useState("");

  useEffect(() => {
    async function loadBranches() {
      try {
        setLoadingBranches(true);
        setBranchMessage("");

        const res = await axiosClient.get("/api/branches?status=Active");

        setBranches(res.data.data || []);
      } catch (error) {
        console.log(error);
        setBranchMessage("Không tải được danh sách chi nhánh");
      } finally {
        setLoadingBranches(false);
      }
    }

    loadBranches();
  }, []);

  return (
    <>
      <Navbar />

      <section
        className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-6 text-white"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-black/55"></div>

        <div className="relative z-10 max-w-4xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
            Auto Wash Pro
          </p>

          <h1 className="text-5xl font-bold leading-tight md:text-7xl">
            Đặt lịch rửa xe nhanh, quản lý xe dễ dàng
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-200">
            Hệ thống giúp khách hàng đặt lịch rửa xe, quản lý thông tin xe,
            theo dõi lịch hẹn và sử dụng dịch vụ tại nhiều chi nhánh.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="rounded-xl bg-sky-600 px-6 py-3 font-semibold text-white transition hover:bg-sky-700"
            >
              Tạo tài khoản
            </Link>

            <Link
              to="/login"
              className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Đăng nhập để đặt lịch
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-slate-800">
            Dịch vụ nổi bật
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-500">
            Auto Wash Pro hỗ trợ nhiều dịch vụ chăm sóc xe cơ bản, phù hợp cho
            cả xe máy và ô tô.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 text-4xl">🏍️</div>
              <h3 className="text-xl font-bold text-slate-800">Rửa xe máy</h3>
              <p className="mt-3 text-slate-500">
                Làm sạch nhanh, phù hợp cho nhu cầu sử dụng hằng ngày.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 text-4xl">🚗</div>
              <h3 className="text-xl font-bold text-slate-800">Rửa ô tô</h3>
              <p className="mt-3 text-slate-500">
                Quy trình rửa xe chuyên nghiệp, tiết kiệm thời gian chờ đợi.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 text-4xl">✨</div>
              <h3 className="text-xl font-bold text-slate-800">
                Chăm sóc xe
              </h3>
              <p className="mt-3 text-slate-500">
                Hỗ trợ các dịch vụ phát sinh như vệ sinh, chăm sóc và làm mới xe.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-slate-800">
            Quy trình sử dụng
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                1
              </p>
              <h3 className="font-bold text-slate-800">Tạo tài khoản</h3>
              <p className="mt-2 text-sm text-slate-500">
                Đăng ký tài khoản khách hàng để sử dụng hệ thống.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                2
              </p>
              <h3 className="font-bold text-slate-800">Đăng ký xe</h3>
              <p className="mt-2 text-sm text-slate-500">
                Thêm biển số, loại xe, hãng xe và màu xe.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                3
              </p>
              <h3 className="font-bold text-slate-800">Đặt lịch</h3>
              <p className="mt-2 text-sm text-slate-500">
                Chọn chi nhánh, dịch vụ, xe và khung giờ phù hợp.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                4
              </p>
              <h3 className="font-bold text-slate-800">Đến rửa xe</h3>
              <p className="mt-2 text-sm text-slate-500">
                Đến chi nhánh đúng giờ và theo dõi trạng thái dịch vụ.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-slate-800">
            Vì sao chọn Auto Wash Pro?
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-sky-50 p-6">
              <h3 className="text-xl font-bold text-slate-800">
                Đặt lịch tiện lợi
              </h3>
              <p className="mt-3 text-slate-600">
                Khách hàng có thể đặt lịch trước để giảm thời gian chờ tại cửa
                hàng.
              </p>
            </div>

            <div className="rounded-2xl bg-sky-50 p-6">
              <h3 className="text-xl font-bold text-slate-800">
                Quản lý xe rõ ràng
              </h3>
              <p className="mt-3 text-slate-600">
                Mỗi khách hàng có thể lưu danh sách xe và dùng lại khi đặt lịch.
              </p>
            </div>

            <div className="rounded-2xl bg-sky-50 p-6">
              <h3 className="text-xl font-bold text-slate-800">
                Theo dõi lịch sử
              </h3>
              <p className="mt-3 text-slate-600">
                Hệ thống hỗ trợ lưu lịch sử đặt lịch và thông tin sử dụng dịch
                vụ.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 px-6 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold">Chi nhánh hoạt động</h2>

              <p className="mt-4 text-slate-300">
                Auto Wash Pro hỗ trợ nhiều chi nhánh để khách hàng lựa chọn nơi
                rửa xe thuận tiện nhất.
              </p>

              <div className="mt-8">
                {loadingBranches && (
                  <p className="text-sm text-slate-300">
                    Đang tải danh sách chi nhánh...
                  </p>
                )}

                {!loadingBranches && branchMessage && (
                  <p className="text-sm text-red-300">{branchMessage}</p>
                )}

                {!loadingBranches &&
                  !branchMessage &&
                  branches.length === 0 && (
                    <p className="text-sm text-slate-300">
                      Hiện chưa có chi nhánh hoạt động.
                    </p>
                  )}

                {!loadingBranches && branches.length > 0 && (
                  <div className="space-y-4">
                    {branches.map((branch) => (
                      <div
                        key={branch.BranchID}
                        className="rounded-2xl bg-white/10 p-5"
                      >
                        <h3 className="font-bold text-white">
                          {branch.BranchName}
                        </h3>

                        <p className="mt-2 text-sm text-slate-300">
                          📍 {branch.Address || "Chưa cập nhật địa chỉ"}
                        </p>

                        <p className="mt-2 text-sm text-slate-300">
                          📞 {branch.Phone || "Chưa cập nhật số điện thoại"}
                        </p>

                        <span className="mt-3 inline-block rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-300">
                          {branch.Status === "Active"
                            ? "Đang hoạt động"
                            : "Tạm ngưng"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-8 text-slate-900">
              <h3 className="text-2xl font-bold">Bắt đầu sử dụng ngay</h3>

              <p className="mt-3 text-slate-600">
                Tạo tài khoản để đăng ký xe, đặt lịch và quản lý thông tin cá
                nhân.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="rounded-xl bg-sky-600 px-5 py-3 text-center font-semibold text-white hover:bg-sky-700"
                >
                  Đăng ký
                </Link>

                <Link
                  to="/login"
                  className="rounded-xl border border-sky-600 px-5 py-3 text-center font-semibold text-sky-700 hover:bg-sky-50"
                >
                  Đăng nhập
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 px-6 py-6 text-center text-sm text-slate-400">
        © 2026 Auto Wash Pro. All rights reserved.
      </footer>
    </>
  );
};

export default HomePage;