import axiosClient from "../api/axiosClient";

export type UserRole = "Staff" | "Manager" | "Admin" | "Customer";
export type UserStatus = "Active" | "Inactive";

export interface ApiBranch {
  BranchID: number;
  BranchName: string;
}

export interface User {
  UserID: number;
  FullName: string;
  Phone: string | null;
  Email: string | null;
  BranchID: number | null;
  Role: UserRole;
  Status: UserStatus;
  CreatedAt: string;
  UpdatedAt: string;
  branches?: ApiBranch | null;
}

export interface CreateUserPayload {
  FullName: string;
  Password: string;
  Role: "Staff" | "Manager" | "Admin";
  Phone?: string;
  Email?: string;
  BranchID?: number;
}

export interface UpdateUserPayload {
  FullName?: string;
  Password?: string;
  Phone?: string;
  Email?: string;
  Role?: "Staff" | "Manager" | "Admin";
  BranchID?: number | null;
  Status?: UserStatus;
}

export interface UserListParams {
  Role?: UserRole;
  BranchID?: number;
  Status?: UserStatus;
}

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const userService = {
  async getAllUsers(params: UserListParams = {}): Promise<User[]> {
    const response = await axiosClient.get("/api/users", {   //GET /api/users - Lấy danh sách người dùng (AdminStaffManagement, ManagerStaffManagement)
      params,
      headers: getAuthHeader(),
    });
    if (response.data?.success && Array.isArray(response.data.data)) {
      return response.data.data as User[];
    }
    return [];
  },

  async getUserById(id: number): Promise<User | null> {
    const response = await axiosClient.get(`/api/users/${id}`, {   //GET /api/users/:id - Lấy thông tin người dùng theo id (AdminStaffManagement, ManagerStaffManagement)
      headers: getAuthHeader(),
    });
    if (response.data?.success) {
      return response.data.data as User;
    }
    return null;
  },

  async createUser(payload: CreateUserPayload): Promise<User> {
    const response = await axiosClient.post("/api/users", payload, {
      headers: getAuthHeader(),
    });
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Tạo tài khoản thất bại");
    }
    return response.data.data as User;
  },

  async updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
    const response = await axiosClient.put(`/api/users/${id}`, payload, {
      headers: getAuthHeader(),
    });
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Cập nhật thất bại");
    }
    return response.data.data as User;
  },

  async deleteUser(id: number): Promise<void> {
    const response = await axiosClient.delete(`/api/users/${id}`, {
      headers: getAuthHeader(),
    });
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Xóa thất bại");
    }
  },
};

export default userService;