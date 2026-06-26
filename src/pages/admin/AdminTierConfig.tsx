import { useState, useEffect, useCallback } from "react";
import {
  Crown,
  Trophy,
  Medal,
  Award,
  Plus,
  RefreshCw,
  AlertCircle,
  X,
  Check,
  Edit,
  Trash2,
} from "lucide-react";
import tierConfigService, {
  type TierConfig,
  type CreateTierConfigPayload,
  type UpdateTierConfigPayload,
} from "../../services/tierConfigService";
import { getErrorMessage } from "../../api/axiosClient";

const TIER_ICON_MAP: Record<string, React.ReactNode> = {
  VIP: <Crown size={18} className="text-amber-500" />,
  GOLD: <Trophy size={18} className="text-yellow-500" />,
  SILVER: <Medal size={18} className="text-slate-400" />,
  BRONZE: <Award size={18} className="text-orange-400" />,
};

const getTierIcon = (name: string) => {
  const upper = name.toUpperCase();
  if (upper.includes("VIP")) return TIER_ICON_MAP["VIP"];
  if (upper.includes("GOLD")) return TIER_ICON_MAP["GOLD"];
  if (upper.includes("SILVER")) return TIER_ICON_MAP["SILVER"];
  if (upper.includes("BRONZE")) return TIER_ICON_MAP["BRONZE"];
  return <Medal size={18} className="text-slate-400" />;
};

const formatNumber = (value: number | string | null | undefined): string => {
  const n = Number(value) || 0;
  return new Intl.NumberFormat("vi-VN").format(n);
};

const emptyForm: CreateTierConfigPayload = {
  TierName: "",
  MinSpent: 0,
  DiscountPercent: 0,
  PointMultiplier: 1,
  Status: "Active",
};

