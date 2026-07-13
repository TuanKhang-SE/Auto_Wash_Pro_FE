import axiosClient from "../api/axiosClient";

export type RewardStatus = "Active" | "Inactive";

export interface Reward {
  RewardID: number;
  RewardName: string;
  RequiredPoints: number;
  DiscountValue: number | string | null;
  ValidDays: number | null;
  Status?: RewardStatus | string | null;
}

export interface RewardPayload {
  RewardName: string;
  RequiredPoints: number;
  DiscountValue?: number;
  ValidDays?: number;
  Status?: RewardStatus;
}

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const ok = <T>(res: { data?: { success?: boolean; data?: T; message?: string } }): T => {
  if (!res.data?.success) throw new Error(res.data?.message || "Lỗi");
  return res.data.data as T;
};

const rewardService = {
  async getAll(): Promise<Reward[]> {
    const res = await axiosClient.get("/api/rewards", { params: { status: "All" }, headers: getAuthHeader() });
    const data = ok<Reward[]>(res);
    return Array.isArray(data) ? data : [];
  },

  async getActive(): Promise<Reward[]> {
    const res = await axiosClient.get("/api/rewards", { params: { status: "Active" }, headers: getAuthHeader() });
    const data = ok<Reward[]>(res);
    return Array.isArray(data) ? data : [];
  },

  async create(payload: RewardPayload): Promise<Reward> {
    const res = await axiosClient.post("/api/rewards", payload, { headers: getAuthHeader() });
    return ok<Reward>(res);
  },

  async update(id: number, payload: Partial<RewardPayload>): Promise<Reward> {
    const res = await axiosClient.put(`/api/rewards/${id}`, payload, { headers: getAuthHeader() });
    return ok<Reward>(res);
  },
};

export default rewardService;