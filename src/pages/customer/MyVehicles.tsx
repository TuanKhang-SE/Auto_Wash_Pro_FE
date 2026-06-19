import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import axiosClient from "../../api/axiosClient";

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

function MyVehicles() {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

      const res = await axiosClient.get("/api/vehicles", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setVehicles(res.data.data || []);
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
    // Lưu id xe đang sửa
    setEditingId(vehicle.VehicleID);

    // Đổ dữ liệu xe vào form sửa
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

    const dataToUpdate = {
      LicensePlate: editForm.LicensePlate.trim().toUpperCase(),
      VehicleType: editForm.VehicleType.trim(),
      Brand: editForm.Brand.trim(),
      Model: editForm.Model.trim(),
      Color: editForm.Color.trim(),
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
    setMessage("Cập nhật thông tin xe thất bại");
  }
}

  async function deleteVehicle(vehicleId: number) {
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
      setMessage("Xóa xe thất bại");
    }
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-100 px-6 py-10">
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
                          <input
                            value={editForm.VehicleType}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                VehicleType: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-lg border px-3 py-2"
                          />
                        ) : (
                          <p className="font-semibold text-slate-800">
                            {vehicle.VehicleType || "Chưa cập nhật"}
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
                            {vehicle.Brand || "Chưa cập nhật"}
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
                            {vehicle.Model || "Chưa cập nhật"}
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
                            {vehicle.Color || "Chưa cập nhật"}
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
                            className="flex-1 rounded-lg bg-yellow-500 py-2 font-semibold text-white hover:bg-yellow-600"
                          >
                            Chỉnh sửa
                          </button>

                          <button
                            onClick={() => deleteVehicle(vehicle.VehicleID)}
                            className="flex-1 rounded-lg bg-red-600 py-2 font-semibold text-white hover:bg-red-700"
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