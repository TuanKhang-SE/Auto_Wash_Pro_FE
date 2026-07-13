import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import axiosClient, { getErrorMessage } from "../../api/axiosClient";


const allowedLetters = "ABCDEFGHKLMNPSTUVXYZ";

const licensePlateRegex = new RegExp(
  `^(?:` +
    `\\d{2}-[${allowedLetters}]\\d \\d{3}\\.\\d{2}|` +
    `\\d{2}-[${allowedLetters}]\\d \\d{4}|` +
    `\\d{2}-[${allowedLetters}]{2} \\d{4}|` +
    `\\d{2}-[${allowedLetters}]{2} \\d{3}\\.\\d{2}` +
  `)$`
);

const registerCarSchema = z.object({
  LicensePlate: z
   .string()
    .trim()
    .min(1, "Vui lòng nhập biển số xe")
    .transform((value) =>
      value
        .toUpperCase()
        .replace(/\s+/g, " ")
    )
    .refine(
      (value) => licensePlateRegex.test(value),
      "Biển số phải đúng một trong các dạng: 29-B1 555.55, 73-K9 9999, 59-AB 1234 hoặc 59-AB 123.45"
    ),

  VehicleType: z
    .enum(["Xe máy", "Xe tay ga", "Mô tô"], {
      message: "Vui lòng chọn loại xe",
    }),

  Brand: z
    .string()
    .trim()
    .max(50, "Hãng xe quá dài")
    .transform((value) => value || "Không có"),

  Model: z
    .string()
    .trim()
    .max(50, "Model quá dài")
    .transform((value) => value || "Không có"),

  Color: z
    .string()
    .trim()
    .max(30, "Màu xe quá dài")
    .transform((value) => value || "Không có"),
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
    } catch (error: unknown) {
  console.log(error);

  setMessage(getErrorMessage(error) || "Đăng ký xe thất bại");
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
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Biển số xe <span className="text-red-500">*</span>
            </label>
            <input
              placeholder="Ví dụ: 59-F1 123.45"
              value={bienSoXe}
              onChange={(e) => setBienSoXe(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
    Biển số hợp lệ: 29-B1 555.55, 73-K9 9999, 59-AB 1234 hoặc 59-AB 123.45.
  </p>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Loại xe <span className="text-red-500">*</span>
            </label>
            <select
              value={loaiXe}
              onChange={(e) => setLoaiXe(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn loại xe</option>
              <option value="Xe máy">Xe máy</option>
              <option value="Xe tay ga">Xe tay ga</option>
              <option value="Mô tô">Mô tô</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Hãng xe (không bắt buộc)</label>
            <input
              placeholder="Ví dụ: Honda, Yamaha"
              value={hangXe}
              onChange={(e) => setHangXe(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

<p className="mt-1 text-xs text-gray-500">
    Nhập tên hãng xe, ví dụ: Honda, Yamaha, Suzuki, Toyota.
  </p>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Model (không bắt buộc)</label>
            <input
              placeholder="Ví dụ: Vision"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

<p className="mt-1 text-xs text-gray-500">
    Nhập dòng xe hoặc mẫu xe, ví dụ: Vision, Wave Alpha, Air Blade, Vios.
  </p>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Màu xe (không bắt buộc)</label>
            <input
              placeholder="Ví dụ: Đen"
              value={mauXe}
              onChange={(e) => setMauXe(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <p className="mt-1 text-xs text-gray-500">
    Nhập màu chính của xe, ví dụ: Đen, Trắng, Đỏ đen, Xanh bạc.
  </p>

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
