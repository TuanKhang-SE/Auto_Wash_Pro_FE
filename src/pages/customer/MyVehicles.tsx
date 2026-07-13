import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import axiosClient, { getErrorMessage } from "../../api/axiosClient";

type Vehicle = {
  VehicleID: number;
  LicensePlate: string;
  VehicleType?: string | null;
  Brand?: string | null;
  Model?: string | null;
  Color?: string | null;
  Status?: string | null;
  CreatedAt?: string | null;
};

type EditForm = {
  LicensePlate: string;
  VehicleType: string;
  Brand: string;
  Model: string;
  Color: string;
};

type VehicleBooking = {
  Status?: string | null;
  BookingItems?: Array<{ VehicleID?: number | null }>;
  Transactions?: Array<{ Status?: string | null }>;
};

function MyVehicles() {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockedVehicleIds, setLockedVehicleIds] = useState<Set<number>>(new Set());

  // Xe nào đang được sửa
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form sửa xe
  const [editForm, setEditForm] = useState<EditForm>({
    LicensePlate: "",
    VehicleType: "",
    Brand: "",
    Model: "",
    Color: "",
  });

  useEffect(() => {
    loadVehicles();
    // Chỉ tải dữ liệu một lần khi mở trang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadVehicles() {
    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const [vehicleResponse, bookingResponse] = await Promise.all([
        axiosClient.get("/api/vehicles", { headers }),
        axiosClient.get("/api/bookings/me", { headers }),
      ]);

      setVehicles(vehicleResponse.data.data || []);
      const lockedIds = new Set<number>();
      const bookings: VehicleBooking[] = bookingResponse.data?.data || [];
      bookings.forEach((booking) => {
        const isPaid = booking.Transactions?.some((transaction) => transaction.Status === "Paid");
        if (booking.Status === "Cancelled" || isPaid) return;
        booking.BookingItems?.forEach((item) => {
          const vehicleId = item.VehicleID;
          if (vehicleId) lockedIds.add(vehicleId);
        });
      });
      setLockedVehicleIds(lockedIds);
    } catch (error) {
      console.log(error);
      setMessage("Không thể tải danh sách xe");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date?: string | null) {
    if (!date) {
      return "Chưa có";
    }

    return new Date(date).toLocaleDateString("vi-VN");
  }

  function startEdit(vehicle: Vehicle) {
    if (lockedVehicleIds.has(vehicle.VehicleID)) {
      setMessage("Xe đang có lịch hẹn chưa thanh toán nên chưa thể chỉnh sửa");
      return;
    }
    setEditingId(vehicle.VehicleID);
    setEditForm({
      LicensePlate: vehicle.LicensePlate || "",
      VehicleType: vehicle.VehicleType || "",
      Brand: vehicle.Brand || "",
      Model: vehicle.Model || "",
      Color: vehicle.Color || "",
    });

    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);

    setEditForm({
      LicensePlate: "",
      VehicleType: "",
      Brand: "",
      Model: "",
      Color: "",
    });

    setMessage("");
  }

  async function saveEdit(vehicleId: number) {
  try {
    setMessage("");

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!editForm.LicensePlate.trim()) {
      setMessage("Biển số xe không được để trống");
      return;
    }

    if (!editForm.VehicleType) {
      setMessage("Vui lòng chọn loại xe");
      return;
    }

    const dataToUpdate = {
      LicensePlate: editForm.LicensePlate.trim().toUpperCase(),
      VehicleType: editForm.VehicleType.trim(),
      Brand: editForm.Brand.trim() || "Không có",
      Model: editForm.Model.trim() || "Không có",
      Color: editForm.Color.trim() || "Không có",
    };

    await axiosClient.put(`/api/vehicles/${vehicleId}`, dataToUpdate, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await loadVehicles();

    setEditingId(null);
    setMessage("Cập nhật thông tin xe thành công");
  } catch (error) {
    console.log(error);
    setMessage(getErrorMessage(error));
  }
}

  async function deleteVehicle(vehicleId: number) {
    if (lockedVehicleIds.has(vehicleId)) {
      setMessage("Xe đang có lịch hẹn chưa thanh toán nên chưa thể xóa");
      return;
    }
    const confirmDelete = window.confirm("Bạn có chắc muốn xóa xe này không?");

    if (!confirmDelete) {
      return;
    }

    try {
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      await axiosClient.delete(`/api/vehicles/${vehicleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Tạo danh sách mới, bỏ xe vừa xóa ra
      const newVehicles = vehicles.filter((vehicle) => {
        return vehicle.VehicleID !== vehicleId;
      });

      setVehicles(newVehicles);
      setMessage("Xóa xe thành công");
    } catch (error) {
      console.log(error);
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100 px-6 py-10">
        <button
  type="button"
  onClick={() => navigate(-1)}
  className="mb-4 text-sm font-medium text-gray-600 hover:text-blue-600"
>
  ← Quay lại
</button>
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Thông tin xe
              </h1>

              <p className="mt-2 text-slate-500">
                Danh sách xe bạn đã đăng ký trong hệ thống
              </p>
            </div>

            <Link
              to="/register-car"
              className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700"
            >
              Đăng ký xe mới
            </Link>
          </div>

          {message && (
            <div className="mb-6 rounded-lg bg-blue-50 px-4 py-3 text-blue-700">
              {message}
            </div>
          )}

          {loading && (
            <div className="rounded-2xl bg-white p-8 text-center shadow">
              <p className="text-slate-500">Đang tải danh sách xe...</p>
            </div>
          )}

          {!loading && vehicles.length === 0 && (
            <div className="rounded-2xl bg-white p-8 text-center shadow">
              <p className="text-slate-500">Bạn chưa đăng ký xe nào.</p>

              <Link
                to="/register-car"
                className="mt-5 inline-block rounded-lg bg-sky-600 px-5 py-2.5 font-semibold text-white hover:bg-sky-700"
              >
                Đăng ký xe ngay
              </Link>
            </div>
          )}

          {!loading && vehicles.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((vehicle) => {
                const isEditing = editingId === vehicle.VehicleID;
                const isLocked = lockedVehicleIds.has(vehicle.VehicleID);

                return (
                  <div
                    key={vehicle.VehicleID}
                    className="rounded-2xl bg-white p-6 shadow"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-slate-500">Biển số xe</p>

                        {isEditing ? (
                          <input
                            value={editForm.LicensePlate}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                LicensePlate: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-lg border px-3 py-2 font-bold text-sky-700"
                          />
                        ) : (
                          <h2 className="mt-1 text-2xl font-bold text-sky-700">
                            {vehicle.LicensePlate}
                          </h2>
                        )}
                      </div>

                      <span className="ml-3 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        {vehicle.Status || "Active"}
                      </span>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-slate-500">Loại xe</p>

                        {isEditing ? (
                          <select
                            value={editForm.VehicleType}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                VehicleType: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
                          >
                            <option value="">Chọn loại xe</option>
                            <option value="Xe máy">Xe máy</option>
                            <option value="Xe tay ga">Xe tay ga</option>
                            <option value="Mô tô">Mô tô</option>
                          </select>
                        ) : (
                          <p className="font-semibold text-slate-800">
                            {vehicle.VehicleType || "Không có"}
                          </p>
                        )}
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-slate-500">Hãng xe</p>

                        {isEditing ? (
                          <input
                            value={editForm.Brand}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                Brand: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-lg border px-3 py-2"
                          />
                        ) : (
                          <p className="font-semibold text-slate-800">
                            {vehicle.Brand || "Không có"}
                          </p>
                        )}
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-slate-500">Model</p>

                        {isEditing ? (
                          <input
                            value={editForm.Model}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                Model: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-lg border px-3 py-2"
                          />
                        ) : (
                          <p className="font-semibold text-slate-800">
                            {vehicle.Model || "Không có"}
                          </p>
                        )}
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-slate-500">Màu xe</p>

                        {isEditing ? (
                          <input
                            value={editForm.Color}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                Color: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-lg border px-3 py-2"
                          />
                        ) : (
                          <p className="font-semibold text-slate-800">
                            {vehicle.Color || "Không có"}
                          </p>
                        )}
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-slate-500">Ngày đăng ký</p>
                        <p className="font-semibold text-slate-800">
                          {formatDate(vehicle.CreatedAt)}
                        </p>
                      </div>
                    </div>

                    {isLocked && !isEditing && (
                      <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                        Xe đang có lịch hẹn chưa thanh toán. Không thể chỉnh sửa hoặc xóa.
                      </p>
                    )}

                    <div className="mt-5 flex gap-3">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(vehicle.VehicleID)}
                            className="flex-1 rounded-lg bg-green-600 py-2 font-semibold text-white hover:bg-green-700"
                          >
                            Lưu
                          </button>

                          <button
                            onClick={cancelEdit}
                            className="flex-1 rounded-lg bg-gray-200 py-2 font-semibold text-slate-700 hover:bg-gray-300"
                          >
                            Hủy
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(vehicle)}
                            disabled={isLocked}
                            className="flex-1 rounded-lg bg-yellow-500 py-2 font-semibold text-white hover:bg-yellow-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                          >
                            Chỉnh sửa
                          </button>

                          <button
                            onClick={() => deleteVehicle(vehicle.VehicleID)}
                            disabled={isLocked}
                            className="flex-1 rounded-lg bg-red-600 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                          >
                            Xóa xe
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default MyVehicles;
