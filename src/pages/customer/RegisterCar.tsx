import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import Washing from "../../assets/Washing.jpg";

function RegisterCar() {
  const navigate = useNavigate();

  const [bienSoXe, setBienSoXe] = useState("");
  const [loaiXe, setLoaiXe] = useState("");
  const [hangXe, setHangXe] = useState("");
  const [model, setModel] = useState("");
  const [mauXe, setMauXe] = useState("");
  const [message, setMessage] = useState("");

  async function handleRegister(e: { preventDefault: () => void }) {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Bạn cần đăng nhập để đăng ký xe");
        return;
      }

      await axiosClient.post(
        "/api/vehicles",
        {
          LicensePlate: bienSoXe,
          VehicleType: loaiXe,
          Brand: hangXe,
          Model: model,
          Color: mauXe,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Đăng ký xe thành công");
      navigate("/home");
    } catch (error) {
      console.log(error);
      setMessage("Đăng ký xe thất bại");
    }
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center px-4"
      style={{ backgroundImage: `url(${Washing})` }}
    >
      <div className="w-full max-w-md bg-white/95 rounded-2xl shadow-lg p-8 backdrop-blur-sm">
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

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Đăng ký xe
          </button>
        </form>

        {message && (
          <p className="text-center mt-4 text-sm text-red-500">{message}</p>
        )}
      </div>
    </div>
  );
}

export default RegisterCar;