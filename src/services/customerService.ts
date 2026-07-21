import axiosClient from "../api/axiosClient";
import { type TierConfig } from "./tierConfigService";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// CustomerDetail là interface để lấy dữ liệu từ API
export interface CustomerDetail {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  loyalty?: {
    accountId: number | null;
    currentPoints: number;
    lifetimePoints: number;
    tierId: number | null;
    tierName: string;
    tierConfig: TierConfig | null;
  };
}

// RawUser là interface để lấy dữ liệu từ API
interface RawUser {
  UserID?: number;
  userId?: number;
  id?: number;
  FullName?: string;
  fullName?: string;
  name?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  Email?: string;
  email?: string;
  Phone?: string;
  phone?: string;
  phoneNumber?: string;
  telephone?: string;
  Status?: string;
  status?: string;
  Role?: string;
  role?: string;
  CreatedAt?: string;
  createdAt?: string;
  created?: string;
  loyalty?: CustomerDetail["loyalty"];
}

function pickVal<T = string>(...vals: (T | undefined | null)[]): T | undefined {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

const customerService = {
  async getAllCustomers(): Promise<CustomerDetail[]> {
    const response = await axiosClient.get("/api/users", {
      headers: getAuthHeader(),
      params: { Role: "Customer" },
    });

    let data = response.data;
    if (data?.data) data = data.data;
    if (!Array.isArray(data)) {
      console.warn("[customerService] Response is not an array:", data);
      return [];
    }

    const normalized: CustomerDetail[] = (data as RawUser[]).map((u) => {
      const uid = Number(pickVal(u.UserID, u.userId, u.id) ?? 0);
      const fullName = pickVal(u.FullName, u.fullName, u.name, u.username) || "Unknown";
      const firstName = pickVal(u.firstName, "");
      const lastName = pickVal(u.lastName, "");
      const finalName = fullName !== "Unknown"
        ? fullName
        : `${firstName} ${lastName}`.trim() || "Unknown";

      return {
        userId: uid,
        fullName: finalName,
        email: pickVal(u.Email, u.email) || "",
        phone: pickVal(u.Phone, u.phone, u.phoneNumber, u.telephone) || "",
        status: pickVal(u.Status, u.status) || "Active",
        createdAt: pickVal(u.CreatedAt, u.createdAt, u.created) || new Date().toISOString(),
        loyalty: u.loyalty,
      };
    });

    return normalized;
  },
};

export default customerService;
