import axiosClient from "../api/axiosClient";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface TierConfig {
  TierID: number;
  TierName: string;
  MinSpent: number | string;
  DiscountPercent: number | string;
  PointMultiplier: number | string;
  Status: string;
  CreatedAt?: string;
  UpdateAt?: string;
}

export interface CreateTierConfigPayload {
  TierName: string;
  MinSpent?: number;
  DiscountPercent?: number;
  PointMultiplier?: number;
  Status?: string;
}

export interface UpdateTierConfigPayload {
  TierName?: string;
  MinSpent?: number;
  DiscountPercent?: number;
  PointMultiplier?: number;
  Status?: string;
}

const tierConfigService = {
  async getAllTierConfigs(): Promise<TierConfig[]> {
    const response = await axiosClient.get("/api/tier-configs", {
      headers: getAuthHeader(),
    });
    if (response.data?.success && Array.isArray(response.data.data)) {
      return response.data.data as TierConfig[];
    }
    return [];
  },

  async getTierConfigById(id: number): Promise<TierConfig | null> {
    const response = await axiosClient.get(`/api/tier-configs/${id}`, {
      headers: getAuthHeader(),
    });
    if (response.data?.success) {
      return response.data.data as TierConfig;
    }
    return null;
  },

  async createTierConfig(payload: CreateTierConfigPayload): Promise<TierConfig> {
    const response = await axiosClient.post("/api/tier-configs", payload, {
      headers: getAuthHeader(),
    });
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Tạo hạng thành viên thất bại");
    }
    return response.data.data as TierConfig;
  },

  async updateTierConfig(
    id: number,
    payload: UpdateTierConfigPayload
  ): Promise<TierConfig> {
    const response = await axiosClient.put(
      `/api/tier-configs/${id}`,
      payload,
      { headers: getAuthHeader() }
    );
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Cập nhật hạng thành viên thất bại");
    }
    return response.data.data as TierConfig;
  },

  async deleteTierConfig(id: number): Promise<void> {
    const response = await axiosClient.delete(`/api/tier-configs/${id}`, {
      headers: getAuthHeader(),
    });
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Xóa hạng thành viên thất bại");
    }
  },
};

export default tierConfigService;
