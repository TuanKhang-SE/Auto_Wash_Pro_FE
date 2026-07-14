import axiosClient from "../api/axiosClient";

export interface DailyCashflowItem {
  date: string;
  cash: number;
  transfer: number;
  other: number;
  total: number;
}

export interface CashflowResponse {
  dailyData: DailyCashflowItem[];
  summary: {
    totalCash: number;
    totalTransfer: number;
    totalOther: number;
    total: number;
  };
}

export interface RevenueByBranch {
  branchId: number;
  branchName: string;
  totalRevenue: number;
  totalBookings: number;
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

    // Handle different response structures
    let data = response.data;
    if (data?.data !== undefined) data = data.data;
    if (Array.isArray(data)) return data as RevenueByBranch[];
    if (data?.success && Array.isArray(data?.data)) return data.data as RevenueByBranch[];
    return [];
  },

  async getBranchOverview(): Promise<BranchOverviewItem[]> {
    const response = await axiosClient.get("/api/dashboard/branch-overview", {
      headers: getAuthHeader(),
    });

    let data = response.data;
    if (data?.data !== undefined) data = data.data;
    if (!Array.isArray(data)) {
      if (data?.success && Array.isArray(data?.data)) return data.data as BranchOverviewItem[];
      throw new Error(data?.message || "Không lấy được dữ liệu tổng quan chi nhánh");
    }
    return data as BranchOverviewItem[];
  },
};

export default revenueService;
