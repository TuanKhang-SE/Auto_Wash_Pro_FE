import axiosClient from "../api/axiosClient";
import { type TierConfig } from "./tierConfigService";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface CustomerDetail {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  loyalty: {
    accountId: number | null;
    currentPoints: number;
    lifetimePoints: number;
    tierId: number | null;
    tierName: string;
    tierConfig: TierConfig | null;
  };
}

const customerService = {
  async getAllCustomers(): Promise<CustomerDetail[]> {
    const response = await axiosClient.get("/api/users", {
      headers: getAuthHeader(),
      params: { Role: "Customer" },
    });

    if (!response.data?.success || !Array.isArray(response.data.data)) {
      return [];
    }

    return response.data.data.map((user: Record<string, unknown>) => ({
      userId: user.UserID as number,
      fullName: (user.FullName as string) || "Không rõ",
      email: (user.Email as string) || "Chưa cập nhật",
      phone: (user.Phone as string) || "Chưa cập nhật",
      status: (user.Status as string) || "Unknown",
      createdAt: (user.CreatedAt as string) || "",
      loyalty: {
        accountId: null,
        currentPoints: 0,
        lifetimePoints: 0,
        tierId: null,
        tierName: "Chưa có hạng",
        tierConfig: null,
      },
    }));
  },
};

export default customerService;
