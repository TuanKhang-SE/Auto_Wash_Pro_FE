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
    const response = await axiosClient.get("/api/customers", {
      headers: getAuthHeader(),
    });

    if (!response.data?.success || !Array.isArray(response.data.data)) {
      throw new Error(response.data?.message || "Không lấy được danh sách khách hàng");
    }

    return response.data.data as CustomerDetail[];
  },
};

export default customerService;
