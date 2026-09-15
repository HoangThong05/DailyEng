import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "../_components/doc-page";

export const metadata: Metadata = { title: "Điều khoản sử dụng" };

export default function DieuKhoanPage() {
  return (
    <DocPage
      title="Điều khoản sử dụng"
      subtitle="Ngắn gọn, vì DailyEng là một app học miễn phí của cá nhân."
    >
      <h2>Dịch vụ</h2>
      <p>
        DailyEng cung cấp miễn phí, nguyên trạng, để học tiếng Anh. Tác giả cố
        gắng giữ app chạy ổn định nhưng không cam kết thời gian hoạt động hay
        không có lỗi. Tính năng có thể thay đổi, thêm hoặc bớt mà không báo
        trước.
      </p>

      <h2>Tài khoản</h2>
      <ul>
        <li>Bạn chịu trách nhiệm giữ bí mật thông tin đăng nhập của mình.</li>
        <li>
          Tên hiển thị không được chứa nội dung xúc phạm hay mạo danh người
          khác. Tài khoản vi phạm có thể bị ẩn khỏi bảng xếp hạng hoặc xoá.
        </li>
        <li>Mỗi người dùng một tài khoản; không dùng công cụ tự động để gian lận XP.</li>
      </ul>

      <h2>Nội dung</h2>
      <ul>
        <li>
          Bộ từ có sẵn thuộc về DailyEng, bạn được dùng để học cá nhân. Bộ từ
          bạn tự tạo thuộc về bạn; app chỉ lưu để bạn học.
        </li>
        <li>
          Ảnh minh hoạ lấy từ Pixabay theo giấy phép của Pixabay; linh vật vịt
          và ảnh bìa do tác giả tạo.
        </li>
      </ul>

      <h2>Giới hạn trách nhiệm</h2>
      <p>
        DailyEng là công cụ hỗ trợ học tập, không thay thế khoá học chính thức
        hay bảo đảm kết quả thi. Điểm mock test chỉ mang tính tham khảo.
      </p>

      <h2>Liên hệ</h2>
      <p>
        Câu hỏi về điều khoản hay quyền riêng tư: xem{" "}
        <Link href="/gioi-thieu/bao-mat">Chính sách quyền riêng tư</Link> hoặc gửi{" "}
        <Link href="/gioi-thieu/gop-y">Góp ý</Link>.
      </p>

      <p className="text-sm">Cập nhật lần cuối: tháng 9/2026.</p>
    </DocPage>
  );
}
