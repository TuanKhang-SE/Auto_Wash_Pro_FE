import axiosClient from "../api/axiosClient";

export type BookingStatus =
  | "Pending"
  | "Confirmed"
  | "CheckedIn"
  | "InProgress"
  | "Completed"
  | "Cancelled"
  | "NoShow";

export interface BookingItem {
  BookingItemID: number;
  Status: string;
  WashStartAt: string | null;
  CheckInAt: string | null;
  CompletedAt: string | null;
  Vehicles?: {
    LicensePlate: string;
    Brand: string | null;
    Model: string | null;
  };
  ServiceLineItems?: Array<{
    ServiceID: number;
    Services?: { ServiceName: string };
    UnitPrice: number | string | null;
    LineTotal: number | string | null;
  }>;
}

export interface Transaction {
  TransactionID: number;
  Status: string | null;
  PaymentMethod: string | null;
  FinalAmount: number | string | null;
  PaidAt: string | null;
}

export interface BookingGroup {
  BookingGroupID: number;
  BookingCode: string;
  BranchID: number;
  BookingDate: string;
  StartTime: string;
  EndTime: string | null;
  Status: BookingStatus;
  CreatedAt: string;
  Customers?: {
    UserID?: number;
    FullName?: string;
    Email?: string;
    Phone?: string;
  };
  BookingItems?: BookingItem[];
  Transactions?: Transaction[];
  branches?: {
    BranchName: string;
    Address: string | null;
  };
}

export interface BookingQuery {
  BranchID?: number;
  Status?: BookingStatus | "";
  StartDate?: string;
  EndDate?: string;
  Page?: number;
  PageSize?: number;
}

export interface BookingListResponse {
  data: BookingGroup[];
  total: number;
  page: number;
  pageSize: number;
}

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const bookingService = {
  async getBookings(query: BookingQuery = {}): Promise<BookingListResponse> {
    const params: Record<string, string> = {};
    if (query.BranchID !== undefined) params.BranchID = String(query.BranchID);
    if (query.Status) params.Status = query.Status;
    if (query.StartDate) params.StartDate = query.StartDate;
    if (query.EndDate) params.EndDate = query.EndDate;
    if (query.Page !== undefined) params.Page = String(query.Page);
    if (query.PageSize !== undefined) params.PageSize = String(query.PageSize);

    const response = await axiosClient.get("/api/bookings", {
      headers: getAuthHeader(),
      params,
    });

    let data = response.data;
    if (data?.data !== undefined) data = data.data;

    if (data?.success && data?.data) {
      return {
        data: data.data as BookingGroup[],
        total: data.total ?? data.data.length,
        page: data.page ?? 1,
        pageSize: data.pageSize ?? 20,
      };
    }

    if (Array.isArray(data)) {
      return {
        data: data as BookingGroup[],
        total: data.length,
        page: 1,
        pageSize: data.length,
      };
    }

    return { data: [], total: 0, page: 1, pageSize: 20 };
  },
};

export default bookingService;
