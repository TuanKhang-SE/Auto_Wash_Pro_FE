import { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  CreditCard,
  Settings,
  Edit,
  Save,
  X,
  Loader2,
} from "lucide-react";
import branchService from "../../services/branchService";
import branchConfigService, {
  type BranchConfig,
  type UpsertBranchConfigPayload,
} from "../../services/branchConfigService";

// Model cấu hình chi nhánh cho form (string rỗng = chưa nhập).
// Hiển thị giờ từ ISO "1970-01-01T07:00:00.000Z" → "07:00".
const displayTime = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const m = iso.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : "—";
};

interface ConfigDraft {
  SlotDuration: string;
  TotalWashBays: string;
  BufferMinutes: string;
  CancelWindowHours: string;
}

const emptyConfigDraft: ConfigDraft = {
  SlotDuration: "",
  TotalWashBays: "",
  BufferMinutes: "",
  CancelWindowHours: "",
};

// Chuyển BranchConfig (DB) → ConfigDraft (form).
const configToDraft = (cfg: BranchConfig | null): ConfigDraft => ({
  SlotDuration: cfg?.SlotDuration != null ? String(cfg.SlotDuration) : "",
  TotalWashBays: cfg?.TotalWashBays != null ? String(cfg.TotalWashBays) : "",
  BufferMinutes: cfg?.BufferMinutes != null ? String(cfg.BufferMinutes) : "",
  CancelWindowHours:
    cfg?.CancelWindowHours != null ? String(cfg.CancelWindowHours) : "",
});

// Tên hiển thị tiếng Việt cho từng trường config.
const configLabels: Record<keyof ConfigDraft, string> = {
  SlotDuration: "Thời lượng slot (phút)",
  TotalWashBays: "Tổng số ô rửa",
  BufferMinutes: "Thời gian đệm (phút)",
  CancelWindowHours: "Thời hạn hủy (giờ)",
};

// Tìm trường config có giá trị không hợp lệ (không phải số nguyên ≥ 0 hoặc rỗng).
const findInvalidField = (
  draft: ConfigDraft
): { field: keyof ConfigDraft; label: string } | null => {
  for (const [field, label] of Object.entries(configLabels)) {
    const raw = (draft as any)[field] as string;
    if (raw === "") continue;
    const num = Number(raw);
    if (!Number.isFinite(num) || !Number.isInteger(num) || num < 0) {
      return { field: field as keyof ConfigDraft, label };
    }
  }
  return null;
};

// Build payload từ draft – bỏ trường rỗng, trả null nếu tất cả rỗng.
const buildConfigPayload = (
  draft: ConfigDraft,
  branchID: number
): UpsertBranchConfigPayload | null => {
  const payload: UpsertBranchConfigPayload = { BranchID: branchID };
  let hasAny = false;
  for (const field of Object.keys(configLabels) as Array<keyof ConfigDraft>) {
    const raw = (draft as any)[field] as string;
    if (raw === "") continue;
    (payload as any)[field] = Number(raw);
    hasAny = true;
  }
  return hasAny ? payload : null;
};

interface BranchInfo {
  BranchID: number;
  BranchName: string;
  Address: string | null;
  Phone: string | null;
  OpenTime: string | null; // ISO "1970-01-01T07:00:00.000Z" hoặc null
  CloseTime: string | null;
  BankAccount: string | null;
  Status: string | null;
  // config KHÔNG lấy từ /api/branches/:id (BE không trả).
  // Phần cấu hình dùng state `config` riêng, load qua /api/branch-configs.
}

const ManagerBranchInfo = () => {
  const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{
    BranchName?: string;
    Address?: string;
    Phone?: string;
    OpenTime?: string;
    CloseTime?: string;
    BankAccount?: string;
  }>({});

  // Trạng thái cấu hình chi nhánh.
  const [config, setConfig] = useState<BranchConfig | null>(null);
  const [editConfig, setEditConfig] = useState<ConfigDraft>({
    ...emptyConfigDraft,
  });
  const [configError, setConfigError] = useState("");
  const [configSuccess, setConfigSuccess] = useState("");

  useEffect(() => {
    fetchBranchInfo();
  }, []);

  const fetchBranchInfo = async () => {
    setIsLoading(true);
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      // Lấy BranchID từ user, hỗ trợ nhiều kiểu key BE có thể trả về.
      const branchID: number | null =
        user?.BranchID ??
        user?.branchID ??
        user?.branchId ??
        user?.BranchId ??
        null;

      if (!branchID) {
        console.warn("[ManagerBranchInfo] Không tìm thấy BranchID:", user);
        return;
      }

      // Lấy thông tin chi nhánh + cấu hình cùng lúc.
      const [branchResult, cfgResult] = await Promise.allSettled([
        branchService.getBranchById(branchID),
        branchConfigService.getBranchConfigByBranch(branchID),
      ]);

      if (branchResult.status === "fulfilled" && branchResult.value) {
        setBranchInfo(branchResult.value as BranchInfo);
      } else if (branchResult.status === "rejected") {
        console.error("[ManagerBranchInfo] Lỗi tải chi nhánh:", branchResult.reason);
      }

      if (cfgResult.status === "fulfilled") {
        setConfig(cfgResult.value);
        setEditConfig(configToDraft(cfgResult.value));
      } else if (cfgResult.status === "rejected") {
        console.error("[ManagerBranchInfo] Lỗi tải cấu hình:", cfgResult.reason);
      }
    } catch (err) {
      console.error("[ManagerBranchInfo] Lỗi tải thông tin chi nhánh:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    if (branchInfo) {
      setEditForm({
        BranchName: branchInfo.BranchName,
        Address: branchInfo.Address ?? undefined,
        Phone: branchInfo.Phone ?? undefined,
        OpenTime: displayTime(branchInfo.OpenTime),
        CloseTime: displayTime(branchInfo.CloseTime),
        BankAccount: branchInfo.BankAccount ?? undefined,
      });
      setConfigError("");
      setConfigSuccess("");
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({});
    setEditConfig(configToDraft(config));
    setConfigError("");
    setConfigSuccess("");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfigChange = (
    field: keyof ConfigDraft,
    value: string
  ) => {
    setEditConfig((prev) => ({ ...prev, [field]: value }));
    setConfigError("");
  };

  const handleSave = async () => {
    if (!branchInfo) return;

    // Validate config.
    const bad = findInvalidField(editConfig);
    if (bad) {
      setConfigError(
        `Giá trị "${bad.label}" phải là số nguyên ≥ 0 (hoặc để trống)`
      );
      return;
    }

    setIsLoading(true);
    setConfigError("");
    setConfigSuccess("");

    try {
      // Lưu thông tin chi nhánh (BE tự convert HH:mm → ISO).
      const updated = await branchService.updateBranch(
        branchInfo.BranchID,
        editForm as any
      );
      setBranchInfo(updated as BranchInfo);

      // Upsert cấu hình chi nhánh (chỉ khi có ít nhất 1 trường được nhập).
      let configSaved = true;
      const cfgPayload = buildConfigPayload(editConfig, branchInfo.BranchID);
      if (cfgPayload) {
        try {
          const saved = await branchConfigService.upsertBranchConfig(cfgPayload);
          setConfig(saved);
          setEditConfig(configToDraft(saved));
        } catch (cfgErr) {
          configSaved = false;
          console.error(
            "[ManagerBranchInfo] Lưu cấu hình chi nhánh thất bại:",
            cfgErr
          );
          const beMsg =
            (cfgErr as any)?.response?.data?.message ||
            (cfgErr as any)?.message ||
            "";
          setConfigError(
            `Cập nhật chi nhánh thành công nhưng lưu cấu hình thất bại${beMsg ? `: ${beMsg}` : "."}`
          );
        }
      }

      if (configSaved) {
        setConfigSuccess("Lưu thông tin và cấu hình thành công!");
        setTimeout(() => setConfigSuccess(""), 3000);
      }
      setIsEditing(false);
    } catch (err) {
      console.error("[ManagerBranchInfo] Lỗi lưu:", err);
      setConfigError(
        `Lỗi: ${(err as any)?.message || "Không rõ nguyên nhân"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !branchInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!branchInfo) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <p className="font-semibold">Không có thông tin chi nhánh</p>
        <p className="mt-2 text-xs">
          Tài khoản Manager hiện không liên kết với chi nhánh nào. Mở
          DevTools → Console để xem chi tiết user object được BE trả về.
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
            Thông tin Chi nhánh
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý thông tin và cấu hình chi nhánh của bạn
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
          >
            <Edit size={18} />
            Chỉnh sửa
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
            >
              <X size={18} />
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Lưu
            </button>
          </div>
        )}
      </div>

      {/* Alert messages */}
      {configError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {configError}
        </div>
      )}
      {configSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {configSuccess}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5">
              <Building2 size={24} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">
              Thông tin cơ bản
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-500">
                Tên chi nhánh
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="branchName"
                  value={editForm.BranchName || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              ) : (
                <p className="font-medium text-slate-800">{branchInfo.BranchName}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-500">
                <MapPin size={14} />
                Địa chỉ
              </label>
              {isEditing ? (
                <textarea
                  name="address"
                  value={editForm.Address || ""}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              ) : (
                <p className="font-medium text-slate-800">{branchInfo.Address}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-500">
                <Phone size={14} />
                Số điện thoại
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="phone"
                  value={editForm.Phone || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              ) : (
                <p className="font-medium text-slate-800">{branchInfo.Phone}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-500">
                <CreditCard size={14} />
                Tài khoản ngân hàng
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="bankAccount"
                  value={editForm.BankAccount || ""}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              ) : (
                <p className="font-medium text-slate-800">{branchInfo.BankAccount}</p>
              )}
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2.5">
              <Clock size={24} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">
              Giờ hoạt động
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
              <span className="text-sm text-slate-500">Giờ mở cửa</span>
              {isEditing ? (
                <input
                  type="time"
                  name="OpenTime"
                  value={editForm.OpenTime || ""}
                  onChange={handleInputChange}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                />
              ) : (
                <span className="font-semibold text-emerald-600">
                  {displayTime(branchInfo.OpenTime)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
              <span className="text-sm text-slate-500">Giờ đóng cửa</span>
              {isEditing ? (
                <input
                  type="time"
                  name="CloseTime"
                  value={editForm.CloseTime || ""}
                  onChange={handleInputChange}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                />
              ) : (
                <span className="font-semibold text-red-600">
                  {displayTime(branchInfo.CloseTime)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
              <span className="text-sm text-slate-500">Trạng thái</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                  branchInfo.Status === "Active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current"></span>
                {branchInfo.Status === "Active" ? "Hoạt động" : "Ngừng hoạt động"}
              </span>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2.5">
              <Settings size={24} className="text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">
              Cấu hình chi nhánh
            </h2>
          </div>

          {isEditing ? (
            <>
              {/* Form cấu hình khi đang chỉnh sửa */}
              <div className="mb-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {(Object.keys(configLabels) as Array<keyof ConfigDraft>).map(
                  (field) => (
                    <div key={field}>
                      <label className="mb-1.5 block text-xs font-medium text-slate-500">
                        {configLabels[field]}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={(editConfig as any)[field]}
                        onChange={(e) =>
                          handleConfigChange(field, e.target.value)
                        }
                        placeholder={
                          field === "TotalWashBays" ? "VD: 8" : "VD: 30"
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  )
                )}
              </div>
              <p className="text-xs text-slate-500">
                Để trống ô nếu không muốn thay đổi trường đó.
              </p>
            </>
          ) : (
            <>
              {/* Read-only display - đọc từ state `config` (đã load qua
                  GET /api/branch-configs), fallback null khi chưa có. */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ConfigCard
                  label="Phút / slot"
                  value={config?.SlotDuration ?? null}
                  color="text-purple-600"
                />
                <ConfigCard
                  label="Phút dự phòng"
                  value={config?.BufferMinutes ?? null}
                  color="text-amber-600"
                />
                <ConfigCard
                  label="Giờ hủy trước"
                  value={config?.CancelWindowHours ?? null}
                  color="text-red-600"
                />
              </div>
              {config?.TotalWashBays != null && (
                <div className="mt-4">
                  <ConfigCard
                    label="Tổng số ô rửa"
                    value={config.TotalWashBays}
                    color="text-cyan-600"
                  />
                </div>
              )}
              {!config && (
                <p className="mt-4 text-xs text-slate-500">
                  Chi nhánh chưa có cấu hình — bấm <strong>Chỉnh sửa</strong> để thêm.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Component hiển thị 1 ô cấu hình (read-only).
const ConfigCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null | undefined;
  color: string;
}) => (
  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-center">
    <p className={`text-2xl font-bold ${color}`}>
      {value != null ? value : "—"}
    </p>
    <p className="mt-1 text-xs text-slate-500">{label}</p>
  </div>
);

export default ManagerBranchInfo;
