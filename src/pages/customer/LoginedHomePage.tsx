import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import Navbar from "../../components/Navbar";
import axiosClient from "../../api/axiosClient";
import heroBg from "../../assets/hero-bg.jpg";

type Branch = {
  BranchID: number;
  BranchName: string;
  Address: string | null;
  Phone: string | null;
  Status: string | null;
};

function getUserName() {
  const userString = localStorage.getItem("user");

  if (!userString) {
    return "Khách hàng";
  }

  try {
    const user = JSON.parse(userString);
    return (
      user.fullName ||
      user.FullName ||
      user.email ||
      user.Email ||
      "Khách hàng"
    );
  } catch {
    return "Khách hàng";
  }
}

const LoginedHomePage = () => {
  const userName = getUserName();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchMessage, setBranchMessage] = useState("");
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    async function loadBranches() {
      try {
        setLoadingBranches(true);
        setBranchMessage("");

        const res = await axiosClient.get("/api/branches?status=Active");

        const activeBranches: Branch[] = res.data.data || [];
        setBranches(activeBranches);

        const reviewResponses = await Promise.allSettled(
          activeBranches.map((branch) =>
            axiosClient.get(`/api/reviews/branch/${branch.BranchID}`)
          )
        );
        let reviewCount = 0;
        let weightedRating = 0;
        reviewResponses.forEach((result) => {
          if (result.status !== "fulfilled") return;
          const summary = result.value.data?.data;
          const count = Number(summary?.totalReviews || 0);
          reviewCount += count;
          weightedRating += Number(summary?.averageRating || 0) * count;
        });
        setTotalReviews(reviewCount);
        setAverageRating(reviewCount > 0 ? weightedRating / reviewCount : 0);
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
        className="relative bg-cover bg-center bg-no-repeat px-6 py-24 text-white"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
            Xin chào
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-6xl">{userName}</h1>

          <p className="mt-5 max-w-2xl text-lg text-slate-200">
            Bạn có thể đặt lịch rửa xe, quản lý xe đã đăng ký và xem thông tin
            cá nhân ngay trong hệ thống Auto Wash Pro.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/booking"
              className="rounded-xl bg-sky-600 px-6 py-3 text-center font-semibold text-white transition hover:bg-sky-700"
            >
              Đặt lịch rửa xe
            </Link>

            <Link
              to="/customer/vehicles"
              className="rounded-xl bg-white px-6 py-3 text-center font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Xem xe của tôi
            </Link>

            <Link
              to="/customer/bookings"
              className="rounded-xl border border-white/70 px-6 py-3 text-center font-semibold text-white transition hover:bg-white hover:text-slate-900"
            >
              Lịch sử đặt lịch
            </Link>
          </div>
        </div>
      </section>

      <main className="bg-gray-100 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <section className="mb-8">
            <div className="flex max-w-md items-center gap-5 rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-500">
                <Star size={30} className="fill-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Đánh giá trung bình</p>
                <div className="mt-1 flex items-end gap-2">
                  <p className="text-3xl font-black text-slate-900">
                    {averageRating.toFixed(1)}/5
                  </p>
                  <p className="pb-1 text-sm text-slate-500">
                    ({totalReviews.toLocaleString("vi-VN")} lượt đánh giá)
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-400">Tổng hợp từ tất cả chi nhánh</p>
              </div>
            </div>
          </section>

          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <Link
              to="/booking"
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 text-4xl">📅</div>
              <h2 className="text-lg font-bold text-slate-800">Đặt lịch</h2>
              <p className="mt-2 text-sm text-slate-500">
                Chọn chi nhánh, dịch vụ, xe và khung giờ rửa xe.
              </p>
            </Link>

            <Link
              to="/customer/bookings"
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 text-4xl">📖</div>
              <h2 className="text-lg font-bold text-slate-800">
                Lịch sử đặt lịch
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Xem lại các lịch rửa xe đã đặt và trạng thái xử lý.
              </p>
            </Link>

            <Link
              to="/register-car"
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 text-4xl">🚘</div>
              <h2 className="text-lg font-bold text-slate-800">Đăng ký xe</h2>
              <p className="mt-2 text-sm text-slate-500">
                Thêm xe mới vào tài khoản để đặt lịch nhanh hơn.
              </p>
            </Link>

            <Link
              to="/customer/vehicles"
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 text-4xl">🧾</div>
              <h2 className="text-lg font-bold text-slate-800">Xe của tôi</h2>
              <p className="mt-2 text-sm text-slate-500">
                Xem, chỉnh sửa hoặc xóa thông tin xe đã đăng ký.
              </p>
            </Link>

            <Link
              to="/customer/profile"
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 text-4xl">👤</div>
              <h2 className="text-lg font-bold text-slate-800">Hồ sơ</h2>
              <p className="mt-2 text-sm text-slate-500">
                Xem thông tin cá nhân và dữ liệu khách hàng.
              </p>
            </Link>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-2xl font-bold text-slate-800">
                Quy trình đặt lịch
              </h2>

              <div className="mt-6 space-y-5">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">
                      Kiểm tra xe đã đăng ký
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Nếu chưa có xe, hãy thêm xe trước khi đặt lịch.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">
                      Chọn chi nhánh và dịch vụ
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Chọn nơi rửa xe, dịch vụ cần dùng và phương tiện của bạn.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">
                      Chọn khung giờ còn trống
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Hệ thống sẽ hiển thị các slot còn khả dụng để bạn chọn.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">
                      Đến chi nhánh đúng giờ
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Nhân viên sẽ kiểm tra xe và cập nhật trạng thái xử lý.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
              <h2 className="text-2xl font-bold">Gợi ý hôm nay</h2>

              <div className="mt-6 space-y-4">
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="font-semibold">Bạn mới dùng hệ thống?</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Hãy đăng ký xe trước, sau đó quay lại đặt lịch.
                  </p>
                </div>

                <div className="rounded-xl bg-white/10 p-4">
                  <p className="font-semibold">Muốn tiết kiệm thời gian?</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Đặt lịch trước để cửa hàng chuẩn bị slot phù hợp.
                  </p>
                </div>

                <div className="rounded-xl bg-white/10 p-4">
                  <p className="font-semibold">Có nhiều xe?</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Bạn có thể lưu nhiều xe trong mục “Xe của tôi”.
                  </p>
                </div>
              </div>
            </aside>
          </section>

          <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Dịch vụ thường dùng
                </h2>
                <p className="mt-2 text-slate-500">
                  Một số dịch vụ cơ bản khách hàng thường chọn khi đặt lịch.
                </p>
              </div>

              <Link
                to="/booking"
                className="rounded-xl bg-sky-600 px-5 py-3 text-center font-semibold text-white hover:bg-sky-700"
              >
                Đặt lịch ngay
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-gray-100 p-5">
                <p className="text-3xl">🏍️</p>
                <h3 className="mt-3 font-bold text-slate-800">Rửa xe máy</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Dịch vụ nhanh, phù hợp cho nhu cầu hằng ngày.
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 p-5">
                <p className="text-3xl">🚗</p>
                <h3 className="mt-3 font-bold text-slate-800">Rửa ô tô</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Làm sạch xe theo quy trình tại chi nhánh.
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 p-5">
                <p className="text-3xl">✨</p>
                <h3 className="mt-3 font-bold text-slate-800">Chăm sóc xe</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Thêm dịch vụ phát sinh khi xe cần chăm sóc kỹ hơn.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800">
              Thông tin chi nhánh
            </h2>

            <p className="mt-2 text-slate-500">
              Danh sách chi nhánh đang hoạt động được lấy trực tiếp từ database.
            </p>

            <div className="mt-6">
              {loadingBranches && (
                <p className="text-sm text-slate-500">
                  Đang tải danh sách chi nhánh...
                </p>
              )}

              {!loadingBranches && branchMessage && (
                <p className="text-sm text-red-500">{branchMessage}</p>
              )}

              {!loadingBranches && !branchMessage && branches.length === 0 && (
                <p className="text-sm text-slate-500">
                  Hiện chưa có chi nhánh hoạt động.
                </p>
              )}

              {!loadingBranches && branches.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                  {branches.map((branch) => (
                    <div
                      key={branch.BranchID}
                      className="rounded-xl bg-gray-50 p-5"
                    >
                      <p className="font-semibold text-slate-800">
                        {branch.BranchName}
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        {branch.Address || "Chưa cập nhật địa chỉ"}
                      </p>

                      <p className="mt-3 text-sm font-medium text-sky-700">
                        Hotline: {branch.Phone || "Chưa cập nhật"}
                      </p>

                      <span className="mt-4 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        {branch.Status === "Active"
                          ? "Đang hoạt động"
                          : "Tạm ngưng"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-slate-950 px-6 py-6 text-center text-sm text-slate-400">
        © 2026 Auto Wash Pro. All rights reserved.
      </footer>
    </>
  );
};

export default LoginedHomePage;
