  BranchID: number;
  BookingDate: string;
  StartTime: string;
  Status: string;
  Customers?: {
    Users?: {
      FullName: string;
      Phone: string;
    };
  };
  BookingItems?: BookingItem[];
};
