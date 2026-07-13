import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Gift, LoaderCircle, Sparkles, TicketPercent } from "lucide-react";
import Navbar from "../../components/Navbar";
import axiosClient, { getErrorMessage } from "../../api/axiosClient";

type Reward = {
  RewardID: number;
  RewardName: string;
  RequiredPoints: number;
  DiscountValue: number | string | null;
  ValidDays: number | null;
  Status?: string | null;
  isMock?: boolean;
};

const mockRewards: Reward[] = [
  { RewardID: -1, RewardName: "Voucher giảm 20.000đ", RequiredPoints: 100, DiscountValue: 20000, ValidDays: 30, isMock: true },
  { RewardID: -2, RewardName: "Voucher giảm 50.000đ", RequiredPoints: 220, DiscountValue: 50000, ValidDays: 30, isMock: true },
  { RewardID: -3, RewardName: "Voucher giảm 100.000đ", RequiredPoints: 400, DiscountValue: 100000, ValidDays: 45, isMock: true },
];

function formatMoney(value: number | string | null | undefined) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

const RewardExchange = () => {
  const navigate = useNavigate();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      try {
        setLoading(true);
        setError("");
        const [profileResponse, rewardResponse] = await Promise.all([
          axiosClient.get("/api/customers/profile", { headers }),
          axiosClient.get("/api/rewards?status=Active"),
        ]);

        setCurrentPoints(
          Number(profileResponse.data?.data?.LoyaltyAccounts?.[0]?.CurrentPoints || 0),
        );
        const configuredRewards = Array.isArray(rewardResponse.data?.data)
          ? rewardResponse.data.data
          : [];
        setUsingMock(configuredRewards.length === 0);
        setRewards(configuredRewards.length > 0 ? configuredRewards : mockRewards);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate]);

  async function redeem(reward: Reward) {
    if (reward.isMock) {
      setError("Đây là phần thưởng mẫu. Admin cần tạo reward thật trước khi có thể đổi.");
      return;
    }

    if (currentPoints < reward.RequiredPoints) {
      setError(`Bạn còn thiếu ${reward.RequiredPoints - currentPoints} điểm để đổi phần thưởng này.`);
      return;
    }

    if (!window.confirm(`Dùng ${reward.RequiredPoints} điểm để đổi “${reward.RewardName}”?`)) return;

    const token = localStorage.getItem("token");
    try {
      setRedeemingId(reward.RewardID);
      setError("");
      setMessage("");
      await axiosClient.post(
        "/api/rewards/redeem",
        { RewardID: reward.RewardID },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCurrentPoints((points) => points - reward.RequiredPoints);
      setMessage("Đổi thưởng thành công. Voucher đã được thêm vào Mã giảm giá của tôi.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setRedeemingId(null);
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <Link to="/customer/points" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
              <ArrowLeft size={16} /> Quay lại điểm thành viên
            </Link>
            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-300">Kho phần thưởng</p>
                <h1 className="mt-2 text-4xl font-black">Đổi điểm lấy ưu đãi</h1>
                <p className="mt-3 text-slate-300">Dùng điểm tích lũy để nhận voucher giảm giá cho lần rửa xe tiếp theo.</p>
              </div>
              <div className="rounded-2xl border border-sky-400/30 bg-sky-400/10 px-5 py-4">
                <p className="text-sm text-sky-200">Điểm khả dụng</p>
                <p className="mt-1 text-3xl font-black">{currentPoints.toLocaleString("vi-VN")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-8">
          {usingMock && !loading && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Admin chưa cấu hình phần thưởng. Các voucher bên dưới là dữ liệu mẫu và chưa thể đổi thật.
            </div>
          )}
          {message && <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 size={18} />{message}</div>}
          {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          {loading ? (
            <div className="flex justify-center gap-3 py-24 text-slate-500"><LoaderCircle className="animate-spin" /> Đang tải phần thưởng...</div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {rewards.map((reward) => {
                const enoughPoints = currentPoints >= reward.RequiredPoints;
                return (
                  <article key={reward.RewardID} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-br from-sky-600 to-indigo-700 p-6 text-white">
                      <div className="flex items-start justify-between"><TicketPercent size={32} /><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{reward.ValidDays || 30} ngày</span></div>
                      <p className="mt-6 text-sm text-sky-100">Giá trị ưu đãi</p>
                      <p className="mt-1 text-3xl font-black">{formatMoney(reward.DiscountValue)}</p>
                    </div>
                    <div className="p-5">
                      <h2 className="text-lg font-bold text-slate-800">{reward.RewardName}</h2>
                      <div className="mt-4 flex items-center gap-2 text-slate-600"><Sparkles size={18} className="text-amber-500" /><strong>{reward.RequiredPoints.toLocaleString("vi-VN")} điểm</strong></div>
                      <button
                        type="button"
                        onClick={() => redeem(reward)}
                        disabled={redeemingId !== null || reward.isMock}
                        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition ${
                          reward.isMock
                            ? "cursor-not-allowed bg-slate-100 text-slate-400"
                            : enoughPoints
                              ? "bg-sky-600 text-white hover:bg-sky-700"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {redeemingId === reward.RewardID ? <LoaderCircle size={18} className="animate-spin" /> : <Gift size={18} />}
                        {reward.isMock ? "Phần thưởng mẫu" : enoughPoints ? "Đổi ngay" : "Chưa đủ điểm"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link to="/customer/vouchers" className="font-semibold text-sky-700 hover:text-sky-800">Xem mã giảm giá của tôi →</Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default RewardExchange;
