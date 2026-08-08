/**
 * Khung xương hiện ngay khi bấm chuyển tab, trong lúc server còn dựng trang.
 *
 * Đặt ở cấp nhóm (app) nên mọi tab đều dùng chung, khỏi phải viết cho từng
 * route. Trang nào cần khung riêng thì thêm loading.tsx trong thư mục của nó.
 */
export default function Loading() {
  return (
    <div className="animate-pulse px-5 pt-6">
      <div className="bg-border h-8 w-40 rounded-lg" />
      <div className="bg-border mt-2 h-4 w-56 rounded" />

      <div className="mt-8 space-y-3">
        <div className="bg-border h-24 rounded-2xl" />
        <div className="bg-border h-24 rounded-2xl" />
        <div className="bg-border h-24 rounded-2xl" />
      </div>
    </div>
  );
}