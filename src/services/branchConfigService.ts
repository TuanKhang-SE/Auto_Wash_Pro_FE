import axiosClient from "../api/axiosClient";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Schema thực tế của BE (bảng branch_configs – 1 dòng / 1 chi nhánh).
// Các trường đều optional trong upsert, chỉ BranchID là bắt buộc.
export interface BranchConfig {
  ConfigID: number;
  BranchID: number;
  SlotDuration: number | null;
  TotalWashBays: number | null;
  BufferMinutes: number | null;
  MaxCarsPerBooking: number | null;
  CancelWindowHours: number | null;
  UpdatedAt?: string | null;
  UpdatedBy?: string | null;
}

// Payload gửi lên POST /api/branch-configs (BE validate bằng zod).
// Tất cả các trường cấu hình đều optional; chỉ BranchID bắt buộc.
export interface UpsertBranchConfigPayload {
  BranchID: number;
  SlotDuration?: number;
  TotalWashBays?: number;
  BufferMinutes?: number;
  MaxCarsPerBooking?: number;
  CancelWindowHours?: number;
}

const branchConfigService = {
  // GET /api/branch-configs?BranchID=X → trả { data: { ... } } hoặc { data: {} }
  // nếu chi nhánh chưa có cấu hình nào.
  async getBranchConfigByBranch(branchID: number): Promise<BranchConfig | null> {
    const response = await axiosClient.get("/api/branch-configs", {
      params: { BranchID: branchID },
      headers: getAuthHeader(),
    });
    const data = response.data?.data;
    if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
      return null;
    }
    return data as BranchConfig;
  },

  // POST /api/branch-configs – upsert toàn bộ config của 1 chi nhánh.
  async upsertBranchConfig(
    payload: UpsertBranchConfigPayload
  ): Promise<BranchConfig | null> {
    const response = await axiosClient.post(
      "/api/branch-configs",
      payload,
      { headers: getAuthHeader() }
    );
    if (!response.data?.success) {
      throw new Error(
        response.data?.message || "Cập nhật cấu hình chi nhánh thất bại"
      );
    }
    return (response.data.data as BranchConfig) || null;
  },
};

export default branchConfigService;