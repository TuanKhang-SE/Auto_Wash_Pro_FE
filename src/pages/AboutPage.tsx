import Navbar from "../components/Navbar";
import heroBg from "../assets/hero-bg.jpg";

const milestones = [
  {
    year: "2026",
    title: "Khởi tạo hệ thống",
    description:
      "Auto Wash Pro được xây dựng với mục tiêu hỗ trợ khách hàng đặt lịch rửa xe trực tuyến nhanh chóng và tiện lợi.",
  },
  {
    year: "Giai đoạn 1",
    title: "Quản lý khách hàng và xe",
    description:
      "Hệ thống cho phép khách hàng đăng ký tài khoản, cập nhật thông tin cá nhân và quản lý danh sách xe của mình.",
  },
  {
    year: "Giai đoạn 2",
    title: "Đặt lịch rửa xe",
    description:
      "Khách hàng có thể chọn chi nhánh, dịch vụ, ngày đặt lịch, khung giờ và theo dõi thông tin lịch hẹn.",
  },
  {
    year: "Giai đoạn 3",
    title: "Điểm thưởng và ưu đãi",
    description:
      "Hệ thống hỗ trợ tích điểm, đổi điểm thưởng và áp dụng ưu đãi giảm giá trong quá trình đặt lịch.",
  },
];

const branches = [
  "643/40 Đường Xô Viết Nghệ Tĩnh, Bình Thạnh, TP. Hồ Chí Minh",
  "Số 7 Đường D1, Phường Tăng Nhơn Phú, TP. Hồ Chí Minh",
  "Số 1 Đường Lưu Hữu Phước, Phường Đông Hòa, TP. Hồ Chí Minh",
];

const AboutPage = () => {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100">
        {/* Hero */}
        <section
          className="relative min-h-[520px] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        >
          <div className="absolute inset-0 bg-slate-950/70" />

          <div className="relative mx-auto flex min-h-[520px] max-w-6xl flex-col justify-center px-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-sky-300">
              Về Auto Washing
            </p>

            <h1 className="mt-5 max-w-4xl text-5xl font-bold leading-tight md:text-7xl">
              Auto Wash Pro
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-200">
              Không chỉ là một hệ thống đặt lịch rửa xe, Auto Wash Pro còn là
              nền tảng hỗ trợ khách hàng quản lý xe, lựa chọn dịch vụ, đặt lịch
              trực tuyến và sử dụng ưu đãi một cách nhanh chóng, tiện lợi.
            </p>
          </div>
        </section>

        {/* Intro */}
        <section className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="rounded-3xl bg-white p-8 shadow lg:col-span-2">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-sky-600">
                About us
              </p>

              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                Giới thiệu về Auto Wash Pro
              </h2>

              <p className="mt-5 leading-relaxed text-slate-600">
                Auto Wash Pro là hệ thống đặt lịch và quản lý dịch vụ rửa xe
                trực tuyến, được xây dựng nhằm giúp khách hàng dễ dàng lựa chọn
                chi nhánh, đăng ký xe, chọn dịch vụ, đặt lịch rửa xe và theo dõi
                thông tin cá nhân một cách nhanh chóng.
              </p>

              <p className="mt-4 leading-relaxed text-slate-600">
                Bên cạnh đó, hệ thống còn hỗ trợ cửa hàng trong việc quản lý
                khách hàng, phương tiện, dịch vụ, chi nhánh, nhân viên và lịch
                đặt xe. Auto Wash Pro hướng đến việc giúp quá trình vận hành
                dịch vụ rửa xe trở nên chuyên nghiệp, hiện đại và hiệu quả hơn.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-900 p-8 text-white shadow">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-sky-300">
                Mission
              </p>

              <h2 className="mt-3 text-2xl font-bold">
                Sạch hơn, nhanh hơn, tiện lợi hơn
              </h2>

              <p className="mt-5 leading-relaxed text-slate-300">
                Sứ mệnh của Auto Wash Pro là mang đến trải nghiệm đặt lịch rửa
                xe đơn giản, minh bạch và phù hợp với nhu cầu của khách hàng
                hiện đại.
              </p>
            </div>
          </div>
        </section>

        {/* Vision */}
        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-sky-600">
              Vision
            </p>

            <h2 className="mt-3 text-4xl font-bold text-slate-900">
              Tầm nhìn của hệ thống
            </h2>

            <p className="mt-6 max-w-4xl text-lg leading-relaxed text-slate-600">
              Auto Wash Pro hướng đến việc trở thành một nền tảng quản lý và đặt
              lịch rửa xe tiện lợi, giúp khách hàng chủ động hơn trong việc chăm
              sóc phương tiện, đồng thời giúp cửa hàng tối ưu quy trình vận hành
              và nâng cao chất lượng dịch vụ.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-6">
                <h3 className="text-xl font-bold text-slate-900">
                  Trải nghiệm tiện lợi
                </h3>
                <p className="mt-3 text-slate-600">
                  Khách hàng có thể đặt lịch mọi lúc, mọi nơi chỉ với vài thao
                  tác đơn giản.
                </p>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-6">
                <h3 className="text-xl font-bold text-slate-900">
                  Quản lý rõ ràng
                </h3>
                <p className="mt-3 text-slate-600">
                  Thông tin khách hàng, xe, chi nhánh, dịch vụ và lịch hẹn được
                  quản lý tập trung.
                </p>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-6">
                <h3 className="text-xl font-bold text-slate-900">
                  Dịch vụ hiện đại
                </h3>
                <p className="mt-3 text-slate-600">
                  Hệ thống hỗ trợ ưu đãi, điểm thưởng và thống kê để nâng cao
                  chất lượng phục vụ.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Development */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-sky-600">
            Quá trình phát triển
          </p>

          <h2 className="mt-3 text-4xl font-bold text-slate-900">
            Hành trình xây dựng Auto Wash Pro
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {milestones.map((item) => (
              <div
                key={item.year}
                className="rounded-3xl bg-white p-7 shadow transition hover:-translate-y-1 hover:shadow-lg"
              >
                <p className="text-3xl font-bold text-sky-600">{item.year}</p>

                <h3 className="mt-3 text-xl font-bold text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-3 leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Branches */}
        <section className="bg-slate-900 px-6 py-16 text-white">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-sky-300">
              Hệ thống chi nhánh
            </p>

            <h2 className="mt-3 text-4xl font-bold">
              Các chi nhánh của Auto Wash Pro
            </h2>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {branches.map((branch, index) => (
                <div
                  key={branch}
                  className="rounded-2xl border border-white/10 bg-white/10 p-6"
                >
                  <p className="text-lg font-bold text-sky-300">
                    Chi nhánh {index + 1}
                  </p>

                  <p className="mt-3 leading-relaxed text-slate-200">
                    📍 {branch}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default AboutPage;