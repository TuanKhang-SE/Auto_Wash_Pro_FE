import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  Users,
  UserCog,
  CalendarCheck,
  TrendingUp,
  DollarSign,
  ChevronRight,
  AlertCircle,
  Plus,
  X,
  Check,
  Edit,
  Trash2,
} from "lucide-react";
import branchService, {
  type CreateBranchPayload,
  type UpdateBranchPayload,
} from "../../services/branchService";
import userService, { type User } from "../../services/userService";
import { getErrorMessage } from "../../api/axiosClient";

interface BranchDetail {
  branchID: number;
  branchName: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  status: "Active" | "Inactive";
  bankAccount: string | null;
  manager: { fullName: string; email: string; phone: string } | null;
  totalStaff: number;
  todayBookings: number;
  monthBookings: number;
  revenue: number;
  occupancy: number;
  rating: number;
}

interface CreateBranchForm {
  BranchName: string;
  Address: string;
  Phone: string;
  OpenTime: string;
  CloseTime: string;
  BankAccount: string;
  Status: "Active" | "Inactive";
}

// Form chỉnh sửa chi nhánh có cùng cấu trúc với form tạo
type EditBranchForm = CreateBranchForm;

// Parse giờ mở/đóng cửa từ chuỗi ISO (vd: "2024-01-01T07:00:00.000Z")
// hoặc chuỗi "HH:mm" về định dạng "HH:mm" hiển thị; trả về "—" nếu không hợp lệ
const parseTime = (value: string | null | undefined): string => {
  if (!value) return "—";
  const match = value.match(/T(\d{2}):(\d{2})/);
  if (match) return `${match[1]}:${match[2]}`;
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  return "—";
};

// Giá trị khởi tạo mặc định cho form tạo chi nhánh (mở cửa 07:00, đóng cửa 20:00)
const emptyForm: CreateBranchForm = {
  BranchName: "",
  Address: "",
  Phone: "",
  OpenTime: "07:00",
  CloseTime: "20:00",
  BankAccount: "",
  Status: "Active",
};

const AdminBranches = () => {
  const [branches, setBranches] = useState<BranchDetail[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<BranchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateBranchForm>(emptyForm);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchDetail | null>(null);
  const [editForm, setEditForm] = useState<EditBranchForm>(emptyForm);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BranchDetail | null>(null);

  // Lấy song song danh sách chi nhánh và toàn bộ user từ backend, sau đó
  // tổng hợp (enrich) thành danh sách BranchDetail với thông tin Manager,
  // số Staff active cho mỗi chi nhánh để hiển thị trên trang quản lý
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [branchList, userList] = await Promise.all([
        branchService.getAllBranches(),
        userService.getAllUsers(),
      ]);

      const enriched: BranchDetail[] = branchList.map((b) => {
        const branchUsers = userList.filter(
          (u: User) => u.BranchID === b.BranchID
        );
        const manager = branchUsers.find((u: User) => u.Role === "Manager");
        const staff = branchUsers.filter(
          (u: User) => u.Role === "Staff" && u.Status === "Active"
        );

        return {
          branchID: b.BranchID,
          branchName: b.BranchName,
          address: b.Address ?? "Chưa cập nhật",
          phone: b.Phone ?? "Chưa cập nhật",
          openTime: parseTime(b.OpenTime),
          closeTime: parseTime(b.CloseTime),
          status: b.Status as "Active" | "Inactive",
          bankAccount: b.BankAccount ?? null,
          manager: manager
            ? {
                fullName: manager.FullName,
                email: manager.Email ?? "Chưa cập nhật",
                phone: manager.Phone ?? "Chưa cập nhật",
              }
            : null,
          totalStaff: staff.length,
          todayBookings: 0,
          monthBookings: 0,
          revenue: 0,
          occupancy: 0,
          rating: 0,
        };
      });

      setBranches(enriched);
      if (enriched.length > 0) {
        setSelectedBranch(enriched[0]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      console.error("Error fetching branches:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Định dạng số tiền VND theo locale vi-VN (vd: 50.000.000 ₫)
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  // Cập nhật state createForm khi người dùng nhập liệu trong form tạo chi nhánh
  // đồng thời xóa thông báo lỗi cũ để người dùng nhập lại không bị hiển thị lỗi cũ
  const handleCreateInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCreateError("");
  };

  // Kiểm tra hợp lệ form tạo chi nhánh trước khi gửi API: tên chi nhánh
  // bắt buộc, SĐT đúng format (9-11 chữ số) nếu có, giờ đóng cửa phải
  // sau giờ mở cửa để đảm bảo khoảng thời gian hoạt động hợp lệ
  const validateCreateForm = (): boolean => {
    if (!createForm.BranchName.trim()) {
      setCreateError("Tên chi nhánh không được để trống");
      return false;
    }
    if (createForm.Phone && !/^[0-9]{9,11}$/.test(createForm.Phone)) {
      setCreateError("Số điện thoại phải có 9-11 chữ số");
      return false;
    }
    if (createForm.OpenTime && createForm.CloseTime) {
      if (createForm.OpenTime >= createForm.CloseTime) {
        setCreateError("Giờ đóng cửa phải sau giờ mở cửa");
        return false;
      }
    }
    return true;
  };

  // Gọi API tạo mới một chi nhánh trên backend với các thông tin:
  // tên, địa chỉ, SĐT, giờ mở/đóng cửa, tài khoản ngân hàng và trạng thái
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    setIsCreating(true);
    setCreateError("");
    setCreateSuccess("");

    try {
      const payload: CreateBranchPayload = {
        BranchName: createForm.BranchName.trim(),
        Status: createForm.Status,
      };
      if (createForm.Address.trim()) payload.Address = createForm.Address.trim();
      if (createForm.Phone.trim()) payload.Phone = createForm.Phone.trim();
      if (createForm.BankAccount.trim()) payload.BankAccount = createForm.BankAccount.trim();
      if (createForm.OpenTime) payload.OpenTime = createForm.OpenTime;
      if (createForm.CloseTime) payload.CloseTime = createForm.CloseTime;

      await branchService.createBranch(payload);

      setCreateSuccess("Tạo chi nhánh thành công!");
      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateForm(emptyForm);
        setCreateSuccess("");
        fetchData();
      }, 1500);
    } catch (err) {
      setCreateError(getErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  };

  // Mở modal chỉnh sửa chi nhánh: lưu chi nhánh đang sửa vào state editingBranch,
  // đổ dữ liệu hiện tại vào editForm (chuyển giờ về "HH:mm" nếu parseTime trả "—"
  // thì giữ nguyên giá trị cũ trong form trống) và reset thông báo cũ
  const openEditModal = (branch: BranchDetail) => {
    setEditingBranch(branch);
    setEditForm({
      BranchName: branch.branchName,
      Address: branch.address === "Chưa cập nhật" ? "" : branch.address,
      Phone: branch.phone === "Chưa cập nhật" ? "" : branch.phone,
      OpenTime: branch.openTime === "—" ? "" : branch.openTime,
      CloseTime: branch.closeTime === "—" ? "" : branch.closeTime,
      BankAccount: branch.bankAccount ?? "",
      Status: branch.status,
    });
    setEditError("");
    setEditSuccess("");
    setIsEditModalOpen(true);
  };

  // Cập nhật state editForm khi người dùng nhập liệu trong form chỉnh sửa chi nhánh
  // đồng thời xóa thông báo lỗi cũ
  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    setEditError("");
  };

  // Kiểm tra hợp lệ form chỉnh sửa chi nhánh trước khi gửi API: tên chi nhánh
  // bắt buộc, SĐT đúng format (9-11 chữ số) nếu có, giờ đóng cửa phải
  // sau giờ mở cửa nếu cả hai đều được nhập
  const validateEditForm = (): boolean => {
    if (!editForm.BranchName.trim()) {
      setEditError("Tên chi nhánh không được để trống");
      return false;
    }
    if (editForm.Phone && !/^[0-9]{9,11}$/.test(editForm.Phone)) {
      setEditError("Số điện thoại phải có 9-11 chữ số");
      return false;
    }
    if (editForm.OpenTime && editForm.CloseTime) {
      if (editForm.OpenTime >= editForm.CloseTime) {
        setEditError("Giờ đóng cửa phải sau giờ mở cửa");
        return false;
      }
    }
    return true;
  };

  // Gọi API cập nhật thông tin chi nhánh (tên, địa chỉ, SĐT, giờ mở/đóng,
  // tài khoản ngân hàng, trạng thái) theo BranchID của chi nhánh đang sửa
  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    if (!validateEditForm()) return;

    setIsUpdating(true);
    setEditError("");
    setEditSuccess("");

    try {
      const payload: UpdateBranchPayload = {
        BranchName: editForm.BranchName.trim(),
        Status: editForm.Status,
      };
      payload.Address = editForm.Address.trim() ? editForm.Address.trim() : null;
      payload.Phone = editForm.Phone.trim() ? editForm.Phone.trim() : null;
      payload.BankAccount = editForm.BankAccount.trim()
        ? editForm.BankAccount.trim()
        : null;
      payload.OpenTime = editForm.OpenTime ? editForm.OpenTime : null;
      payload.CloseTime = editForm.CloseTime ? editForm.CloseTime : null;

      await branchService.updateBranch(editingBranch.branchID, payload);

      setEditSuccess("Cập nhật chi nhánh thành công!");
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingBranch(null);
        setEditSuccess("");
        fetchData();
      }, 1500);
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  // Gọi API xóa một chi nhánh khỏi hệ thống theo BranchID
  // sau khi người dùng xác nhận qua modal xác nhận xóa
  const handleDeleteBranch = async () => {
    if (!deleteTarget) return;

    setDeleteError("");
    setIsDeleting(true);
    try {
      await branchService.deleteBranch(deleteTarget.branchID);
      if (selectedBranch?.branchID === deleteTarget.branchID) {
        setSelectedBranch(null);
      }
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      const message = getErrorMessage(err);
      console.error("[AdminBranches] Xóa chi nhánh thất bại:", {
        branchID: deleteTarget.branchID,
        branchName: deleteTarget.branchName,
        error: err,
        message,
      });
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Dữ liệu các Chi nhánh
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Xem và so sánh dữ liệu hoạt động của toàn bộ {branches.length} chi
            nhánh
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition"
          >
            <TrendingUp size={16} />
            Làm mới
          </button>
          <button
            onClick={() => {
              setCreateForm(emptyForm);
              setCreateError("");
              setCreateSuccess("");
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-rose-500/30 hover:bg-rose-700 transition"
          >
            <Plus size={18} />
            Thêm chi nhánh
          </button>
        </div>
      </div>

      {deleteError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">
              Không thể xóa chi nhánh
            </p>
            <p className="mt-1 text-sm text-red-600">{deleteError}</p>
            <p className="mt-1 text-xs text-red-500">
              Chi tiết đã được ghi vào Console (F12 → tab Console).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteError("")}
            className="rounded-lg p-1 text-red-400 hover:bg-red-100 hover:text-red-600 transition"
            title="Đóng"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle size={32} className="text-red-500" />
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button
            onClick={fetchData}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 transition"
          >
            Thử lại
          </button>
        </div>
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <Building2 size={32} className="text-slate-400" />
          <p className="text-sm font-medium text-slate-600">
            Chưa có chi nhánh nào
          </p>
        </div>
      ) : (
        <>
          {/* Branch Cards */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {branches.map((b) => (
              <div
                key={b.branchID}
                onClick={() => setSelectedBranch(b)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedBranch(b);
                  }
                }}
                className={`text-left rounded-xl border-2 p-5 transition shadow-sm bg-white cursor-pointer ${
                  selectedBranch?.branchID === b.branchID
                    ? "border-rose-500 bg-rose-50/50 shadow-lg"
                    : "border-slate-200 hover:border-rose-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg p-2 ${
                        selectedBranch?.branchID === b.branchID
                          ? "bg-rose-500 text-white"
                          : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      <Building2 size={22} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {b.branchName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Mã CN: #{b.branchID}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className={
                      selectedBranch?.branchID === b.branchID
                        ? "text-rose-600"
                        : "text-slate-400"
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white border border-slate-100 p-3">
                    <p className="text-xs text-slate-500">Nhân viên</p>
                    <p className="text-xl font-bold text-slate-800">
                      {b.totalStaff}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-100 p-3">
                    <p className="text-xs text-slate-500">Hôm nay</p>
                    <p className="text-xl font-bold text-slate-800">
                      {b.todayBookings}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Doanh thu tháng</span>
                    <span className="font-bold text-rose-600">
                      {formatCurrency(b.revenue)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-1 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(b);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                    title="Sửa chi nhánh"
                  >
                    <Edit size={14} />
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(b);
                    }}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
                    title="Xóa chi nhánh"
                  >
                    <Trash2 size={14} />
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Branch Detail */}
          {selectedBranch && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 p-3 text-white shadow-lg">
                    <Building2 size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {selectedBranch.branchName}
                    </h2>
                    <p className="text-sm text-slate-500">
                      Chi tiết dữ liệu chi nhánh
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    selectedBranch.status === "Active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      selectedBranch.status === "Active"
                        ? "bg-emerald-500"
                        : "bg-red-500"
                    }`}
                  ></span>
                  {selectedBranch.status === "Active" ? "Hoạt động" : "Ngừng"}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Branch Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Building2 size={18} className="text-rose-600" />
                    Thông tin chi nhánh
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                      <MapPin
                        size={18}
                        className="text-slate-400 mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <p className="text-xs text-slate-500">Địa chỉ</p>
                        <p className="text-sm font-medium text-slate-800">
                          {selectedBranch.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                      <Phone
                        size={18}
                        className="text-slate-400 mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <p className="text-xs text-slate-500">
                          Số điện thoại
                        </p>
                        <p className="text-sm font-medium text-slate-800">
                          {selectedBranch.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                      <Clock
                        size={18}
                        className="text-slate-400 mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <p className="text-xs text-slate-500">
                          Giờ hoạt động
                        </p>
                        <p className="text-sm font-medium text-slate-800">
                          {selectedBranch.openTime} -{" "}
                          {selectedBranch.closeTime}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manager Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <UserCog size={18} className="text-purple-600" />
                    Manager phụ trách
                  </h3>

                  {selectedBranch.manager ? (
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-white font-bold">
                          {selectedBranch.manager.fullName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">
                            {selectedBranch.manager.fullName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {selectedBranch.manager.email}
                          </p>
                          <p className="text-xs text-slate-500">
                            {selectedBranch.manager.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-center">
                      <p className="text-sm font-medium text-amber-700">
                        Chi nhánh chưa có Manager
                      </p>
                      <a
                        href="/admin/managers"
                        className="mt-2 inline-block text-xs font-medium text-amber-700 underline"
                      >
                        Tạo Manager
                      </a>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users size={14} className="text-slate-400" />
                        <p className="text-xs text-slate-500">Staff</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-800">
                        {selectedBranch.totalStaff}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-amber-500 text-sm">⭐</span>
                        <p className="text-xs text-slate-500">Đánh giá</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-800">
                        {selectedBranch.rating > 0
                          ? selectedBranch.rating.toFixed(1)
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                  <TrendingUp size={18} className="text-emerald-600" />
                  Hiệu suất hoạt động
                </h3>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarCheck size={16} className="text-blue-600" />
                      <p className="text-xs text-slate-600">Lịch hẹn hôm nay</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedBranch.todayBookings}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-purple-50 to-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarCheck size={16} className="text-purple-600" />
                      <p className="text-xs text-slate-600">Lịch hẹn tháng</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {selectedBranch.monthBookings}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign size={16} className="text-emerald-600" />
                      <p className="text-xs text-slate-600">Doanh thu tháng</p>
                    </div>
                    <p className="text-lg font-bold text-emerald-600">
                      {selectedBranch.revenue > 0
                        ? formatCurrency(selectedBranch.revenue)
                        : "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-amber-50 to-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={16} className="text-amber-600" />
                      <p className="text-xs text-slate-600">Công suất</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">
                      {selectedBranch.occupancy > 0
                        ? `${selectedBranch.occupancy}%`
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Branch Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-rose-100 p-2">
                  <Building2 size={20} className="text-rose-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Thêm chi nhánh mới
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Tạo một chi nhánh rửa xe mới
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="p-5 space-y-4">
              {createError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {createError}
                </div>
              )}
              {createSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-600">
                  <Check size={16} />
                  {createSuccess}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Tên chi nhánh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="BranchName"
                  value={createForm.BranchName}
                  onChange={handleCreateInputChange}
                  placeholder="VD: Chi nhánh Quận 3"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  <MapPin size={14} className="inline mr-1" />
                  Địa chỉ
                </label>
                <input
                  type="text"
                  name="Address"
                  value={createForm.Address}
                  onChange={handleCreateInputChange}
                  placeholder="VD: 123 Lê Lợi, Q1, TP.HCM"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  <Phone size={14} className="inline mr-1" />
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  name="Phone"
                  value={createForm.Phone}
                  onChange={handleCreateInputChange}
                  placeholder="VD: 0901234567"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    <Clock size={14} className="inline mr-1" />
                    Giờ mở cửa
                  </label>
                  <input
                    type="time"
                    name="OpenTime"
                    value={createForm.OpenTime}
                    onChange={handleCreateInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    <Clock size={14} className="inline mr-1" />
                    Giờ đóng cửa
                  </label>
                  <input
                    type="time"
                    name="CloseTime"
                    value={createForm.CloseTime}
                    onChange={handleCreateInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Số tài khoản ngân hàng
                </label>
                <input
                  type="text"
                  name="BankAccount"
                  value={createForm.BankAccount}
                  onChange={handleCreateInputChange}
                  placeholder="VD: 123456789 - Ngân hàng Vietcombank"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Trạng thái
                </label>
                <select
                  name="Status"
                  value={createForm.Status}
                  onChange={handleCreateInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Ngừng hoạt động</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 rounded-lg bg-rose-600 py-2.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50 transition"
                >
                  {isCreating ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Đang xử lý...
                    </span>
                  ) : (
                    "Tạo chi nhánh"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {isEditModalOpen && editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Edit size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Chỉnh sửa chi nhánh
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Cập nhật thông tin {editingBranch.branchName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateBranch} className="p-5 space-y-4">
              {editError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-600">
                  <Check size={16} />
                  {editSuccess}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Tên chi nhánh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="BranchName"
                  value={editForm.BranchName}
                  onChange={handleEditInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  <MapPin size={14} className="inline mr-1" />
                  Địa chỉ
                </label>
                <input
                  type="text"
                  name="Address"
                  value={editForm.Address}
                  onChange={handleEditInputChange}
                  placeholder="VD: 123 Lê Lợi, Q1, TP.HCM"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  <Phone size={14} className="inline mr-1" />
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  name="Phone"
                  value={editForm.Phone}
                  onChange={handleEditInputChange}
                  placeholder="VD: 0901234567"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    <Clock size={14} className="inline mr-1" />
                    Giờ mở cửa
                  </label>
                  <input
                    type="time"
                    name="OpenTime"
                    value={editForm.OpenTime}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    <Clock size={14} className="inline mr-1" />
                    Giờ đóng cửa
                  </label>
                  <input
                    type="time"
                    name="CloseTime"
                    value={editForm.CloseTime}
                    onChange={handleEditInputChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Số tài khoản ngân hàng
                </label>
                <input
                  type="text"
                  name="BankAccount"
                  value={editForm.BankAccount}
                  onChange={handleEditInputChange}
                  placeholder="VD: 123456789 - Ngân hàng Vietcombank"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Trạng thái
                </label>
                <select
                  name="Status"
                  value={editForm.Status}
                  onChange={handleEditInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Ngừng hoạt động</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 rounded-lg bg-rose-600 py-2.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50 transition"
                >
                  {isUpdating ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Đang xử lý...
                    </span>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <Trash2 size={28} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                Xóa chi nhánh?
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Bạn có chắc muốn xóa chi nhánh{" "}
                <span className="font-medium text-slate-700">
                  "{deleteTarget.branchName}"
                </span>
                ? Hành động này không thể hoàn tác.
              </p>
            </div>

            {deleteError && (
              <div className="mx-6 mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 border-t border-slate-100 p-4">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteBranch}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition"
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Đang xóa...
                  </span>
                ) : (
                  "Xóa chi nhánh"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBranches;