const AdminTierConfig = () => {
  const [tiers, setTiers] = useState<TierConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTierConfigPayload>(emptyForm);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<TierConfig | null>(null);
  const [editForm, setEditForm] = useState<CreateTierConfigPayload>(emptyForm);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<TierConfig | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tierConfigService.getAllTierConfigs();
      setTiers(data);
    } catch (err) {
      setError(getErrorMessage(err));
      console.error("Error fetching tier configs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Create ---
  const handleCreateInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: name === "TierName" || name === "Status" ? value : Number(value) || 0,
    }));
    setCreateError("");
  };

  const validateCreateForm = (): boolean => {
    if (!createForm.TierName.trim()) {
      setCreateError("Tên hạng không được để trống");
      return false;
    }
    if (
      createForm.MinSpent !== undefined &&
      (isNaN(createForm.MinSpent) || (createForm.MinSpent as number) < 0)
    ) {
      setCreateError("Chi tiêu tối thiểu phải là số không âm");
      return false;
    }
    if (
      createForm.DiscountPercent !== undefined &&
      ((createForm.DiscountPercent as number) < 0 ||
        (createForm.DiscountPercent as number) > 100)
    ) {
      setCreateError("Phần trăm giảm giá phải từ 0 đến 100");
      return false;
    }
    if (
      createForm.PointMultiplier !== undefined &&
      (createForm.PointMultiplier as number) < 0
    ) {
      setCreateError("Hệ số nhân điểm phải là số không âm");
      return false;
    }
    return true;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    setIsCreating(true);
    setCreateError("");
    setCreateSuccess("");

    try {
      const payload: CreateTierConfigPayload = {
        TierName: createForm.TierName.trim(),
        MinSpent: createForm.MinSpent ?? 0,
        DiscountPercent: createForm.DiscountPercent ?? 0,
        PointMultiplier: createForm.PointMultiplier ?? 1,
        Status: createForm.Status ?? "Active",
      };
      await tierConfigService.createTierConfig(payload);
      setCreateSuccess("Tạo hạng thành viên thành công!");
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

  // --- Edit ---
  const openEditModal = (tier: TierConfig) => {
    setEditingTier(tier);
    setEditForm({
      TierName: tier.TierName,
      MinSpent: Number(tier.MinSpent) || 0,
      DiscountPercent: Number(tier.DiscountPercent) || 0,
      PointMultiplier: Number(tier.PointMultiplier) || 1,
      Status: tier.Status ?? "Active",
    });
    setEditError("");
    setEditSuccess("");
    setIsEditModalOpen(true);
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === "TierName" || name === "Status" ? value : Number(value) || 0,
    }));
    setEditError("");
  };

  const validateEditForm = (): boolean => {
    if (!editForm.TierName.trim()) {
      setEditError("Tên hạng không được để trống");
      return false;
    }
    if (
      editForm.MinSpent !== undefined &&
      (isNaN(editForm.MinSpent) || (editForm.MinSpent as number) < 0)
    ) {
      setEditError("Chi tiêu tối thiểu phải là số không âm");
      return false;
    }
    if (
      editForm.DiscountPercent !== undefined &&
      ((editForm.DiscountPercent as number) < 0 ||
        (editForm.DiscountPercent as number) > 100)
    ) {
      setEditError("Phần trăm giảm giá phải từ 0 đến 100");
      return false;
    }
    if (
      editForm.PointMultiplier !== undefined &&
      (editForm.PointMultiplier as number) < 0
    ) {
      setEditError("Hệ số nhân điểm phải là số không âm");
      return false;
    }
    return true;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier || !validateEditForm()) return;

    setIsUpdating(true);
    setEditError("");
    setEditSuccess("");

    try {
      const payload: UpdateTierConfigPayload = {
        TierName: editForm.TierName.trim(),
        MinSpent: editForm.MinSpent ?? 0,
        DiscountPercent: editForm.DiscountPercent ?? 0,
        PointMultiplier: editForm.PointMultiplier ?? 1,
        Status: editForm.Status ?? "Active",
      };
      await tierConfigService.updateTierConfig(editingTier.TierID, payload);
      setEditSuccess("Cập nhật hạng thành viên thành công!");
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingTier(null);
        setEditSuccess("");
        fetchData();
      }, 1500);
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await tierConfigService.deleteTierConfig(deleteTarget.TierID);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Cấu hình Hạng Thành viên
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý các hạng thành viên, quyền lợi và ưu đãi cho khách hàng
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
            Thêm hạng mới
          </button>
        </div>
      </div>

      {/* Delete Error */}
      {deleteError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">
              Không thể xóa hạng thành viên
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
      {!isLoading && !error && tiers.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <Trophy size={32} className="text-slate-400" />
          <p className="text-sm font-medium text-slate-600">
            Chưa có cấu hình hạng thành viên nào
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 transition"
          >
            <Plus size={16} />
            Tạo hạng đầu tiên
          </button>
        </div>
      )}

      {/* Tier Cards Grid */}
      {!isLoading && !error && tiers.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => {
            const isActive = tier.Status === "Active";
            return (
              <div
                key={tier.TierID}
                className={`rounded-xl border-2 p-5 transition shadow-sm bg-white ${
                  isActive
                    ? "border-rose-200 hover:border-rose-400 hover:shadow-md"
                    : "border-slate-200 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-xl p-3 ${
                        isActive ? "bg-rose-100" : "bg-slate-100"
                      }`}
                    >
                      {getTierIcon(tier.TierName)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-lg">
                        {tier.TierName}
                      </p>
                      <p className="text-xs text-slate-400">
                        Hạng #{tier.TierID}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isActive ? "Hoạt động" : "Ngừng"}
                  </span>
                </div>

                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-xs text-slate-500">
                      Chi tiêu tối thiểu
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      {formatNumber(tier.MinSpent)} đ
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-xs text-slate-500">Giảm giá</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {Number(tier.DiscountPercent).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-xs text-slate-500">Nhân điểm</span>
                    <span className="text-sm font-semibold text-rose-600">
                      x{Number(tier.PointMultiplier).toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => openEditModal(tier)}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                  >
                    <Edit size={14} />
                    Sửa
                  </button>
                  <button
                    onClick={() => setDeleteTarget(tier)}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
                  >
                    <Trash2 size={14} />
                    Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-rose-100 p-2">
                  <Plus size={20} className="text-rose-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Thêm hạng thành viên mới
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Tạo một hạng thành viên mới cho hệ thống loyalty
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
                  Tên hạng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="TierName"
                  value={createForm.TierName}
                  onChange={handleCreateInputChange}
                  placeholder="VD: VIP, Gold, Silver, Bronze"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Chi tiêu tối thiểu (đ)
                  </label>
                  <input
                    type="number"
                    name="MinSpent"
                    value={createForm.MinSpent}
                    onChange={handleCreateInputChange}
                    min="0"
                    placeholder="VD: 1000000"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Giảm giá (%)
                  </label>
                  <input
                    type="number"
                    name="DiscountPercent"
                    value={createForm.DiscountPercent}
                    onChange={handleCreateInputChange}
                    min="0"
                    max="100"
                    placeholder="VD: 15"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Hệ số nhân điểm
                </label>
                <input
                  type="number"
                  name="PointMultiplier"
                  value={createForm.PointMultiplier}
                  onChange={handleCreateInputChange}
                  min="0"
                  step="0.1"
                  placeholder="VD: 1.5"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Hệ số nhân điểm tích lũy (VD: 1.5 = nhân 1.5 lần mỗi giao dịch)
                </p>
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
                    "Tạo hạng"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Edit size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Chỉnh sửa hạng thành viên
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Cập nhật {editingTier.TierName}
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
                  Tên hạng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="TierName"
                  value={editForm.TierName}
                  onChange={handleEditInputChange}
                  placeholder="VD: VIP, Gold, Silver, Bronze"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Chi tiêu tối thiểu (đ)
                  </label>
                  <input
                    type="number"
                    name="MinSpent"
                    value={editForm.MinSpent}
                    onChange={handleEditInputChange}
                    min="0"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Giảm giá (%)
                  </label>
                  <input
                    type="number"
                    name="DiscountPercent"
                    value={editForm.DiscountPercent}
                    onChange={handleEditInputChange}
                    min="0"
                    max="100"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Hệ số nhân điểm
                </label>
                <input
                  type="number"
                  name="PointMultiplier"
                  value={editForm.PointMultiplier}
                  onChange={handleEditInputChange}
                  min="0"
                  step="0.1"
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
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                Xác nhận vô hiệu hóa hạng
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Bạn có chắc muốn vô hiệu hóa hạng "
                <span className="font-medium text-slate-700">
                  {deleteTarget.TierName}
                </span>
                "? Hạng này sẽ không còn áp dụng cho khách hàng mới.
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
                  "Vô hiệu hóa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTierConfig;
