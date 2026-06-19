import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "isAxiosError" in error) {
    const e = error as Record<string, unknown>;
    const data = (e.response as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined;
    if (data?.message) return String(data.message);
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const first = data.errors[0];
      if (typeof first === "string") return first;
      if (typeof first === "object" && first !== null && "message" in first) {
        return String((first as Record<string, unknown>).message);
      }
    }
    if (typeof e.message === "string") return e.message;
  }
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const e = error as Record<string, unknown>;
    if (typeof e.message === "string") return e.message;
  }
  return "Đã xảy ra lỗi không xác định";
}

export default axiosClient;