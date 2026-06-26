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

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const revenueService = {
  async getDailyCashflow(query: RevenueQuery = {}): Promise<CashflowResponse> {
    const params: Record<string, string> = {};
    if (query.BranchID !== undefined) params.BranchID = String(query.BranchID);
    if (query.StartDate) params.StartDate = query.StartDate;
    if (query.EndDate) params.EndDate = query.EndDate;

    const response = await axiosClient.get("/api/dashboard/daily-cashflow", {
      headers: getAuthHeader(),
      params,
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Không lấy được dữ liệu doanh thu");
    }

    return response.data.data as CashflowResponse;
  },
};

export default revenueService;
