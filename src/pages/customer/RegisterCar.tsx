import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import axiosClient from "../../api/axiosClient";



const registerCarSchema = z.object({
  LicensePlate: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập biển số xe")
    .min(5, "Biển số xe quá ngắn")
    .max(20, "Biển số xe quá dài")
    .regex(
      /^[A-Za-z0-9.\-\s]+$/,
      "Biển số chỉ được gồm chữ, số, dấu - hoặc dấu ."
    )
    .transform((value) => value.toUpperCase()),

  VehicleType: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập loại xe")
    .max(50, "Loại xe quá dài"),

  Brand: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập hãng xe")
    .max(50, "Hãng xe quá dài"),

  Model: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập model xe")
    .max(50, "Model quá dài"),

  Color: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập màu xe")
    .max(30, "Màu xe quá dài"),
});

function RegisterCar() {
  const navigate = useNavigate();

  const [bienSoXe, setBienSoXe] = useState("");
  const [loaiXe, setLoaiXe] = useState("");
  const [hangXe, setHangXe] = useState("");
  const [model, setModel] = useState("");
  const [mauXe, setMauXe] = useState("");
  const [message, setMessage] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");

    const formData = {
      LicensePlate: bienSoXe,
      VehicleType: loaiXe,
      Brand: hangXe,
      Model: model,
      Color: mauXe,
    };

    const result = registerCarSchema.safeParse(formData);

    if (!result.success) {
      setMessage(result.error.issues[0].message);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Bạn cần đăng nhập để đăng ký xe");
        return;
      }

      await axiosClient.post("/api/vehicles", result.data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage("Đăng ký xe thành công");
      navigate("/home");
    } catch (error: any) {
  console.log(error.response?.data || error);

  setMessage(error.response?.data?.message || "Đăng ký xe thất bại");
}
  }

  return (
    
    
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <button
    type="button"
    onClick={() => navigate(-1)}
    className="mb-4 text-sm font-medium text-gray-600 hover:text-blue-600"
  >
    ← Quay lại
  </button>
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Đăng ký xe
        </h1>

        <p className="text-center text-gray-500 mb-6">
          Thêm thông tin xe của bạn vào hệ thống
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            placeholder="Biển số xe, ví dụ: 59F1-12345"
            value={bienSoXe}
            onChange={(e) => setBienSoXe(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            placeholder="Loại xe, ví dụ: Xe máy, Ô tô"
            value={loaiXe}
            onChange={(e) => setLoaiXe(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            placeholder="Hãng xe, ví dụ: Honda, Yamaha"
            value={hangXe}
            onChange={(e) => setHangXe(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            placeholder="Model, ví dụ: Vision"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            placeholder="Màu xe, ví dụ: Đen"
            value={mauXe}
            onChange={(e) => setMauXe(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />

          {message && (
            <p className="text-center text-sm text-red-500">{message}</p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Đăng ký xe
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterCar;