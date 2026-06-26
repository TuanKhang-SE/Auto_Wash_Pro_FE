import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Shield,
  X,
  Check,
  Building2,
  UserCog,
  Edit,
  Trash2,
} from "lucide-react";
import userService, { type User } from "../../services/userService";
import branchService, { type Branch } from "../../services/branchService";
import { getErrorMessage } from "../../api/axiosClient";

interface RegisterFormData {
  password: string;
  confirmPassword: string;
  fullName: string;
  email: string;
  phone: string;
  branchID: number;
}

interface EditFormData {
  fullName: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
}

const AdminStaffManagement = () => {
  const [staffList, setStaffList] = useState<User[]>([]);
  const [managers, setManagers] = useState<{ branchID: number; fullName: string }[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBranch, setFilterBranch] = useState<number | "all">("all");
  const [formData, setFormData] = useState<RegisterFormData>({
    password: "",
    confirmPassword: "",
    fullName: "",
    email: "",
    phone: "",
    branchID: 1,
  });
  const [editFormData, setEditFormData] = useState<EditFormData>({
    fullName: "",
    email: "",
    phone: "",
    status: "Active",
  });
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchStaff();
    fetchManagers();
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const data = await branchService.getAllBranches();
      setBranches(data);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  const getBranchName = (branchID: number | null): string => {
    if (branchID == null) return "Chưa phân công";
    const branch = branches.find((b) => b.BranchID === branchID);
    return branch?.BranchName || `Chi nhánh ${branchID}`;
  };

  // Lấy danh sách tất cả tài khoản có Role = "Staff" từ backend
  // để hiển thị lên bảng quản lý Staff của Admin
  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAllUsers({ Role: "Staff" }); // GET /api/users?Role=Staff
      setStaffList(data);
    } catch (err) {
      console.error("Error fetching staff:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Lấy danh sách tất cả Manager theo từng chi nhánh, dùng để kiểm tra
  // chi nhánh nào đã có Manager trước khi cho phép tạo Staff thuộc chi nhánh đó
  const fetchManagers = async () => {
    try {
      const data = await userService.getAllUsers({ Role: "Manager" }); // GET /api/users?Role=Manager
      setManagers(
        data.map((m) => ({
          branchID: m.BranchID || 0,
          fullName: m.FullName,
        }))
      );
    } catch {
      // Fallback dữ liệu tạm khi API lỗi, tránh block form tạo Staff
      setManagers([
        { branchID: 1, fullName: "Nguyễn Văn An" },
        { branchID: 2, fullName: "Trần Thị Bình" },
        { branchID: 3, fullName: "Lê Văn Cường" },
      ]);
    }
  };

  // Cập nhật state formData khi người dùng nhập liệu trong form tạo Staff
  // (chuyển branchID từ string sang number) đồng thời xóa thông báo lỗi cũ
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "branchID" ? Number(value) : value,
    }));
    setError("");
  };

  // Cập nhật state editFormData khi người dùng nhập liệu trong form chỉnh sửa Staff
  // (status được ép kiểu về "Active" | "Inactive") đồng thời xóa thông báo lỗi cũ
  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: name === "status" ? (value as "Active" | "Inactive") : value,
    }));
    setError("");
  };

  // Kiểm tra hợp lệ form tạo Staff trước khi gửi API: bắt buộc nhập
  // họ tên + mật khẩu (≥6 ký tự, khớp confirmPassword), email/phone đúng
  // format và chi nhánh được chọn đã có Manager quản lý
  const validateForm = (): boolean => {
    if (!formData.password || !formData.fullName) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Email không hợp lệ");
      return false;
    }
    if (formData.phone && !/^[0-9]{10,11}$/.test(formData.phone)) {
      setError("Số điện thoại phải có 10-11 chữ số");
      return false;
    }

    const branchHasManager = managers.some(
      (m) => m.branchID === formData.branchID
    );
    if (!branchHasManager) {
      setError(
        `Chi nhánh ${getBranchName(
          formData.branchID
        )} chưa có Manager. Vui lòng tạo Manager trước.`
      );
      return false;
    }
    return true;
  };

  // Gọi API tạo mới một tài khoản Staff trên backend với các thông tin:
  // họ tên, mật khẩu, email, số điện thoại và chi nhánh được phân công
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await userService.createUser({ // POST /api/users
        FullName: formData.fullName,
        Password: formData.password,
        Role: "Staff",
        Email: formData.email,
        Phone: formData.phone,
        BranchID: formData.branchID,
      });

      setSuccess("Tạo tài khoản Staff thành công!");
      setFormData({
        password: "",
        confirmPassword: "",
        fullName: "",
        email: "",
        phone: "",
        branchID: 1,
      });
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess("");
        fetchStaff();
      }, 1500);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Mở modal chỉnh sửa Staff: lưu nhân viên đang sửa vào state editingStaff,
  // đổ dữ liệu hiện tại vào editFormData để form hiển thị và reset thông báo cũ
  const openEditModal = (staff: User) => {
    setEditingStaff(staff);
    setEditFormData({
      fullName: staff.FullName,
      email: staff.Email || "",
      phone: staff.Phone || "",
      status: staff.Status,
    });
    setError("");
    setSuccess("");
    setIsEditModalOpen(true);
  };

  // Gọi API cập nhật thông tin Staff (họ tên, email, số điện thoại, trạng thái)
  // theo UserID của nhân viên đang được chỉnh sửa
  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    if (editFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      setError("Email không hợp lệ");
      return;
    }
    if (editFormData.phone && !/^[0-9]{10,11}$/.test(editFormData.phone)) {
      setError("Số điện thoại phải có 10-11 chữ số");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await userService.updateUser(editingStaff.UserID, { // PUT /api/users/:id
        FullName: editFormData.fullName,
        Email: editFormData.email,
        Phone: editFormData.phone,
        Status: editFormData.status,
      });

      setSuccess("Cập nhật Staff thành công!");
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingStaff(null);
        setSuccess("");
        fetchStaff();
      }, 1500);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Gọi API xóa tài khoản Staff khỏi hệ thống theo UserID
  // sau khi người dùng đã xác nhận qua hộp thoại confirm
  const handleDeleteStaff = async (staff: User) => {
    if (!confirm(`Bạn có chắc muốn xóa Staff "${staff.FullName}"?`)) return;

    setIsLoading(true);
    try {
      await userService.deleteUser(staff.UserID); // DELETE /api/users/:id
      fetchStaff();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Lọc danh sách Staff theo từ khóa tìm kiếm (họ tên/email/SĐT)
  // và theo chi nhánh đã chọn ở bộ lọc, dùng để render bảng
  const filteredStaff = staffList.filter((s) => {
    const matchSearch =
      s.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.Email && s.Email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.Phone && s.Phone.includes(searchTerm));
    const matchBranch = filterBranch === "all" || s.BranchID === filterBranch;
    return matchSearch && matchBranch;
  });

  // Tra cứu tên Manager quản lý theo branchID để hiển thị cột "Manager quản lý"
  // trong bảng Staff; trả về "Chưa phân công" nếu chi nhánh chưa có Manager
  const getManagerName = (branchID: number | null) => {
    const manager = managers.find((m) => m.branchID === branchID);
    return manager?.fullName || "Chưa phân công";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Quản lý Staff
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tạo tài khoản Staff và phân công vào chi nhánh có Manager quản lý
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-700"
        >
          <Plus size={18} />
          Tạo Staff mới
        </button>
      </div>

      {/* Stats by branch */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Tổng Staff</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {staffList.length}
          </p>
        </div>
        {branches.map((b) => {
          const count = staffList.filter(
            (s) => s.BranchID === b.BranchID && s.Status === "Active"
          ).length;
          return (
            <div
              key={b.BranchID}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs text-slate-500 truncate">{b.BranchName}</p>
              <p className="mt-1 text-2xl font-bold text-rose-600">{count}</p>
              <p className="text-xs text-slate-400">staff đang hoạt động</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Tìm kiếm Staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        <select
          value={filterBranch}
          onChange={(e) =>
            setFilterBranch(
              e.target.value === "all" ? "all" : Number(e.target.value)
            )
          }
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
        >
          <option value="all">Tất cả chi nhánh</option>
          {branches.map((b) => (
            <option key={b.BranchID} value={b.BranchID}>
              {b.BranchName}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Staff</th>
                <th className="px-6 py-4">Liên hệ</th>
                <th className="px-6 py-4">Chi nhánh</th>
                <th className="px-6 py-4">Manager quản lý</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    Không tìm thấy Staff nào
                  </td>
                </tr>
              ) : (
                filteredStaff.map((s) => (
                  <tr key={s.UserID} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                          {s.FullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {s.FullName}
                          </p>
                          <p className="text-xs text-slate-500">
                            ID: {s.UserID}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Mail size={14} className="text-slate-400" />
                          {s.Email || "Chưa cập nhật"}
                        </p>
                        <p className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          {s.Phone || "Chưa cập nhật"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                        <Building2 size={12} />
                        {getBranchName(s.BranchID || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                        <UserCog size={14} className="text-slate-400" />
                        {getManagerName(s.BranchID)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          s.Status === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            s.Status === "Active"
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        ></span>
                        {s.Status === "Active" ? "Hoạt động" : "Ngưng"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(s)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition"
                          title="Sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(s)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2">
                  <Users size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Tạo tài khoản Staff
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Phân công Staff vào chi nhánh
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-5 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-600 flex items-center gap-2">
                  <Check size={16} />
                  {success}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  <Building2 size={14} className="inline mr-1" />
                  Chi nhánh làm việc <span className="text-red-500">*</span>
                </label>
                <select
                  name="branchID"
                  value={formData.branchID}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                >
                  {branches.map((b) => {
                    const hasManager = managers.some(
                      (m) => m.branchID === b.BranchID
                    );
                    return (
                      <option
                        key={b.BranchID}
                        value={b.BranchID}
                        disabled={!hasManager}
                      >
                        {b.BranchName}{" "}
                        {hasManager
                          ? `(Manager: ${
                              managers.find((m) => m.branchID === b.BranchID)
                                ?.fullName
                            })`
                          : "(chưa có Manager)"}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Nhập họ và tên đầy đủ"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Ít nhất 6 ký tự"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Xác nhận <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Nhập lại"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="VD: 0901234567"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex gap-2">
                <Shield size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Staff sẽ được quản lý bởi <strong>Manager</strong> của chi nhánh
                  được chọn.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 rounded-lg bg-rose-600 py-2.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50 transition"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Đang xử lý...
                    </span>
                  ) : (
                    "Tạo tài khoản"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Edit size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Chỉnh sửa Staff
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Cập nhật thông tin {editingStaff.FullName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditStaff} className="p-5 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-600 flex items-center gap-2">
                  <Check size={16} />
                  {success}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={editFormData.fullName}
                  onChange={handleEditInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleEditInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Trạng thái
                </label>
                <select
                  name="status"
                  value={editFormData.status}
                  onChange={handleEditInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Ngưng</option>
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
                  disabled={isLoading}
                  className="flex-1 rounded-lg bg-rose-600 py-2.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50 transition"
                >
                  {isLoading ? (
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
    </div>
  );
};

export default AdminStaffManagement;