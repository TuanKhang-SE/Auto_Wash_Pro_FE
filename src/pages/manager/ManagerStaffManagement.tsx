import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  Mail,
  Phone,
  Shield,
  X,
  Check,
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

interface Staff {
  UserID: number;
  FullName: string;
  Email: string;
  Phone: string;
  Role: string;
  Status: string;
  CreatedAt: string;
}

interface RegisterFormData {
  Password: string;
  ConfirmPassword: string;
  FullName: string;
  Email: string;
  Phone: string;
}

const ManagerStaffManagement = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<RegisterFormData>({
    Password: "",
    ConfirmPassword: "",
    FullName: "",
    Email: "",
    Phone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axiosClient.get("/api/users", { // GET /api/users?Role=Staff
        params: { Role: "Staff" },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setStaffList(response.data.data);
      }
    } catch (err: any) {
      console.error("Error fetching staff:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = (): boolean => {
    if (!formData.FullName || !formData.Password) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return false;
    }

    if (formData.Password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }

    if (formData.Password !== formData.ConfirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return false;
    }

    if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
      setError("Email không hợp lệ");
      return false;
    }

    if (formData.Phone && !/^[0-9]{10,11}$/.test(formData.Phone)) {
      setError("Số điện thoại phải có 10-11 chữ số");
      return false;
    }

    return true;
  };

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");

      const response = await axiosClient.post( // POST /api/users
        "/api/users",
        {
          FullName: formData.FullName,
          Password: formData.Password,
          Email: formData.Email,
          Phone: formData.Phone,
          Role: "Staff",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSuccess("Đăng ký nhân viên thành công!");
        setFormData({
          Password: "",
          ConfirmPassword: "",
          FullName: "",
          Email: "",
          Phone: "",
        });

        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess("");
          fetchStaffList();
        }, 1500);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Đã xảy ra lỗi khi đăng ký nhân viên"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStaff = staffList.filter(
    (staff) =>
      (staff.FullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (staff.Email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    return status === "Active" ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        Hoạt động
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
        Không hoạt động
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Quản lý Nhân viên
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý tài khoản nhân viên tại chi nhánh của bạn
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Đăng ký Nhân viên
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Tìm kiếm nhân viên..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Staff Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Nhân viên</th>
                <th className="px-6 py-4">Liên hệ</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    Không tìm thấy nhân viên nào
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr
                    key={staff.UserID}
                    className="hover:bg-slate-50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                          {(staff.FullName || "?").charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {staff.FullName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Mail size={14} className="text-slate-400" />
                          {staff.Email || "Chưa cập nhật"}
                        </p>
                        <p className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          {staff.Phone || "Chưa cập nhật"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        <Shield size={12} />
                        {staff.Role}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(staff.Status)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(staff.CreatedAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <p className="text-sm text-slate-500">
            Hiển thị {filteredStaff.length} trong {staffList.length} nhân viên
          </p>
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50" disabled>
              Trước
            </button>
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50">
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Register Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Đăng ký Nhân viên mới
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Tạo tài khoản cho nhân viên tại chi nhánh của bạn
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleRegisterStaff} className="p-5 space-y-4">
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
                  name="FullName"
                  value={formData.FullName}
                  onChange={handleInputChange}
                  placeholder="Nhập họ và tên đầy đủ"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  name="Phone"
                  value={formData.Phone}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại (10-11 số)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  name="Email"
                  value={formData.Email}
                  onChange={handleInputChange}
                  placeholder="Nhập địa chỉ email"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="Password"
                  value={formData.Password}
                  onChange={handleInputChange}
                  placeholder="Ít nhất 6 ký tự"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="ConfirmPassword"
                  value={formData.ConfirmPassword}
                  onChange={handleInputChange}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Modal Footer */}
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
                  className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Đang xử lý...
                    </span>
                  ) : (
                    "Đăng ký"
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

export default ManagerStaffManagement;
