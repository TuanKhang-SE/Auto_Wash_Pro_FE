import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sparkles,
  Plus,
  RefreshCw,
  AlertCircle,
  X,
  Check,
  Edit,
  Trash2,
  Search,
  Clock,
  Tag,
  Power,
} from "lucide-react";
import serviceService, {
  type Service,
  type CreateServicePayload,
  type UpdateServicePayload,
} from "../../services/serviceService";
import { getErrorMessage } from "../../api/axiosClient";

const formatVnd = (value: number | string | null | undefined): string => {
  const n = Number(value) || 0;
  return new Intl.NumberFormat("vi-VN").format(n) + " đ";
};

type ServiceFormState = {
  ServiceName: string;
  Description: string;
  Price: string;
  Duration: string;
  Status: "Active" | "Inactive";
};

const emptyForm: ServiceFormState = {
  ServiceName: "",
  Description: "",
  Price: "",
  Duration: "30",
  Status: "Active",
};

const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">(
    "All"
  );

  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<ServiceFormState>(emptyForm);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editForm, setEditForm] = useState<ServiceFormState>(emptyForm);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await serviceService.getAllServices(); // GET /api/services
      setServices(data);
    } catch (err) {
      setError(getErrorMessage(err));
      console.error("Error fetching services:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lọc dịch vụ theo tên và mô tả
  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase(); 
    return services.filter((s) => {
      const matchStatus =
        statusFilter === "All" || s.Status === statusFilter; // Lọc theo trạng thái
      if (!q) return matchStatus; // Nếu không có từ khóa tìm kiếm, trả về tất cả dịch vụ theo trạng thái
      return (
        matchStatus &&
        (s.ServiceName?.toLowerCase().includes(q) || // Lọc theo tên dịch vụ
          (s.Description ?? "").toLowerCase().includes(q)) // Lọc theo mô tả
      );
    });
  }, [services, searchQuery, statusFilter]); // Trả về danh sách dịch vụ đã lọc

  // ----- Create -----
  const handleCreateInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> 
  ) => {
    const { name, value } = e.target; // Lấy tên và giá trị của input
    setCreateForm((prev) => ({ // Cập nhật form tạo dịch vụ
      ...prev,
      [name]: value, // Cập nhật giá trị của input
    }));
    setCreateError(""); // Xóa lỗi
  };

  const parseNumeric = ( // Chuyển đổi chuỗi thành số
    raw: string, // Chuỗi cần chuyển đổi
    fallback: number // Giá trị mặc định nếu chuyển đổi thất bại
  ): number => {
    if (raw.trim() === "") return fallback; // Nếu chuỗi rỗng, trả về giá trị mặc định
    const n = Number(raw); // Chuyển đổi chuỗi thành số
    return isNaN(n) ? fallback : n; // Nếu chuyển đổi thất bại, trả về giá trị mặc định
  };

  const validateCreateForm = (): boolean => { 
    if (!createForm.ServiceName.trim()) {
      setCreateError("Tên dịch vụ không được để trống");
      return false;
    }
    if (createForm.Price.trim() === "" || Number(createForm.Price) <= 0) {
      setCreateError("Giá dịch vụ phải lớn hơn 0");
      return false;
    }
    const durationNum = Number(createForm.Duration); 
    if (
      createForm.Duration.trim() === "" ||
      isNaN(durationNum) ||
      durationNum <= 0
    ) {
      setCreateError("Thời lượng phải lớn hơn 0 phút");
      return false;
    }
    return true;
  };

  // Tạo dịch vụ
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreateForm()) return;
    setIsCreating(true);
    setCreateError("");
    setCreateSuccess(""); 
    try {
      const trimmedDescription = createForm.Description?.trim() ?? "";
      const payload: CreateServicePayload = {
        ServiceName: createForm.ServiceName.trim(),
        ...(trimmedDescription !== "" && { Description: trimmedDescription }),
        BasePrice: parseNumeric(createForm.Price, 0),
        DurationMinutes: parseNumeric(createForm.Duration, 30),
        Status: createForm.Status,
      };

      // Tạo dịch vụ 
      await serviceService.createService(payload); // POST /api/services
      setCreateSuccess("Tạo dịch vụ thành công!");
      setTimeout(() => {
        setIsCreateModalOpen(false); 
        setCreateForm(emptyForm); 
        setCreateSuccess("");
        fetchData();
      }, 1200);
    } catch (err) {
      setCreateError(getErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  };

  // ----- Edit -----
  const openEditModal = (svc: Service) => {
    setEditingService(svc);
    setEditForm({
      ServiceName: svc.ServiceName,
      Description: svc.Description ?? "",
      Price: String(Number(svc.BasePrice ?? svc.Price) || 0),
      Duration: String(Number(svc.DurationMinutes ?? svc.Duration) || 30),
      Status: (svc.Status as "Active" | "Inactive") ?? "Active",
    });
    setEditError("");
    setEditSuccess("");
    setIsEditModalOpen(true);
  };

  const handleEditInputChange = ( // Cập nhật form sửa dịch vụ
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setEditError("");
  };

  const validateEditForm = (): boolean => {
    if (!editForm.ServiceName.trim()) {
      setEditError("Tên dịch vụ không được để trống");
      return false;
    }
    if (editForm.Price.trim() === "" || Number(editForm.Price) <= 0) {
      setEditError("Giá dịch vụ phải lớn hơn 0");
      return false;
    }
    const durationNum = Number(editForm.Duration);
    if (
      editForm.Duration.trim() === "" ||
      isNaN(durationNum) ||
      durationNum <= 0
    ) {
      setEditError("Thời lượng phải lớn hơn 0 phút");
      return false;
    }
    return true;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !validateEditForm()) return;
    setIsUpdating(true);
    setEditError("");
    setEditSuccess("");
    try {
      const trimmedEditDescription = editForm.Description?.trim() ?? "";
      const payload: UpdateServicePayload = {
        ServiceName: editForm.ServiceName.trim(),
        Description: trimmedEditDescription === "" ? null : trimmedEditDescription,
        BasePrice: parseNumeric(editForm.Price, 0),
        DurationMinutes: parseNumeric(editForm.Duration, 30),
        Status: editForm.Status,
      };

      // Cập nhật dịch vụ
      await serviceService.updateService(editingService.ServiceID, payload); // PUT /api/services/:id
      setEditSuccess("Cập nhật dịch vụ thành công!");
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingService(null);
        setEditSuccess("");
        fetchData();
      }, 1200);
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  // ----- Delete -----
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await serviceService.deleteService(deleteTarget.ServiceID); // DELETE /api/services/:id
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  // ----- Quick toggle status -----
// Chuyển đổi trạng thái dịch vụ
  const toggleStatus = async (svc: Service) => {
    const newStatus = svc.Status === "Active" ? "Inactive" : "Active"; // Chuyển đổi trạng thái dịch vụ
    try {
      await serviceService.updateService(svc.ServiceID, { // Cập nhật trạng thái dịch vụ
        Status: newStatus as "Active" | "Inactive", // Chuyển đổi trạng thái dịch vụ
      });
      fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Quản lý Dịch vụ
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tạo và quản lý các dịch vụ rửa xe. Manager các chi nhánh sẽ chọn dịch
            vụ áp dụng cho chi nhánh của họ.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition"
          >
            <RefreshCw size={16} />
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
            Thêm dịch vụ
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc mô tả..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            {(["All", "Active", "Inactive"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setStatusFilter(k)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === k
                    ? "bg-white text-rose-600 shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {k === "All"
                  ? "Tất cả"
                  : k === "Active"
                  ? "Hoạt động"
                  : "Ngừng"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Tìm thấy {filteredServices.length} / {services.length} dịch vụ
        </div>
      </div>

      {/* Delete Error */}
      {deleteError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">
              Không thể xóa dịch vụ
            </p>
            <p className="mt-1 text-sm text-red-600">{deleteError}</p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteError("")}
            className="rounded-lg p-1 text-red-400 hover:bg-red-100 hover:text-red-600 transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"></div>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
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
      )}

      {/* Empty */}
      {!isLoading && !error && services.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <Sparkles size={32} className="text-slate-400" />
          <p className="text-sm font-medium text-slate-600">
            Chưa có dịch vụ nào trong hệ thống
          </p>
          <p className="text-xs text-slate-500 max-w-md">
            Tạo dịch vụ đầu tiên để các chi nhánh có thể chọn áp dụng.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 transition"
          >
            <Plus size={16} />
            Tạo dịch vụ đầu tiên
          </button>
        </div>
      )}

      {/* Service Cards */}
      {!isLoading && !error && filteredServices.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((svc) => {
            const isActive = svc.Status === "Active";
            return (
              <div
                key={svc.ServiceID}
                className={`overflow-hidden rounded-xl border-2 bg-white shadow-sm transition ${
                  isActive
                    ? "border-rose-200 hover:border-rose-400 hover:shadow-md"
                    : "border-slate-200 opacity-70"
                }`}
              >
                {/* Image or placeholder */}
                <div className="relative h-32 w-full bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
                  {svc.ImageURL ? (
                    <img
                      src={svc.ImageURL}
                      alt={svc.ServiceName}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Sparkles size={36} className="text-rose-300" />
                    </div>
                  )}
                  <span
                    className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium shadow ${
                      isActive
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-500 text-white"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                    {isActive ? "Hoạt động" : "Ngừng"}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="line-clamp-1 font-bold text-slate-800">
                    {svc.ServiceName}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500 min-h-[2rem]">
                    {svc.Description || "Chưa có mô tả"}
                  </p>

                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-1.5">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Tag size={12} />
                        Giá
                      </span>
                      <span className="text-sm font-semibold text-rose-600">
                        {formatVnd(svc.BasePrice ?? svc.Price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-1.5">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock size={12} />
                        Thời lượng
                      </span>
                      <span className="text-sm font-semibold text-blue-600">
                        {svc.DurationMinutes ?? svc.Duration} phút
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      onClick={() => toggleStatus(svc)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                        isActive
                          ? "text-amber-600 hover:bg-amber-50"
                          : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                      title={isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                    >
                      <Power size={14} />
                      {isActive ? "Tắt" : "Bật"}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(svc)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                      >
                        <Edit size={14} />
                        Sửa
                      </button>
                      <button
                        onClick={() => setDeleteTarget(svc)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 size={14} />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No match for filter */}
      {!isLoading && !error && services.length > 0 && filteredServices.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <Search size={28} className="text-slate-400" />
          <p className="text-sm font-medium text-slate-600">
            Không tìm thấy dịch vụ phù hợp
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("All");
            }}
            className="text-xs font-medium text-rose-600 hover:underline"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-rose-100 p-2">
                  <Plus size={20} className="text-rose-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Thêm dịch vụ mới
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Tạo dịch vụ rửa xe để các chi nhánh có thể chọn áp dụng
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

            <form onSubmit={handleCreate} className="p-5 space-y-4">
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
                  Tên dịch vụ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ServiceName"
                  value={createForm.ServiceName}
                  onChange={handleCreateInputChange}
                  placeholder="VD: Rửa ngoài, Rửa trong, Đánh bóng..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Mô tả
                </label>
                <textarea
                  name="Description"
                  rows={3}
                  value={createForm.Description ?? ""}
                  onChange={handleCreateInputChange}
                  placeholder="Mô tả chi tiết về dịch vụ..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Giá (đ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="Price"
                    value={createForm.Price}
                    onChange={handleCreateInputChange}
                    min="0"
                    placeholder="VD: 150000"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Thời lượng (phút) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="Duration"
                    value={createForm.Duration}
                    onChange={handleCreateInputChange}
                    min="1"
                    placeholder="VD: 30"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
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
                <p className="mt-1 text-xs text-slate-400">
                  Các dịch vụ "Hoạt động" sẽ được Manager các chi nhánh nhìn thấy để
                  chọn áp dụng.
                </p>
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
                    "Tạo dịch vụ"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Edit size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Chỉnh sửa dịch vụ
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Cập nhật {editingService.ServiceName}
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

            <form onSubmit={handleUpdate} className="p-5 space-y-4">
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
                  Tên dịch vụ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ServiceName"
                  value={editForm.ServiceName}
                  onChange={handleEditInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Mô tả
                </label>
                <textarea
                  name="Description"
                  rows={3}
                  value={editForm.Description ?? ""}
                  onChange={handleEditInputChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Giá (đ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="Price"
                    value={editForm.Price}
                    onChange={handleEditInputChange}
                    min="0"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Thời lượng (phút) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="Duration"
                    value={editForm.Duration}
                    onChange={handleEditInputChange}
                    min="1"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
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
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                Xác nhận xóa dịch vụ
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Bạn có chắc muốn xóa "
                <span className="font-medium text-slate-700">
                  {deleteTarget.ServiceName}
                </span>
                "? Các chi nhánh đang áp dụng dịch vụ này cũng sẽ bị ảnh hưởng.
              </p>
            </div>

            {deleteError && (
              <div className="mx-6 mb-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 text-left">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition"
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Đang xóa...
                  </span>
                ) : (
                  "Xóa dịch vụ"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServices;
