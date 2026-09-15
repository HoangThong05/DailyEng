import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { DocPage } from "../_components/doc-page";

export const metadata: Metadata = { title: "Chính sách bảo mật" };

export default function BaoMatPage() {
  return (
    <DocPage
      title="Chính sách bảo mật"
      subtitle="DailyEng thu thập gì, dùng vào việc gì, và bạn kiểm soát ra sao."
    >
      <p>
        DailyEng là dự án cá nhân, không có quảng cáo, không bán hay chia sẻ dữ
        liệu cho bên thứ ba. Dưới đây là toàn bộ những gì app lưu.
      </p>

      <h2>Dữ liệu được lưu</h2>
      <ul>
        <li>
          <strong>Tài khoản:</strong> email và tên hiển thị (từ Google nếu bạn
          đăng nhập bằng Google). Mật khẩu được Supabase băm, app không đọc
          được.
        </li>
        <li>
          <strong>Tiến độ học:</strong> từ nào đã ôn, nhớ hay quên, ngày học,
          điểm mock test, bộ từ bạn tự tạo, mục tiêu và giờ nhắc học.
        </li>
        <li>
          <strong>Thông báo đẩy:</strong> nếu bạn bật nhắc học, trình duyệt cấp
          một địa chỉ đăng ký (push subscription) để server gửi thông báo. Tắt
          nhắc học là xoá.
        </li>
        <li>
          <strong>Cài đặt trên máy:</strong> giao diện sáng/tối, giọng đọc, bật/tắt
          âm thanh lưu trong trình duyệt của bạn, không lên server.
        </li>
      </ul>

      <h2>Không lưu</h2>
      <ul>
        <li>
          <strong>Giọng nói:</strong> Shadowing và Luyện phát âm dùng nhận dạng
          giọng nói của trình duyệt; bản ghi âm chỉ nằm trong bộ nhớ trang để
          bạn nghe lại và mất khi rời trang. App không tải giọng bạn lên server.
        </li>
        <li>Không theo dõi hành vi, không cookie quảng cáo, không phân tích bên thứ ba.</li>
      </ul>

      <h2>Bảng xếp hạng</h2>
      <p>
        Bảng xếp hạng hiện tên hiển thị và XP của bạn với người dùng khác. Bạn
        có thể ẩn mình bằng công tắc <strong>Ẩn tôi khỏi bảng xếp hạng</strong>{" "}
        ở tab Cá nhân; XP vẫn tính bình thường.
      </p>

      <h2>Lưu ở đâu</h2>
      <p>
        Dữ liệu lưu trên Supabase (Postgres) với chính sách truy cập theo hàng:
        mỗi người chỉ đọc/ghi được dữ liệu của chính mình. App chạy trên Vercel.
        Ảnh minh hoạ trò Nghe chọn hình lấy từ Pixabay theo giấy phép của họ.
      </p>

      <h2>Xoá tài khoản</h2>
      <p>
        Muốn xoá toàn bộ tài khoản và dữ liệu, gửi email tới{" "}
        <a href={`mailto:${SITE.author.email}`}>{SITE.author.email}</a> từ địa
        chỉ đã đăng ký, hoặc nhắn qua trang{" "}
        <Link href="/gioi-thieu/gop-y">Góp ý</Link>. Dữ liệu sẽ được xoá trong
        vòng 7 ngày.
      </p>

      <p className="text-sm">Cập nhật lần cuối: tháng 9/2026.</p>
    </DocPage>
  );
}
