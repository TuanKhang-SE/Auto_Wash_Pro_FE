import axiosClient from "../api/axiosClient";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type PromotionStatus = "Active" | "Inactive";

export interface Promotion {
  PromotionID: number;
  BranchID: number | null;
  PromotionName: string;
  DiscountType: DiscountType;
  DiscountValue: number | string;
  StartDate: string | null;
  EndDate: string | null;
  UsageLimit: number | null;
  Status: PromotionStatus | string;
}

export interface CreatePromotionPayload {
  PromotionName: string;
  DiscountType: DiscountType;
  DiscountValue: number;
  StartDate?: string | null;
  EndDate?: string | null;
  UsageLimit?: number | null;
  BranchID?: number | null;
}

export interface UpdatePromotionPayload {
  PromotionName?: string;
  DiscountType?: DiscountType;
  DiscountValue?: number;
  StartDate?: string | null;
  EndDate?: string | null;
  UsageLimit?: number | null;
  BranchID?: number | null;
  Status?: PromotionStatus;
}

const unwrapData = <T>(
  response: { data?: { success?: boolean; data?: T } }
): T | null => {
  if (response.data?.success) {
    return (response.data.data ?? null) as T | null;
  }
  return null;
};

const promotionService = {
  async getAllPromotions(): Promise<Promotion[]> {
    // GET /api/promotions - Lấy tất cả khuyến mãi (Admin/Manager)
    const response = await axiosClient.get("/api/promotions", {
      headers: getAuthHeader(),
    });
    const data = unwrapData<Promotion[]>(response);
    return Array.isArray(data) ? data : [];
  },

  async getActivePromotions(): Promise<Promotion[]> {
    // GET /api/promotions/active - Khuyến mãi đang chạy (Public)
    const response = await axiosClient.get("/api/promotions/active");
    const data = unwrapData<Promotion[]>(response);
    return Array.isArray(data) ? data : [];
  },

  async getPromotionById(id: number): Promise<Promotion | null> {
    // GET /api/promotions/:id
    const response = await axiosClient.get(`/api/promotions/${id}`, {
      headers: getAuthHeader(),
    });
    return unwrapData<Promotion>(response);
  },

  async createPromotion(payload: CreatePromotionPayload): Promise<Promotion> {
    // POST /api/promotions - Admin/Manager tạo khuyến mãi
    const response = await axiosClient.post("/api/promotions", payload, {
      headers: getAuthHeader(),
    });
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Tạo khuyến mãi thất bại");
    }
    return response.data.data as Promotion;
  },

  async updatePromotion(
    id: number,
    payload: UpdatePromotionPayload
  ): Promise<Promotion> {
    // PUT /api/promotions/:id - Admin/Manager cập nhật khuyến mãi
    const response = await axiosClient.put(`/api/promotions/${id}`, payload, {
      headers: getAuthHeader(),
    });
    if (!response.data?.success) {
      throw new Error(
        response.data?.message || "Cập nhật khuyến mãi thất bại"
      );
    }
    return response.data.data as Promotion;
  },

  async deletePromotion(id: number): Promise<void> {
    // DELETE /api/promotions/:id - Tạm ngưng (xóa mềm) khuyến mãi
    const response = await axiosClient.delete(`/api/promotions/${id}`, {
      headers: getAuthHeader(),
    });
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Tạm ngưng khuyến mãi thất bại");
    }
  },
};

export default promotionService;