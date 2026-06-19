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

function MyVehicles() {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);

  const [editLicensePlate, setEditLicensePlate] = useState("");
  const [editVehicleType, setEditVehicleType] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editColor, setEditColor] = useState("");

  useEffect(() => {
    async function fetchVehicles() {
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

    fetchVehicles();
  }, [navigate]);

  function formatDate(date?: string | null) {
    if (!date) return "Chưa có";

    return new Date(date).toLocaleDateString("vi-VN");
  }

  function handleStartEdit(vehicle: Vehicle) {
    setEditingVehicleId(vehicle.VehicleID);

    setEditLicensePlate(vehicle.LicensePlate || "");
    setEditVehicleType(vehicle.VehicleType || "");
    setEditBrand(vehicle.Brand || "");
    setEditModel(vehicle.Model || "");
    setEditColor(vehicle.Color || "");

    setMessage("");
  }

  function handleCancelEdit() {
    setEditingVehicleId(null);

    setEditLicensePlate("");
    setEditVehicleType("");
    setEditBrand("");
    setEditModel("");
    setEditColor("");

    setMessage("");
  }

  async function handleUpdateVehicle(vehicleId: number) {
    try {
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      if (!editLicensePlate.trim()) {
        setMessage("Biển số xe không được để trống");
        return;
      }

      const updatedData = {
        LicensePlate: editLicensePlate.trim().toUpperCase(),
        VehicleType: editVehicleType.trim(),
        Brand: editBrand.trim(),
        Model: editModel.trim(),
        Color: editColor.trim(),
      };

      await axiosClient.put(`/api/vehicles/${vehicleId}`, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setVehicles((oldVehicles) =>
        oldVehicles.map((vehicle) =>
          vehicle.VehicleID === vehicleId
            ? {
                ...vehicle,
                ...updatedData,
              }
            : vehicle
        )
      );

      setEditingVehicleId(null);
      setMessage("Cập nhật thông tin xe thành công");
    } catch (error) {
      console.log(error);
      setMessage("Cập nhật thông tin xe thất bại");
    }
  }

  async function handleDeleteVehicle(vehicleId: number) {
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

      setVehicles((oldVehicles) =>
        oldVehicles.filter((vehicle) => vehicle.VehicleID !== vehicleId)
      );

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
              className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white transition hover:bg-sky-700"
            >
              Đăng ký xe mới
            </Link>
          </div>

          {message && (
            <div className="mb-6 rounded-lg bg-blue-50 px-4 py-3 text-blue-700">
              {message}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow">
              <p className="text-slate-500">Đang tải danh sách xe...</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow">
              <p className="text-slate-500">Bạn chưa đăng ký xe nào.</p>

              <Link
                to="/register-car"
                className="mt-5 inline-block rounded-lg bg-sky-600 px-5 py-2.5 font-semibold text-white transition hover:bg-sky-700"
              >
                Đăng ký xe ngay
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((vehicle) => {
                const isEditing = editingVehicleId === vehicle.VehicleID;

                return (
                  <div
                    key={vehicle.VehicleID}
                    className="rounded-2xl bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-slate-500">Biển số xe</p>

                        {isEditing ? (
                          <input
                            value={editLicensePlate}
                            onChange={(e) =>
                              setEditLicensePlate(e.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-bold text-sky-700 outline-none focus:ring-2 focus:ring-sky-500"
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
                            value={editVehicleType}
                            onChange={(e) =>
                              setEditVehicleType(e.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
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
                            value={editBrand}
                            onChange={(e) => setEditBrand(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
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
                            value={editModel}
                            onChange={(e) => setEditModel(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
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
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
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
                            onClick={() =>
                              handleUpdateVehicle(vehicle.VehicleID)
                            }
                            className="flex-1 rounded-lg bg-green-600 py-2 font-semibold text-white transition hover:bg-green-700"
                          >
                            Lưu
                          </button>

                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 rounded-lg bg-gray-200 py-2 font-semibold text-slate-700 transition hover:bg-gray-300"
                          >
                            Hủy
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(vehicle)}
                            className="flex-1 rounded-lg bg-yellow-500 py-2 font-semibold text-white transition hover:bg-yellow-600"
                          >
                            Chỉnh sửa
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteVehicle(vehicle.VehicleID)
                            }
                            className="flex-1 rounded-lg bg-red-600 py-2 font-semibold text-white transition hover:bg-red-700"
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