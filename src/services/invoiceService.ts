import axiosClient from "../api/axiosClient";

export type InvoiceStatus = "ISSUED" | "CANCELED" | "PENDING";

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
  BranchID?: number;
  Reviews?: {
    ReviewID: number;
    Rating: number;
    Comment?: string | null;
    CreatedAt?: string | null;
  } | null;
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

type BackendPaymentRecord = {
  Method?: PaymentMethod | null;
  Status?: string | null;
  ConfirmedAt?: string | null;
};

type BackendTransaction = {
  TransactionID?: number;
  Status?: string | null;
  Subtotal?: number | string | null;
  DiscountAmount?: number | string | null;
  FinalAmount?: number | string | null;
  BookingGroups?: BookingInfo | null;
  Customers?: {
    Users?: CustomerInfo | null;
  } | null;
  PaymentRecords?: BackendPaymentRecord[];
};

type BackendInvoice = {
  InvoiceID?: number;
  InvoiceNo?: string | null;
  IssuedAt?: string | null;
  Status?: string | null;
  Transactions?: BackendTransaction | null;
};

type BackendInvoiceDetail = BackendTransaction & {
  CurrentInvoice?: {
    InvoiceID?: number;
    InvoiceNo?: string | null;
    IssuedAt?: string | null;
    Status?: string | null;
  } | null;
};

function normalizeInvoice(
  invoiceRecord: BackendInvoice,
  transactionOverride?: BackendTransaction
): Invoice {
  const transaction = transactionOverride || invoiceRecord.Transactions;
  const payment = transaction?.PaymentRecords?.[0];

  return {
    InvoiceID: Number(invoiceRecord.InvoiceID || 0),
    InvoiceNo: invoiceRecord.InvoiceNo ?? null,
    IssuedAt: invoiceRecord.IssuedAt ?? null,
    Status: (invoiceRecord.Status as InvoiceStatus | null | undefined) ?? null,
    Transaction: transaction
      ? {
          TransactionID: Number(transaction.TransactionID || 0),
          Status: transaction.Status ?? null,
          PaymentMethod: payment?.Method ?? null,
          FinalAmount: transaction.FinalAmount ?? null,
          PaidAt: payment?.ConfirmedAt ?? null,
        }
      : null,
    Customers: transaction?.Customers?.Users ?? null,
    BookingGroups: transaction?.BookingGroups ?? null,
    Subtotal: transaction?.Subtotal ?? null,
    DiscountAmount: transaction?.DiscountAmount ?? null,
    FinalAmount: transaction?.FinalAmount ?? null,
  };
}

const invoiceService = {
  async getInvoices(query: InvoiceQuery = {}): Promise<InvoiceListResponse> {
    const params: Record<string, string> = {};
    if (query.BranchID !== undefined) params.branchId = String(query.BranchID);
    if (query.Status) params.status = query.Status;
    if (query.StartDate) params.startDate = query.StartDate;
    if (query.EndDate) params.endDate = query.EndDate;
    if (query.InvoiceNo) params.invoiceNo = query.InvoiceNo;
    if (query.Page !== undefined) params.page = String(query.Page);
    if (query.PageSize !== undefined) params.limit = String(query.PageSize);

    const response = await axiosClient.get("/api/invoices", {
      headers: getAuthHeader(),
      params,
    });

    const payload = response.data as {
      data?: BackendInvoice[];
      total?: number;
      page?: number;
      limit?: number;
    };
    const rows = Array.isArray(response.data)
      ? (response.data as BackendInvoice[])
      : Array.isArray(payload?.data)
        ? payload.data
        : [];
    const data = rows.map((invoice) => normalizeInvoice(invoice));

    return {
      data,
      total: Number(payload?.total ?? data.length),
      page: Number(payload?.page ?? 1),
      pageSize: Number(
        (payload?.limit ?? query.PageSize ?? data.length) || 20
      ),
    };
  },

  async getInvoiceById(invoiceId: number): Promise<Invoice | null> {
    const response = await axiosClient.get(`/api/invoices/${invoiceId}`, {
      headers: getAuthHeader(),
    });

    if (!response.data?.success || !response.data?.data) return null;

    const detail = response.data.data as BackendInvoiceDetail;
    const currentInvoice = detail.CurrentInvoice;

    return normalizeInvoice(
      {
        InvoiceID: currentInvoice?.InvoiceID,
        InvoiceNo: currentInvoice?.InvoiceNo,
        IssuedAt: currentInvoice?.IssuedAt,
        Status: currentInvoice?.Status,
      },
      detail
    );
  },
};

export default invoiceService;
