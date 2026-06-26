import axiosClient from "../api/axiosClient";

export type BranchStatus = "Active" | "Inactive";

export interface Branch {
  BranchID: number;
  BranchName: string;
  Address: string | null;
  Phone: string | null;
  OpenTime: string | null;
  CloseTime: string | null;
  BankAccount: string | null;
  Status: BranchStatus;
}

export interface CreateBranchPayload {
  BranchName: string;
  Address?: string;
  Phone?: string;
  OpenTime?: string;
  CloseTime?: string;
  BankAccount?: string;
  Status?: BranchStatus;
}

export interface UpdateBranchPayload {
  BranchName?: string;
  Address?: string | null;
  Phone?: string | null;
  OpenTime?: string | null;
  CloseTime?: string | null;
  BankAccount?: string | null;
  Status?: BranchStatus;
}

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const timeToIso = (time: string): string => {
  return `1970-01-01T${time}:00.000Z`;
};

const branchService = {
  async getAllBranches(): Promise<Branch[]> {
    const response = await axiosClient.get("/api/branches", {
      headers: getAuthHeader(),
    });
    if (response.data?.success && Array.isArray(response.data.data)) {
      return response.data.data as Branch[];
    }
    return [];
  },

  async getBranchById(id: number): Promise<Branch | null> {
    const response = await axiosClient.get(`/api/branches/${id}`, {
      headers: getAuthHeader(),
    });
    if (response.data?.success) {
      return response.data.data as Branch;
    }
    return null;
  },

  async createBranch(payload: CreateBranchPayload): Promise<Branch> {
    const body = { ...payload };
    if (body.OpenTime) body.OpenTime = timeToIso(body.OpenTime);
    if (body.CloseTime) body.CloseTime = timeToIso(body.CloseTime);
    const response = await axiosClient.post("/api/branches", body, {
      headers: getAuthHeader(),
    });
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Tạo chi nhánh thất bại");
    }
    return response.data.data as Branch;
  },

  async updateBranch(id: number, payload: UpdateBranchPayload): Promise<Branch> { // PUT /api/branches/:id - Cập nhật chi nhánh (AdminBranches)
    const body = { ...payload };
    if (body.OpenTime) body.OpenTime = timeToIso(body.OpenTime);
    if (body.CloseTime) body.CloseTime = timeToIso(body.CloseTime);
    const response = await axiosClient.put(`/api/branches/${id}`, body, {
      headers: getAuthHeader(),
    });
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Cập nhật chi nhánh thất bại");
    }
    return response.data.data as Branch;
  },

  async deleteBranch(id: number): Promise<void> { // DELETE /api/branches/:id - Xóa chi nhánh (AdminBranches)
    const response = await axiosClient.delete(`/api/branches/${id}`, {
      headers: getAuthHeader(),
    });
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Xóa chi nhánh thất bại");
    }
  },
};

export default branchService;
