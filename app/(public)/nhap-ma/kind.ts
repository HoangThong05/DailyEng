/** Màn nhập mã dùng chung cho xác nhận đăng ký và khôi phục mật khẩu. */
export type VerifyKind = "dang-ky" | "khoi-phuc";

/** Tham số `?loai=` trên URL / trường ẩn `kind` trong form. */
export function readVerifyKind(value: unknown): VerifyKind {
  return value === "khoi-phuc" ? "khoi-phuc" : "dang-ky";
}
