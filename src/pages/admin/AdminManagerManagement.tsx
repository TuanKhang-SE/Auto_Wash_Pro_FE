import { useState, useEffect } from "react";
import {
  UserCog,
  Plus,
  Search,
  Mail,
  Phone,
  Shield,
  X,
  Check,
  Building2,
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
}

const AdminManagerManagement = () => {
  const [managers, setManagers] = useState<User[]>([]);
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
    branchID: 0,
  });
  const [editFormData, setEditFormData] = useState<EditFormData>({
    fullName: "",
    email: "",
    phone: "",
  });
  const [editingManager, setEditingManager] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchManagers();
  }, []);

  // Lấy song song danh sách Manager và danh sách chi nhánh từ backend:
  // - GET /api/users?Role=Manager: lấy tất cả tài khoản Manager
  // - GET /api/branches: lấy danh sách chi nhánh để hiển thị tên và kiểm tra
  //   chi nhánh nào đã có Manager (mỗi chi nhánh chỉ gán được 1 Manager)
  const fetchManagers = async () => {
    setIsLoading(true);
    try {
      const [data, branchList] = await Promise.all([
        userService.getAllUsers({ Role: "Manager" }),
        branchService.getAllBranches(),
      ]);
      setManagers(data);
      setBranches(branchList);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Cập nhật state formData khi người dùng nhập liệu trong form tạo Manager
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

  // Cập nhật state editFormData khi người dùng nhập liệu trong form chỉnh sửa Manager
  // đồng thời xóa thông báo lỗi cũ
  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  // Kiểm tra hợp lệ form tạo Manager trước khi gửi API: bắt buộc nhập
  // họ tên + mật khẩu (≥6 ký tự, khớp confirmPassword), email/phone đúng
  // format và chi nhánh được chọn chưa có Manager nào (1 chi nhánh chỉ 1 Manager)
  const validateForm = (): boolean => {
    if (
      !formData.password ||
      !formData.fullName
    ) {
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
    if (!formData.branchID || formData.branchID <= 0) {
      setError("Vui lòng chọn chi nhánh phụ trách");
      return false;
    }

    const existing = managers.find((m) => m.BranchID === formData.branchID);
    if (existing) {
      setError(
        `Chi nhánh ${branches.find(b => b.BranchID === formData.branchID)?.BranchName || formData.branchID} đã có Manager: ${existing.FullName}. Vui lòng chọn chi nhánh khác.`
      );
      return false;
    }

    return true;
  };

  // Gọi API tạo mới một tài khoản Manager trên backend với các thông tin:
  // họ tên, mật khẩu, email, số điện thoại và chi nhánh mà Manager sẽ phụ trách
  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await userService.createUser({ // POST /api/users
        FullName: formData.fullName,
        Password: formData.password,
        Role: "Manager",
        Email: formData.email,
        Phone: formData.phone,
        BranchID: formData.branchID,
      });

      setSuccess("Tạo tài khoản Manager thành công!");
      setFormData({
        password: "",
        confirmPassword: "",
        fullName: "",
        email: "",
        phone: "",
        branchID: 0,
      });
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess("");
        fetchManagers();
      }, 1500);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Mở modal chỉnh sửa Manager: lưu Manager đang sửa vào state editingManager,
  // đổ dữ liệu hiện tại vào editFormData để form hiển thị và reset thông báo cũ
  const openEditModal = (manager: User) => {
    setEditingManager(manager);
    setEditFormData({
      fullName: manager.FullName,
      email: manager.Email || "",
      phone: manager.Phone || "",
    });
    setError("");
    setSuccess("");
    setIsEditModalOpen(true);
  };

  // Gọi API cập nhật thông tin Manager (họ tên, email, số điện thoại)
  // theo UserID của Manager đang được chỉnh sửa
  const handleEditManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingManager) return;

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
      await userService.updateUser(editingManager.UserID, { // PUT /api/users/:id
        FullName: editFormData.fullName,
        Email: editFormData.email,
        Phone: editFormData.phone,
      });

      setSuccess("Cập nhật Manager thành công!");
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingManager(null);
        setSuccess("");
        fetchManagers();
      }, 1500);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Gọi API xóa tài khoản Manager khỏi hệ thống theo UserID
  // sau khi người dùng đã xác nhận qua hộp thoại confirm
  const handleDeleteManager = async (manager: User) => {
    if (!confirm(`Bạn có chắc muốn xóa Manager "${manager.FullName}"?`)) return;

    setIsLoading(true);
    try {
      await userService.deleteUser(manager.UserID); // DELETE /api/users/:id
      fetchManagers();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Lọc danh sách Manager theo từ khóa tìm kiếm (họ tên/email/SĐT)
  // và theo chi nhánh đã chọn ở bộ lọc, dùng để render bảng
  const filteredManagers = managers.filter((m) => {
    const matchSearch =
      m.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.Email && m.Email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.Phone && m.Phone.includes(searchTerm));
    const matchBranch = filterBranch === "all" || m.BranchID === filterBranch;
    return matchSearch && matchBranch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Quản lý Manager
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tạo tài khoản Manager và phân công quản lý chi nhánh
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-700"
        >
          <Plus size={18} />
          Tạo Manager mới
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Tổng Manager</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">
            {managers.length}
          </p>
        </div>
        {branches.map((branch) => {
          const manager = managers.find((m) => m.BranchID === branch.BranchID);
          return (
            <div
              key={branch.BranchID}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 truncate">
                  {branch.BranchName}
                </p>
                {manager ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Có Manager
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    Trống
                  </span>
                )}
              </div>
              <p className="mt-1 text-lg font-semibold text-slate-800">
                {manager?.FullName || "Chưa phân công"}
              </p>
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
            placeholder="Tìm kiếm Manager..."
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

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Manager</th>
                <th className="px-6 py-4">Liên hệ</th>
                <th className="px-6 py-4">Chi nhánh phụ trách</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && managers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredManagers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    Không tìm thấy Manager nào
                  </td>
                </tr>
              ) : (
                filteredManagers.map((m) => (
                  <tr key={m.UserID} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white font-semibold">
                          {m.FullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {m.FullName}
                          </p>
                          <p className="text-xs text-slate-500">
                            ID: {m.UserID}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Mail size={14} className="text-slate-400" />
                          {m.Email || "Chưa cập nhật"}
                        </p>
                        <p className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          {m.Phone || "Chưa cập nhật"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                        <Building2 size={12} />
                        {m.branches?.BranchName || branches.find(b => b.BranchID === m.BranchID)?.BranchName || `Chi nhánh ${m.BranchID}`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          m.Status === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            m.Status === "Active"
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        ></span>
                        {m.Status === "Active" ? "Hoạt động" : "Ngưng"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(m.CreatedAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(m)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition"
                          title="Sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteManager(m)}
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
                <div className="rounded-lg bg-rose-100 p-2">
                  <UserCog size={20} className="text-rose-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Tạo tài khoản Manager
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Phân công Manager quản lý một chi nhánh
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

            <form onSubmit={handleCreateManager} className="p-5 space-y-4">
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

              {/* Branch Selection */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  <Building2 size={14} className="inline mr-1" />
                  Chi nhánh phụ trách <span className="text-red-500">*</span>
                </label>
                <select
                  name="branchID"
                  value={formData.branchID || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                >
                  {formData.branchID === 0 && (
                    <option value="" disabled>
                      -- Vui lòng chọn chi nhánh --
                    </option>
                  )}
                  {branches.map((b) => {
                    const taken = managers.some(
                      (m) => m.BranchID === b.BranchID
                    );
                    return (
                      <option
                        key={b.BranchID}
                        value={b.BranchID}
                        disabled={taken}
                      >
                        {b.BranchName} {taken ? "(đã có Manager)" : ""}
                      </option>
                    );
                  })}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Mỗi chi nhánh chỉ có 1 Manager. Chọn chi nhánh muốn phân công.
                </p>
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
                  Manager sẽ có quyền quản lý <strong>staff</strong>, xem lịch
                  hẹn và cấu hình chi nhánh được phân công.
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
      {isEditModalOpen && editingManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Edit size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Chỉnh sửa Manager
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Cập nhật thông tin {editingManager.FullName}
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

            <form onSubmit={handleEditManager} className="p-5 space-y-4">
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

export default AdminManagerManagement;