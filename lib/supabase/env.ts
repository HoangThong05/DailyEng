/**
 * Đọc biến môi trường Supabase và báo lỗi rõ ràng nếu thiếu,
 * thay vì để supabase-js ném lỗi khó hiểu ở sâu bên trong.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Chép .env.local.example thành .env.local rồi điền key từ Supabase dashboard " +
        "(Project Settings → API).",
    );
  }

  return { url, key };
}
