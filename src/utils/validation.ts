import { z } from "zod";

export const phoneSchema = z
  .string()
  .min(1, "Số điện thoại không được để trống")
  .regex(
    /^(0[3|5|7|8|9])[0-9]{8}$/,
    "Số điện thoại không hợp lệ (VD: 0912345678)"
  );

export const validatePhone = (phone: string) => {
  return phoneSchema.safeParse(phone);
};

export const validatePhoneOptional = (phone: string) => {
  if (!phone || phone.trim() === "") {
    return { success: true, error: null };
  }
  return phoneSchema.safeParse(phone);
};
