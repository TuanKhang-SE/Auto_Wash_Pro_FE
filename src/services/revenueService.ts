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

export interface RevenueQuery {
  BranchID?: number;
  StartDate?: string;
  EndDate?: string;
}

export interface BranchOverviewItem {
  branchId: number;
  branchName: string;
  totalStaff: number;
  todayBookings: number;
  monthBookings: number;
  revenue: number;
  rating: number;
  reviewCount: number;
  occupancy: number;
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

  async getBranchOverview(): Promise<BranchOverviewItem[]> {
    const response = await axiosClient.get("/api/dashboard/branch-overview", {
      headers: getAuthHeader(),
    });

    if (!response.data?.success || !Array.isArray(response.data.data)) {
      throw new Error(response.data?.message || "Không lấy được dữ liệu tổng quan chi nhánh");
    }

    return response.data.data as BranchOverviewItem[];
  },
};

export default revenueService;
