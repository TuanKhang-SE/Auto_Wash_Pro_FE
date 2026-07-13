import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  Crown,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import axiosClient, { getErrorMessage } from "../../api/axiosClient";

type TierConfig = {
  TierID: number;
  TierName: string;
  MinSpent: number | string | null;
  DiscountPercent: number | string | null;
  PointMultiplier: number | string | null;
  Status?: string | null;
};

type LoyaltyAccount = {
  AccountID: number;
  CurrentPoints: number | null;
  LifetimePoints: number | null;
  tier_configs?: TierConfig | null;
};

type CustomerProfile = {
  TotalSpent?: number | string | null;
  TotalVisits?: number | null;
  LoyaltyAccounts?: LoyaltyAccount[];
};

function formatMoney(value: number | string | null | undefined) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function formatNumber(value: number | null | undefined) {
  return Number(value || 0).toLocaleString("vi-VN");
}

const MembershipPoints = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMembership() {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      try {
        setLoading(true);
        setError("");
        const [profileResponse, tierResponse] = await Promise.all([
          axiosClient.get("/api/customers/profile", { headers }),
          axiosClient.get("/api/tier-configs", { headers }),
        ]);

        setProfile(profileResponse.data?.data || null);
        setTiers(Array.isArray(tierResponse.data?.data) ? tierResponse.data.data : []);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    }

    loadMembership();
  }, [navigate]);

  const account = profile?.LoyaltyAccounts?.[0];
  const currentTier = account?.tier_configs;
  const totalSpent = Number(profile?.TotalSpent || 0);
  const currentPoints = Number(account?.CurrentPoints || 0);
  const lifetimePoints = Number(account?.LifetimePoints || 0);

  const activeTiers = useMemo(
    () =>
      tiers
        .filter((tier) => tier.Status !== "Inactive")
        .sort((left, right) => Number(left.MinSpent || 0) - Number(right.MinSpent || 0)),
    [tiers],
  );

  const nextTier = activeTiers.find(
    (tier) => Number(tier.MinSpent || 0) > totalSpent,
  );
  const currentTierMinimum = Number(currentTier?.MinSpent || 0);
  const nextTierMinimum = Number(nextTier?.MinSpent || 0);
  const progress = nextTier
    ? Math.min(
        100,
        Math.max(
          0,
          ((totalSpent - currentTierMinimum) /
            Math.max(1, nextTierMinimum - currentTierMinimum)) *
            100,
        ),
      )
    : 100;
  const amountToNextTier = Math.max(0, nextTierMinimum - totalSpent);
  const tierName = currentTier?.TierName || "Thành viên";
  const multiplier = Number(currentTier?.PointMultiplier || 1);
  const discountPercent = Number(currentTier?.DiscountPercent || 0);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f7f7fb] text-slate-900">
        <section className="bg-[#020617] text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-sky-300">
                Bảng điểm thành viên
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">
                Điểm của tôi
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Theo dõi điểm thưởng, hạng thành viên và tổng chi tiêu của bạn trên một màn hình tổng quan.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-700 bg-slate-800/70 px-5 py-2.5 text-sm font-semibold">
              <ShieldCheck size={18} className="text-sky-300" />
              Hạng hiện tại: {tierName}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-8">
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl bg-white py-24 text-slate-500 shadow-sm">
              <LoaderCircle className="animate-spin text-sky-600" />
              Đang tải thông tin thành viên...
            </div>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
                <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                        Thẻ thành viên
                      </p>
                      <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
                        {tierName}
                      </h2>
                    </div>
                    <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                      <ShieldCheck size={28} />
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl bg-slate-100 px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      Thông tin thành viên
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      Tài khoản của bạn đang hoạt động bình thường
                    </p>
                  </div>

                  <div className="mt-7">
                    <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-3 flex justify-between text-sm text-slate-500">
                      <span>{formatMoney(totalSpent)} đã chi tiêu</span>
                      <span>
                        {nextTier
                          ? `Mốc ${nextTier.TierName}: ${formatMoney(nextTier.MinSpent)}`
                          : "Đã đạt hạng cao nhất"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {nextTier
                        ? `Chi tiêu thêm ${formatMoney(amountToNextTier)} để lên hạng ${nextTier.TierName}.`
                        : "Bạn đã đạt hạng thành viên cao nhất hiện tại."}
                    </p>
                  </div>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                      Hệ số tích điểm: <strong className="text-slate-900">x{multiplier}</strong>
                    </div>
                    <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                      Ưu đãi hạng: <strong className="text-slate-900">giảm {discountPercent}%</strong>
                    </div>
                  </div>
                </article>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <WalletCards size={19} className="text-sky-700" /> Tổng chi tiêu
                    </div>
                    <p className="mt-3 text-2xl font-black">{formatMoney(totalSpent)}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Sparkles size={19} className="text-sky-700" /> Điểm thưởng hiện có
                    </div>
                    <p className="mt-3 text-2xl font-black">{formatNumber(currentPoints)}</p>
                    <Link
                      to="/customer/rewards"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-800"
                    >
                      Sử dụng điểm ngay <ArrowRight size={13} />
                    </Link>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <ShieldCheck size={19} className="text-sky-700" /> Hạng thành viên
                    </div>
                    <p className="mt-3 text-2xl font-black">{tierName}</p>
                  </div>

                  <Link
                    to="/customer/bookings"
                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:shadow-md"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        Lịch sử giao dịch
                      </p>
                      <p className="mt-2 font-semibold text-slate-800">Xem lịch hẹn của bạn</p>
                    </div>
                    <ArrowRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-sky-600" />
                  </Link>

                  <Link
                    to="/customer/vouchers"
                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:shadow-md"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        Ví ưu đãi
                      </p>
                      <p className="mt-2 font-semibold text-slate-800">Mã giảm giá của tôi</p>
                    </div>
                    <ArrowRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-sky-600" />
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-slate-500"><Sparkles size={18} className="text-sky-700" /> Điểm hiện có</div>
                  <p className="mt-3 text-2xl font-black">{formatNumber(currentPoints)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-slate-500"><TrendingUp size={18} className="text-sky-700" /> Tổng điểm tích lũy</div>
                  <p className="mt-3 text-2xl font-black">{formatNumber(lifetimePoints)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-slate-500"><Crown size={18} className="text-sky-700" /> Hệ số tích điểm</div>
                  <p className="mt-3 text-2xl font-black">x{multiplier}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Link to="/customer/bookings" className="flex items-center gap-4 rounded-2xl bg-slate-900 p-5 text-white transition hover:bg-slate-800">
                  <CalendarDays className="text-sky-300" />
                  <div><p className="font-bold">Lịch hẹn của tôi</p><p className="text-sm text-slate-400">Xem các lần đặt và thanh toán</p></div>
                </Link>
                <Link to="/booking" className="flex items-center gap-4 rounded-2xl bg-sky-600 p-5 text-white transition hover:bg-sky-700">
                  <CircleDollarSign className="text-sky-100" />
                  <div><p className="font-bold">Tích thêm điểm</p><p className="text-sm text-sky-100">Đặt lịch rửa xe mới ngay hôm nay</p></div>
                </Link>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
};

export default MembershipPoints;
