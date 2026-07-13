import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Sparkles,
  Plus,
  RefreshCw,
  AlertCircle,
  X,
  Check,
  Trash2,
  Search,
  Tag,
  Building2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import serviceService, { type Service } from "../../services/serviceService";
import branchServiceService, {
  type BranchService,
  type UpdateBranchServicePayload,
} from "../../services/branchServiceService";
import { getErrorMessage } from "../../api/axiosClient";

const formatVnd = (value: number | string | null | undefined): string => {
  const n = Number(value) || 0;
  return new Intl.NumberFormat("vi-VN").format(n) + " đ";
};

type Tab = "available" | "applied";

const ManagerServices = () => {
  const getBranchId = (): number | null => {
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      return user?.BranchID ?? user?.branchId ?? null;
    } catch (e) {
      return null;
    }
  };

  const branchId = useMemo(() => getBranchId(), []);

  const [services, setServices] = useState<Service[]>([]); // admin's full catalog
  const [branchServices, setBranchServices] = useState<BranchService[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isLoadingBranch, setIsLoadingBranch] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("available");

  // Add modal
  const [addTarget, setAddTarget] = useState<Service | null>(null);
  const [addPriceOverride, setAddPriceOverride] = useState<string>("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Edit (price override / status) modal
  const [editingBranchService, setEditingBranchService] =
    useState<BranchService | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [editStatus, setEditStatus] = useState<"Active" | "Inactive">("Active");
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [clearOverride, setClearOverride] = useState(false);

  // Remove modal
  const [removeTarget, setRemoveTarget] = useState<BranchService | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");

  const appliedServiceIds = useMemo(
    () => new Set(branchServices.map((bs) => bs.ServiceID)),
    [branchServices]
  );

  const servicesMap = useRef<Record<number, Service>>({});

  const mergeBranchServicesWithCatalog = useCallback(
    (bs: BranchService[]): BranchService[] => {
      const catalog = servicesMap.current;
      return bs.map((item) => ({
        ...item,
        ServiceName: item.ServiceName || catalog[item.ServiceID]?.ServiceName || "",
        Description: item.Description ?? catalog[item.ServiceID]?.Description ?? null,
        ImageURL: item.ImageURL ?? catalog[item.ServiceID]?.ImageURL ?? null,
        BasePrice: item.BasePrice ?? catalog[item.ServiceID]?.BasePrice ?? catalog[item.ServiceID]?.Price ?? 0,
        DurationMinutes: item.DurationMinutes ?? catalog[item.ServiceID]?.DurationMinutes ?? catalog[item.ServiceID]?.Duration ?? 0,
        Duration: item.Duration ?? catalog[item.ServiceID]?.Duration ?? catalog[item.ServiceID]?.DurationMinutes ?? 0,
      }));
    },
    []
  );

  const fetchCatalog = useCallback(async () => {
    setIsLoadingCatalog(true);
    try {
      const data = await serviceService.getAllServices();
      setServices(data);
      servicesMap.current = Object.fromEntries(data.map((s) => [s.ServiceID, s]));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  const fetchBranchServices = useCallback(async () => {
    if (!branchId) {
      setIsLoadingBranch(false);
      return;
    }
    setIsLoadingBranch(true);
    try {
      const data = await branchServiceService.getServicesByBranch(branchId);
      setBranchServices(mergeBranchServicesWithCatalog(data));
    } catch (err) {
      console.error("Error fetching branch services:", err);
    } finally {
      setIsLoadingBranch(false);
    }
  }, [branchId, mergeBranchServicesWithCatalog]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  useEffect(() => {
    if (services.length > 0) {
      fetchBranchServices();
    }
  }, [services, fetchBranchServices]);

  const visibleServices = useMemo(() => { 
    const q = searchQuery.trim().toLowerCase();
    const source =
      activeTab === "available"
        ? services.filter((s) => !appliedServiceIds.has(s.ServiceID))
        : []; // applied tab uses branchServices data
    return source.filter((s) => {
      if (!q) return true;
      return (
        s.ServiceName?.toLowerCase().includes(q) ||
        (s.Description ?? "").toLowerCase().includes(q)
      );
    });
  }, [services, searchQuery, appliedServiceIds, activeTab]);

  const visibleBranchServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return branchServices.filter((bs) => {
      if (!q) return true;
      return (
        bs.ServiceName?.toLowerCase().includes(q) ||
        (bs.Description ?? "").toLowerCase().includes(q)
      );
    });
  }, [branchServices, searchQuery]);

  // ----- Add to branch -----
  const openAddModal = (svc: Service) => {
    setAddTarget(svc);
    setAddPriceOverride("");
    setAddError("");
    setAddSuccess("");
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTarget || !branchId) return;

    const trimmed = addPriceOverride.trim();
    if (trimmed && (Number(trimmed) < 0 || isNaN(Number(trimmed)))) {
      setAddError("Giá riêng phải là số không âm");
      return;
    }

    setIsAdding(true);
    setAddError("");
    setAddSuccess("");
    try {
      const payload = {
        ServiceID: addTarget.ServiceID,
        PriceOverride: trimmed === "" ? null : Number(trimmed),
        Status: "Active" as const,
      };
      await branchServiceService.addServiceToBranch(branchId, payload); // POST /api/branches/:id/services
      setAddSuccess("Đã thêm dịch vụ vào chi nhánh!");
      setTimeout(async () => {
        setAddTarget(null);
        setAddSuccess("");
        setSearchQuery("");
        await Promise.all([fetchCatalog(), fetchBranchServices()]);
        setActiveTab("applied");
      }, 1000);
    } catch (err) {
      setAddError(getErrorMessage(err));
    } finally {
      setIsAdding(false);
    }
  };

  // ----- Edit (price/status) -----
  const openEditBranchService = (bs: BranchService) => {
    setEditingBranchService(bs);
    setEditPrice(
      bs.PriceOverride !== null && bs.PriceOverride !== undefined
        ? String(bs.PriceOverride)
        : ""
    );
    setClearOverride(false);
    setEditStatus((bs.Status as "Active" | "Inactive") ?? "Active");
    setEditError("");
    setEditSuccess("");
  };

  const handleUpdateBranchService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranchService) return;
    const trimmed = editPrice.trim();
    if (trimmed && (Number(trimmed) < 0 || isNaN(Number(trimmed)))) {
      setEditError("Giá riêng phải là số không âm");
      return;
    }
    setIsUpdating(true);
    setEditError("");
    setEditSuccess("");
    try {
      const payload: UpdateBranchServicePayload = {
        PriceOverride: clearOverride || trimmed === "" ? null : Number(trimmed),
        Status: editStatus,
      };
      await branchServiceService.updateBranchService(
        editingBranchService.BranchServiceID,
        payload
      ); // PUT /api/branch-services/:id
      setEditSuccess("Cập nhật thành công!");
      setTimeout(async () => {
        setEditingBranchService(null);
        setEditSuccess("");
        await fetchBranchServices();
      }, 1000);
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  // ----- Remove -----
  const handleRemove = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    setRemoveError("");
    try {
      await branchServiceService.removeBranchService(
        removeTarget.BranchServiceID
      ); // DELETE /api/branch-services/:id
      setRemoveTarget(null);
      await Promise.all([fetchCatalog(), fetchBranchServices()]);
    } catch (err) {
      setRemoveError(getErrorMessage(err));
    } finally {
      setIsRemoving(false);
    }
  };

  const handleToggleBranchServiceStatus = async (bs: BranchService) => {
    const next: "Active" | "Inactive" =
      bs.Status === "Active" ? "Inactive" : "Active";
    try {
      await branchServiceService.updateBranchService(bs.BranchServiceID, {
        Status: next,
      });
      await fetchBranchServices();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (branchId === null) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle size={32} className="text-red-500" />
        <p className="text-sm font-medium text-red-700">
          Không tìm thấy thông tin chi nhánh của bạn
        </p>
        <p className="text-xs text-red-500">
          Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Dịch vụ của Chi nhánh
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Chọn các dịch vụ do Admin tạo để áp dụng cho chi nhánh của bạn. Bạn
            có thể tùy chỉnh giá riêng và bật/tắt từng dịch vụ.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchCatalog();
              fetchBranchServices();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition"
          >
            <RefreshCw size={16} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setActiveTab("available")}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                activeTab === "available"
                  ? "bg-white text-blue-600 shadow"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <Plus size={14} />
              Chọn thêm dịch vụ
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                {services.filter((s) => !appliedServiceIds.has(s.ServiceID))
                  .length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("applied")}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                activeTab === "applied"
                  ? "bg-white text-blue-600 shadow"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <Building2 size={14} />
              Dịch vụ đang áp dụng
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                {branchServices.length}
              </span>
            </button>
          </div>
          <div className="relative w-full max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm dịch vụ..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="px-4 py-2 text-xs text-slate-500">
          {activeTab === "available"
            ? `Có ${visibleServices.length} dịch vụ khả dụng chưa được áp dụng`
            : `Chi nhánh đang áp dụng ${visibleBranchServices.length} / ${branchServices.length} dịch vụ`}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Có lỗi xảy ra</p>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="rounded-lg p-1 text-red-400 hover:bg-red-100 hover:text-red-600 transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Available tab */}
      {activeTab === "available" && (
        <>
          {isLoadingCatalog || isLoadingBranch ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : visibleServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <CheckCircle2 size={36} className="text-emerald-400" />
              <p className="text-sm font-medium text-slate-700">
                {services.length === 0
                  ? "Admin chưa tạo dịch vụ nào"
                  : "Chi nhánh đã áp dụng tất cả dịch vụ"}
              </p>
              <p className="text-xs text-slate-500 max-w-md">
                {services.length === 0
                  ? "Chưa có dịch vụ nào trong hệ thống. Vui lòng liên hệ Admin để tạo dịch vụ."
                  : "Bạn đã chọn tất cả dịch vụ hiện có. Hãy vào tab 'Dịch vụ đang áp dụng' để quản lý."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Tên dịch vụ</th>
                    <th className="px-4 py-3">Mô tả</th>
                    <th className="px-4 py-3">Giá gốc</th>
                    <th className="px-4 py-3">Thời lượng</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleServices.map((svc) => (
                    <tr key={svc.ServiceID} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
                                <Sparkles size={18} className="text-blue-300" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{svc.ServiceName}</div>
                            <div className="text-xs text-slate-400">#{svc.ServiceID}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs">
                        <div className="line-clamp-2">{svc.Description || "—"}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-blue-600">
                        {formatVnd(svc.BasePrice ?? svc.Price)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {svc.DurationMinutes ?? svc.Duration} phút
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            svc.Status === "Active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {svc.Status === "Active" ? "Hoạt động" : "Admin đã tắt"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openAddModal(svc)}
                          disabled={svc.Status !== "Active"}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition"
                        >
                          <Plus size={14} />
                          Áp dụng
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Applied tab */}
      {activeTab === "applied" && (
        <>
          {isLoadingBranch ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : branchServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <Sparkles size={36} className="text-slate-400" />
              <p className="text-sm font-medium text-slate-700">
                Chi nhánh chưa áp dụng dịch vụ nào
              </p>
              <p className="text-xs text-slate-500 max-w-md">
                Vào tab "Chọn thêm dịch vụ" để chọn các dịch vụ do Admin cung cấp
                cho chi nhánh của bạn.
              </p>
              <button
                onClick={() => setActiveTab("available")}
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                <Plus size={16} />
                Chọn dịch vụ ngay
              </button>
            </div>
          ) : visibleBranchServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <Search size={28} className="text-slate-400" />
              <p className="text-sm font-medium text-slate-600">
                Không tìm thấy dịch vụ phù hợp
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Tên dịch vụ</th>
                    <th className="px-4 py-3">Mô tả</th>
                    <th className="px-4 py-3">Giá tại chi nhánh</th>
                    <th className="px-4 py-3">Giá gốc</th>
                    <th className="px-4 py-3">Thời lượng</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleBranchServices.map((bs) => {
                    // priceToShow: giá hiển thị = PriceOverride nếu có, không thì lấy BasePrice (giá gốc Admin)
                    const priceToShow =
                      bs.PriceOverride !== null && bs.PriceOverride !== undefined
                        ? Number(bs.PriceOverride)
                        : Number(bs.BasePrice ?? 0);
                    // hasOverride: true khi Manager đã tự sửa giá riêng cho chi nhánh (khác giá gốc Admin)
                    const hasOverride =
                      bs.PriceOverride !== null && bs.PriceOverride !== undefined;
                    const isActive = bs.Status === "Active";
                    return (
                      <tr key={bs.BranchServiceID} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50">
                              {bs.ImageURL ? (
                                <img
                                  src={bs.ImageURL}
                                  alt={bs.ServiceName}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Sparkles size={18} className="text-emerald-300" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">{bs.ServiceName || `Service #${bs.ServiceID}`}</div>
                              <div className="text-xs text-slate-400">#{bs.ServiceID}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs">
                          <div className="line-clamp-2">{bs.Description || "—"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-emerald-600">
                            {formatVnd(priceToShow)}
                          </span>
                          {/* hasOverride: true khi Manager đã tự sửa giá riêng cho chi nhánh (khác giá gốc Admin) */}
                          {hasOverride && (
                            <div className="text-[10px] text-amber-600">* Đang ghi đè</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatVnd(bs.BasePrice)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {bs.Duration ?? "-"} phút
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleBranchServiceStatus(bs)}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                              isActive
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                            }`}
                          >
                            {isActive ? "Đang bật" : "Đã tắt"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openEditBranchService(bs)}
                            className="mr-1 rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition"
                            title="Sửa giá"
                          >
                            <Tag size={16} />
                          </button>
                          <button
                            onClick={() => setRemoveTarget(bs)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition"
                            title="Gỡ dịch vụ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Add Modal */}
      {addTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Plus size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Áp dụng dịch vụ
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {addTarget.ServiceName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddTarget(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-5 space-y-4">
              {addError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {addError}
                </div>
              )}
              {addSuccess && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-600">
                  <Check size={16} />
                  {addSuccess}
                </div>
              )}

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                  Thông tin dịch vụ
                </p>
                <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Giá mặc định</p>
                    <p className="font-semibold text-blue-700">
                      {formatVnd(addTarget.BasePrice ?? addTarget.Price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Thời lượng</p>
                    <p className="font-semibold text-blue-700">
                      {addTarget.DurationMinutes ?? addTarget.Duration} phút
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Giá riêng cho chi nhánh (tùy chọn)
                </label>
                <input
                  type="number"
                  value={addPriceOverride}
                  onChange={(e) => setAddPriceOverride(e.target.value)}
                  min="0"
                                    placeholder={`Để trống = dùng giá gốc ${formatVnd(
                    addTarget.BasePrice ?? addTarget.Price
                  )}`}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Bạn có thể bỏ trống nếu muốn dùng giá mặc định của Admin, hoặc
                  nhập giá riêng cho chi nhánh.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddTarget(null)}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {isAdding ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Đang xử lý...
                    </span>
                  ) : (
                    "Áp dụng"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit (price/status) Modal */}
      {editingBranchService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Tag size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Cập nhật giá & trạng thái
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {editingBranchService.ServiceName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingBranchService(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateBranchService} className="p-5 space-y-4">
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

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                Giá gốc Admin đặt:{" "}
                <span className="font-semibold text-slate-800">
                  {formatVnd(editingBranchService.BasePrice)}
                </span>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Giá riêng (tùy chọn)
                </label>
                <input
                  type="number"
                  value={editPrice}
                  disabled={clearOverride}
                  onChange={(e) => setEditPrice(e.target.value)}
                  min="0"
                  placeholder="Để trống = dùng giá gốc"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400"
                />
                <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={clearOverride}
                    onChange={(e) => setClearOverride(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Xóa giá riêng, quay về giá gốc của Admin
                </label>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Trạng thái tại chi nhánh
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus("Active")}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition ${
                      editStatus === "Active"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    Đang bật
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus("Inactive")}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition ${
                      editStatus === "Inactive"
                        ? "border-slate-500 bg-slate-100 text-slate-700"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <XCircle size={16} />
                    Đã tắt
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBranchService(null)}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
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

      {/* Remove Confirmation Modal */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                Gỡ dịch vụ khỏi chi nhánh
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Bạn có chắc muốn gỡ "
                <span className="font-medium text-slate-700">
                  {removeTarget.ServiceName}
                </span>
                "? Khách hàng sẽ không thể chọn dịch vụ này nữa cho đến khi bạn
                chọn lại.
              </p>
            </div>

            {removeError && (
              <div className="mx-6 mb-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 text-left">
                {removeError}
              </div>
            )}

            <div className="flex gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={() => setRemoveTarget(null)}
                disabled={isRemoving}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isRemoving}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition"
              >
                {isRemoving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Đang gỡ...
                  </span>
                ) : (
                  "Gỡ dịch vụ"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerServices;
