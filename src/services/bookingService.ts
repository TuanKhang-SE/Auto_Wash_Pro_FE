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

type RawPaymentRecord = {
  Method?: string | null;
  ConfirmedAt?: string | null;
};

type RawTransaction = Partial<Transaction> & {
  PaymentRecords?: RawPaymentRecord[];
};

type RawCustomer =
  | BookingGroup["Customers"]
  | {
      Users?: BookingGroup["Customers"] | null;
    };

type RawBookingGroup = Omit<BookingGroup, "Customers" | "Transactions"> & {
  Customers?: RawCustomer;
  Transactions?: RawTransaction[];
};

function normalizeBooking(raw: RawBookingGroup): BookingGroup {
  const customer: BookingGroup["Customers"] =
    raw.Customers && "Users" in raw.Customers
      ? raw.Customers.Users || undefined
      : (raw.Customers as BookingGroup["Customers"]);
  const transactions = (raw.Transactions || []).map((transaction) => {
    const payment = transaction.PaymentRecords?.[0];

    return {
      TransactionID: Number(transaction.TransactionID || 0),
      Status: transaction.Status ?? null,
      PaymentMethod: transaction.PaymentMethod ?? payment?.Method ?? null,
      FinalAmount: transaction.FinalAmount ?? null,
      PaidAt: transaction.PaidAt ?? payment?.ConfirmedAt ?? null,
    };
  });

  return {
    ...raw,
    Customers: customer,
    Transactions: transactions,
  };
}

const bookingService = {
  async getBookings(query: BookingQuery = {}): Promise<BookingListResponse> {
    const params: Record<string, string> = {};
    if (query.BranchID !== undefined) params.branchId = String(query.BranchID);
    if (query.Status) params.status = query.Status;
    if (query.StartDate) params.startDate = query.StartDate;
    if (query.EndDate) params.endDate = query.EndDate;
    if (query.Page !== undefined) params.page = String(query.Page);
    if (query.PageSize !== undefined) params.limit = String(query.PageSize);

    const response = await axiosClient.get("/api/bookings", {
      headers: getAuthHeader(),
      params,
    });

    const payload = response.data as {
      data?: RawBookingGroup[];
      total?: number;
      page?: number;
      limit?: number;
    };
    const rows = Array.isArray(response.data)
      ? (response.data as RawBookingGroup[])
      : Array.isArray(payload?.data)
        ? payload.data
        : [];
    const data = rows.map(normalizeBooking);

    return {
      data,
      total: Number(payload?.total ?? data.length),
      page: Number(payload?.page ?? 1),
      pageSize: Number(
        (payload?.limit ?? query.PageSize ?? data.length) || 20
      ),
    };
  },
};

export default bookingService;
