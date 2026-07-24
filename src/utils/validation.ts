import { z } from "zod";

export const phoneSchema = z
  .string()
  .min(1, "Số điện thoại không được để trống")
  .regex(
    /^(0[2|3|5|7|8|9])[0-9]{8}$/,
    "Số điện thoại không hợp lệ (VD: 0912345678 hoặc 0283456789)"
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

export const fullNameSchema = z
  .string()
  .min(1, "Họ tên không được để trống")
  .max(100, "Họ tên không được vượt quá 100 ký tự")
  .regex(
    /^[\w\sÀ-ỹà-ỹ]+$/,
    "Họ tên không được chứa ký tự đặc biệt"
  );

export const validateFullName = (fullName: string) => {
  return fullNameSchema.safeParse(fullName);
};

export const validateFullNameOptional = (fullName: string) => {
  if (!fullName || fullName.trim() === "") {
    return { success: true, error: null };
  }
  return fullNameSchema.safeParse(fullName);
};

export const branchNameSchema = z
  .string()
  .min(1, "Tên chi nhánh không được để trống")
  .max(100, "Tên chi nhánh không được vượt quá 100 ký tự")
  .regex(
    /^[\w\sÀ-ỹà-ỹ]+$/,
    "Tên chi nhánh không được chứa ký tự đặc biệt"
  );

export const validateBranchName = (branchName: string) => {
  return branchNameSchema.safeParse(branchName);
};
