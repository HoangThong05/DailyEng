/**
 * Đọc biến môi trường Supabase và báo lỗi rõ ràng nếu thiếu,
 * thay vì để supabase-js ném lỗi khó hiểu ở sâu bên trong.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Nút Connect trên dashboard sinh ra PUBLISHABLE_KEY, còn tài liệu cũ dùng
  // ANON_KEY. Nhận cả hai để dán thẳng từ dashboard vào là chạy.
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL, hoặc thiếu cả " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY lẫn NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
        "Chép .env.local.example thành .env.local rồi điền key lấy từ nút Connect " +
        "trên Supabase dashboard.",
    );
  }

  return { url, key };
}
