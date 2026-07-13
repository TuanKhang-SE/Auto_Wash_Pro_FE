import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Copy, Gift, LoaderCircle, TicketPercent } from "lucide-react";
import Navbar from "../../components/Navbar";
import axiosClient, { getErrorMessage } from "../../api/axiosClient";

const pageLoadedAt = Date.now();

type Redemption = {
  RedemptionID: number;
  RewardID: number;
  RedeemedAt?: string | null;
  Status?: string | null;
  Rewards?: {
    RewardName?: string | null;
    DiscountValue?: number | string | null;
    ValidDays?: number | null;
  } | null;
};

function formatMoney(value: number | string | null | undefined) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function voucherCode(redemption: Redemption) {
  return `AWP-${redemption.RewardID}-${String(redemption.RedemptionID).padStart(5, "0")}`;
}

function expirationDate(redemption: Redemption) {
  if (!redemption.RedeemedAt) return null;
  const date = new Date(redemption.RedeemedAt);
  date.setDate(date.getDate() + Number(redemption.Rewards?.ValidDays || 30));
  return date;
}

const MyVouchers = () => {
  const navigate = useNavigate();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    async function loadVouchers() {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      try {
        setLoading(true);
        const profileResponse = await axiosClient.get("/api/customers/profile", { headers });
        const customerId = profileResponse.data?.data?.CustomerID;
        if (!customerId) {
          setRedemptions([]);
          return;
        }

        const response = await axiosClient.get(`/api/rewards/customer/${customerId}`, { headers });
        setRedemptions(Array.isArray(response.data?.data) ? response.data.data : []);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    }

    loadVouchers();
  }, [navigate]);

  async function copyVoucher(redemption: Redemption) {
    try {
      await navigator.clipboard.writeText(voucherCode(redemption));
      setCopiedId(redemption.RedemptionID);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setError("Không thể sao chép mã. Vui lòng chọn và sao chép thủ công.");
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <button type="button" onClick={() => navigate(-1)} className="mb-4 text-sm font-semibold text-slate-500 hover:text-sky-600">
                ← Quay lại
              </button>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-sky-600">Ví ưu đãi</p>
              <h1 className="mt-2 text-3xl font-black text-slate-900">Mã giảm giá của tôi</h1>
              <p className="mt-2 text-slate-500">Các voucher bạn đã đổi bằng điểm thành viên.</p>
            </div>
            <Link to="/customer/rewards" className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-bold text-white hover:bg-sky-700">
              <Gift size={18} /> Đổi thêm ưu đãi
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-8">
          {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          {loading ? (
            <div className="flex justify-center gap-3 py-24 text-slate-500"><LoaderCircle className="animate-spin" /> Đang tải mã giảm giá...</div>
          ) : redemptions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
              <TicketPercent className="mx-auto text-slate-300" size={54} />
              <h2 className="mt-4 text-xl font-bold text-slate-800">Bạn chưa có mã giảm giá</h2>
              <p className="mt-2 text-slate-500">Dùng điểm thành viên để đổi voucher đầu tiên.</p>
              <Link to="/customer/rewards" className="mt-6 inline-block rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-800">Đi đến trang đổi thưởng</Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {redemptions.map((redemption) => {
                const expiresAt = expirationDate(redemption);
                const expired = expiresAt ? expiresAt.getTime() < pageLoadedAt : false;
                const available = redemption.Status === "UNUSED" && !expired;
                const code = voucherCode(redemption);

                return (
                  <article key={redemption.RedemptionID} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${available ? "border-sky-200" : "border-slate-200 opacity-70"}`}>
                    <div className="flex">
                      <div className={`flex w-32 shrink-0 flex-col items-center justify-center p-5 text-center text-white ${available ? "bg-gradient-to-b from-sky-600 to-indigo-700" : "bg-slate-500"}`}>
                        <TicketPercent size={30} />
                        <p className="mt-3 text-2xl font-black">{formatMoney(redemption.Rewards?.DiscountValue)}</p>
                      </div>
                      <div className="min-w-0 flex-1 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h2 className="font-bold text-slate-800">{redemption.Rewards?.RewardName || "Voucher Auto Wash Pro"}</h2>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${available ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {available ? "Có thể dùng" : expired ? "Hết hạn" : "Đã sử dụng"}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">Hạn dùng: {expiresAt ? expiresAt.toLocaleDateString("vi-VN") : "Không xác định"}</p>
                        <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2">
                          <code className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">{code}</code>
                          <button type="button" onClick={() => copyVoucher(redemption)} className="rounded-md p-1.5 text-sky-700 hover:bg-sky-100" aria-label="Sao chép mã">
                            {copiedId === redemption.RedemptionID ? <Check size={17} /> : <Copy size={17} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default MyVouchers;
