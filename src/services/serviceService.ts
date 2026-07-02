import axiosClient from "../api/axiosClient";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type ServiceStatus = "Active" | "Inactive";

export interface Service {
  ServiceID: number;
  ServiceName: string;
  Description: string | null;
  BasePrice?: number | string;
  Price?: number | string;
  DurationMinutes?: number;
  Duration?: number;
  ImageURL?: string | null;
  Type?: string | null;
  Status: ServiceStatus | string;
  CreateAt?: string;
  UpdateAt?: string;
}

export interface CreateServicePayload {
  ServiceName: string;
  BasePrice: number;
  Description?: string | null;
  DurationMinutes?: number;
  Type?: string;
  ImageURL?: string | null;
  Status?: ServiceStatus;
}

export interface UpdateServicePayload {
  ServiceName?: string;
  BasePrice?: number;
  Description?: string | null;
  DurationMinutes?: number;
  Type?: string;
  ImageURL?: string | null;
  Status?: ServiceStatus;
}

const unwrapData = <T>(response: { data?: { success?: boolean; data?: T } }): T | null => {
  if (response.data?.success) {
    return (response.data.data ?? null) as T | null;
  }
  return null;
};

const serviceService = {
  async getAllServices(): Promise<Service[]> {
    // GET /api/services - Lấy danh sách tất cả services (Admin)
    const response = await axiosClient.get("/api/services", {
      headers: getAuthHeader(),
    });
    const data = unwrapData<Service[]>(response);
    return Array.isArray(data) ? data : [];
  },

  async getServiceById(id: number): Promise<Service | null> {
    // GET /api/services/:id
    const response = await axiosClient.get(`/api/services/${id}`, {
      headers: getAuthHeader(),
    });
    return unwrapData<Service>(response);
  },

  async getPublicServices(): Promise<Service[]> {
    // GET /api/services/public - danh sách services active (public)
    const response = await axiosClient.get("/api/services/public");
    const data = response.data?.data ?? response.data;
    return Array.isArray(data) ? (data as Service[]) : [];
  },

  async createService(payload: CreateServicePayload): Promise<Service> {
    // POST /api/services - Admin tạo service mới
    const response = await axiosClient.post("/api/services", payload, {
      headers: getAuthHeader(),
    });
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Tạo dịch vụ thất bại");
    }
    return response.data.data as Service;
  },

  async updateService(
    id: number,
    payload: UpdateServicePayload
  ): Promise<Service> {
    // PUT /api/services/:id - Admin cập nhật service
    const response = await axiosClient.put(`/api/services/${id}`, payload, {
      headers: getAuthHeader(),
    });
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Cập nhật dịch vụ thất bại");
    }
    return response.data.data as Service;
  },

  async deleteService(id: number): Promise<void> {
    // DELETE /api/services/:id - Admin xóa service
    const response = await axiosClient.delete(`/api/services/${id}`, {
      headers: getAuthHeader(),
    });
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Xóa dịch vụ thất bại");
    }
  },
};

export default serviceService;
