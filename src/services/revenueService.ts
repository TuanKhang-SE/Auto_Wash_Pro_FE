import axiosClient from "../api/axiosClient";

export interface DailyCashflowItem {
  date: string;
  cash: number;
  transfer: number;
  total: number;
}

export interface CashflowResponse {
  dailyData: DailyCashflowItem[];
  summary: {
    totalCash: number;
    totalTransfer: number;
    total: number;
  };
}

export interface RevenueByBranch {
  branchId?: number;
  BranchID?: number;
  branchName?: string;
  BranchName?: string;
  totalRevenue?: number;
  TotalRevenue?: number;
  totalBookings?: number;
  TotalBookings?: number;
}

export interface RevenueQuery {
  BranchID?: number;
  StartDate?: string;
  EndDate?: string;
}

export interface BranchOverviewItem {
  branchId?: number;
  BranchID?: number;
  branchName?: string;
  BranchName?: string;
  totalStaff?: number;
  TotalStaff?: number;
  todayBookings?: number;
  TodayBookings?: number;
  monthBookings?: number;
  MonthBookings?: number;
  revenue?: number;
  Revenue?: number;
  rating?: number;
  reviewCount?: number;
  occupancy?: number;
  Occupancy?: number;
}

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const revenueService = {
  async getDailyCashflow(query: RevenueQuery = {}): Promise<CashflowResponse> {
    const params: Record<string, string> = {};
    if (query.BranchID !== undefined) params.branchId = String(query.BranchID);
    if (query.StartDate) params.startDate = query.StartDate;
    if (query.EndDate) params.endDate = query.EndDate;

    const response = await axiosClient.get("/api/dashboard/daily-cashflow", {
      headers: getAuthHeader(),
      params,
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Không lấy được dữ liệu doanh thu");
    }

    return response.data.data as CashflowResponse;
  },

  async getRevenueByBranch(query: RevenueQuery = {}): Promise<RevenueByBranch[]> {
    const params: Record<string, string> = {};
    if (query.StartDate) params.startDate = query.StartDate;
    if (query.EndDate) params.endDate = query.EndDate;

    const response = await axiosClient.get("/api/dashboard/revenue-by-branch", {
      headers: getAuthHeader(),
      params,
    });

    // Handle: {success: true, data: {branches: [...]}} - extract branches array
    let data = response.data;
    if (data?.data) {
      // Check if data.data has branches array
      if (Array.isArray(data.data)) {
        return data.data as RevenueByBranch[];
      }
      // Check if data.data has branches property
      if (data.data.branches && Array.isArray(data.data.branches)) {
        return data.data.branches as RevenueByBranch[];
      }
    }
    if (Array.isArray(data)) return data as RevenueByBranch[];
    return [];
  },

  async getBranchOverview(): Promise<BranchOverviewItem[]> {
    const response = await axiosClient.get("/api/dashboard/branch-overview", {
      headers: getAuthHeader(),
    });

    // Handle: {success: true, data: {branches: [...]}} OR {success: true, data: [...]}
    let data = response.data;
    if (data?.data) {
      if (Array.isArray(data.data)) return data.data as BranchOverviewItem[];
      if (data.data.branches && Array.isArray(data.data.branches)) return data.data.branches as BranchOverviewItem[];
    }
    if (Array.isArray(data)) return data as BranchOverviewItem[];
    throw new Error(data?.message || "Không lấy được dữ liệu tổng quan chi nhánh");
  },
};

export default revenueService;
