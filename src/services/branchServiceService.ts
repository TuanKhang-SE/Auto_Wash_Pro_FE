import axiosClient from "../api/axiosClient";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type BranchServiceStatus = "Active" | "Inactive";

export interface BranchService {
  BranchServiceID: number;
  BranchID: number;
  ServiceID: number;
  PriceOverride: number | string | null;
  Status: BranchServiceStatus | string;
  CreateAt?: string;
  ServiceName?: string;
  Description?: string | null;
  ImageURL?: string | null;
  BasePrice?: number | string;
  DurationMinutes?: number;
  Duration?: number;
  BranchName?: string;
}

export interface AddServiceToBranchPayload {
  ServiceID: number;
  PriceOverride?: number | null;
  Status?: BranchServiceStatus;
}

export interface UpdateBranchServicePayload {
  PriceOverride?: number | null;
  Status?: BranchServiceStatus;
}

const unwrapData = <T>(response: { data?: { success?: boolean; data?: T } }): T | null => {
  if (response.data?.success) {
    return (response.data.data ?? null) as T | null;
  }
  return null;
};

// branchServiceService là service để quản lý dịch vụ của chi nhánh
const branchServiceService = {
  async getServicesByBranch(branchId: number): Promise<BranchService[]> {
    // GET /api/branch-services?BranchID=X - Lấy danh sách services đã gán cho 1 chi nhánh
    const response = await axiosClient.get(
      `/api/branch-services`,
      { params: { BranchID: branchId }, headers: getAuthHeader() }
    );
    const data = unwrapData<BranchService[]>(response);
    return Array.isArray(data) ? data : [];
  },

  async addServiceToBranch(
    branchId: number,
    payload: AddServiceToBranchPayload
  ): Promise<BranchService> {
    // POST /api/branch-services - Manager/Admin gán 1 service vào chi nhánh
    const response = await axiosClient.post(
      `/api/branch-services`,
      {
        BranchID: branchId,
        ServiceID: payload.ServiceID,
        PriceOverride: payload.PriceOverride ?? null,
        Status: payload.Status ?? "Active",
      },
      { headers: getAuthHeader() }
    );
    if (!response.data?.success) {
      throw new Error(
        response.data?.message || "Thêm dịch vụ vào chi nhánh thất bại"
      );
    }
    return response.data.data as BranchService;
  },

  async updateBranchService(
    branchServiceId: number,
    payload: UpdateBranchServicePayload
  ): Promise<BranchService> {
    // PUT /api/branch-services/:branchServiceId - Manager cập nhật (PriceOverride, Status)
    const response = await axiosClient.put(
      `/api/branch-services/${branchServiceId}`,
      payload,
      { headers: getAuthHeader() }
    );
    if (!response.data?.success) {
      throw new Error(
        response.data?.message || "Cập nhật dịch vụ chi nhánh thất bại"
      );
    }
    return response.data.data as BranchService;
  },

  async removeBranchService(branchServiceId: number): Promise<void> {
    // DELETE /api/branch-services/:branchServiceId - Manager gỡ service khỏi chi nhánh
    const response = await axiosClient.delete(
      `/api/branch-services/${branchServiceId}`,
      { headers: getAuthHeader() }
    );
    if (!response.data?.success) {
      throw new Error(
        response.data?.message || "Gỡ dịch vụ khỏi chi nhánh thất bại"
      );
    }
  },
};

export default branchServiceService;
