import axiosClient from "../api/axiosClient";

export type InvoiceStatus = "ISSUED" | "CANCELLED" | "PENDING";

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "VNPAY";

export interface InvoiceRecord {
  InvoiceID: number;
  InvoiceNo: string | null;
  IssuedAt: string | null;
  Status: InvoiceStatus | null;
}

export interface TransactionInfo {
  TransactionID: number;
  Status: string | null;
  PaymentMethod: PaymentMethod | null;
  FinalAmount: number | string | null;
  PaidAt: string | null;
}

export interface ServiceLineItem {
  Quantity: number | null;
  UnitPrice: number | string | null;
  LineTotal: number | string | null;
  Services?: {
    ServiceName: string | null;
  };
}

export interface VehicleInfo {
  LicensePlate: string | null;
  Brand: string | null;
  Model: string | null;
}

export interface BookingItemInfo {
  BookingItemID: number;
  Vehicles?: VehicleInfo | null;
  ServiceLineItems?: ServiceLineItem[];
}

export interface BookingInfo {
  BookingGroupID: number;
  BookingCode: string | null;
  BookingDate: string | null;
  StartTime: string | null;
  branches?: {
    BranchName: string | null;
    Address: string | null;
    Phone: string | null;
  };
  BookingItems?: BookingItemInfo[];
}

export interface CustomerInfo {
  UserID?: number;
  FullName?: string | null;
  Email?: string | null;
  Phone?: string | null;
}

export interface Invoice {
  InvoiceID: number;
  InvoiceNo: string | null;
  IssuedAt: string | null;
  Status: InvoiceStatus | null;
  Transaction?: TransactionInfo | null;
  Customers?: CustomerInfo | null;
  BookingGroups?: BookingInfo | null;
  Subtotal?: number | string | null;
  DiscountAmount?: number | string | null;
  FinalAmount?: number | string | null;
}

export interface InvoiceQuery {
  BranchID?: number;
  Status?: InvoiceStatus | "";
  StartDate?: string;
  EndDate?: string;
  InvoiceNo?: string;
  Page?: number;
  PageSize?: number;
}

export interface InvoiceListResponse {
  data: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const invoiceService = {
  async getInvoices(query: InvoiceQuery = {}): Promise<InvoiceListResponse> {
    const params: Record<string, string> = {};
    if (query.BranchID !== undefined) params.BranchID = String(query.BranchID);
    if (query.Status) params.Status = query.Status;
    if (query.StartDate) params.StartDate = query.StartDate;
    if (query.EndDate) params.EndDate = query.EndDate;
    if (query.InvoiceNo) params.InvoiceNo = query.InvoiceNo;
    if (query.Page !== undefined) params.Page = String(query.Page);
    if (query.PageSize !== undefined) params.PageSize = String(query.PageSize);

    const response = await axiosClient.get("/api/invoices", {
      headers: getAuthHeader(),
      params,
    });

    let data = response.data;
    if (data?.data !== undefined) data = data.data;

    if (data?.success && data?.data) {
      return {
        data: data.data as Invoice[],
        total: data.total ?? data.data.length,
        page: data.page ?? 1,
        pageSize: data.pageSize ?? 20,
      };
    }

    if (Array.isArray(data)) {
      return {
        data: data as Invoice[],
        total: data.length,
        page: 1,
        pageSize: data.length,
      };
    }

    return { data: [], total: 0, page: 1, pageSize: 20 };
  },

  async getInvoiceById(invoiceId: number): Promise<Invoice | null> {
    const response = await axiosClient.get(`/api/invoices/${invoiceId}`, {
      headers: getAuthHeader(),
    });

    if (response.data?.success) {
      return response.data.data as Invoice;
    }
    return null;
  },
};

export default invoiceService;
