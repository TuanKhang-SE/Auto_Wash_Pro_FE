export interface Branch {
  branchID: number;
  branchName: string;
  address: string;
  phone: string;
  status: "Active" | "Inactive";
}

export const BRANCHES: Branch[] = [
  {
    branchID: 1,
    branchName: "Chi nhánh Quận 1",
    address: "643/40 Đường Xô Viết Nghệ Tĩnh, Bình Thạnh, TP. HCM",
    phone: "0281234567",
    status: "Active",
  },
  {
    branchID: 2,
    branchName: "Chi nhánh Quận 9",
    address: "Số 7 Đường D1, Phường Tăng Nhơn Phú, TP. HCM",
    phone: "0282345678",
    status: "Active",
  },
  {
    branchID: 3,
    branchName: "Chi nhánh Dĩ An",
    address: "Số 1 Đường Lưu Hữu Phước, Phường Đông Hòa, TP. HCM",
    phone: "0283456789",
    status: "Active",
  },
];

export const getBranchName = (branchID: number): string => {
  const branch = BRANCHES.find((b) => b.branchID === branchID);
  return branch?.branchName || `Chi nhánh ${branchID}`;
};