import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Gift, LoaderCircle, Sparkles, TicketPercent } from "lucide-react";
import Navbar from "../../components/Navbar";
import axiosClient, { getErrorMessage } from "../../api/axiosClient";
import rewardService from "../../services/rewardService";

type Reward = {
  RewardID: number;
  RewardName: string;
  RequiredPoints: number;
  DiscountValue: number | string | null;
  ValidDays: number | null;
  Status?: string | null;
};

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
          rewardService.getActive(),
        ]);

        setCurrentPoints(
          Number(profileResponse.data?.data?.LoyaltyAccounts?.[0]?.CurrentPoints || 0),
        );
        setRewards(Array.isArray(rewardResponse) ? rewardResponse : []);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate]);

  async function redeem(reward: Reward) {
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
      const response = await axiosClient.post(
        "/api/rewards/redeem",
        { RewardID: reward.RewardID },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const updatedPoints = response.data?.data?.updatedAccount?.CurrentPoints;
      setCurrentPoints(
        updatedPoints === undefined
          ? (points) => Math.max(0, points - reward.RequiredPoints)
          : Number(updatedPoints),
      );
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
          {message && <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 size={18} />{message}</div>}
          {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          {loading ? (
            <div className="flex justify-center gap-3 py-24 text-slate-500"><LoaderCircle className="animate-spin" /> Đang tải phần thưởng...</div>
          ) : rewards.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
              <Gift className="mx-auto text-slate-300" size={54} />
              <h2 className="mt-4 text-xl font-bold text-slate-800">Chưa có phần thưởng đang áp dụng</h2>
              <p className="mt-2 text-slate-500">Các reward do Admin kích hoạt sẽ xuất hiện tại đây.</p>
            </div>
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
                        disabled={redeemingId !== null || !enoughPoints}
                        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition ${
                          enoughPoints
                              ? "bg-sky-600 text-white hover:bg-sky-700"
                              : "cursor-not-allowed bg-slate-100 text-slate-500"
                        }`}
                      >
                        {redeemingId === reward.RewardID ? <LoaderCircle size={18} className="animate-spin" /> : <Gift size={18} />}
                        {enoughPoints ? "Đổi ngay" : "Chưa đủ điểm"}
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
