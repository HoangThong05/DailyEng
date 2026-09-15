import type { Metadata } from "next";
import { DocPage } from "../_components/doc-page";

export const metadata: Metadata = { title: "Chính sách bảo mật" };

export default function BaoMatPage() {
  return (
    <DocPage
      title="Chính sách bảo mật"
      subtitle="DailyEng thu thập gì, dùng vào việc gì, và bạn kiểm soát ra sao."
    >
      <p>
        DailyEng là dự án cá nhân, miễn phí, không có quảng cáo, không bán hay
        chia sẻ dữ liệu cho bên thứ ba. Dưới đây là toàn bộ những gì app lưu và
        cách bạn kiểm soát chúng.
      </p>

      <h2>Dữ liệu được lưu</h2>
      <ul>
        <li>
          <strong>Tài khoản:</strong> email và tên hiển thị (lấy từ Google nếu
          bạn đăng nhập bằng Google). Mật khẩu được băm ở hệ thống xác thực, app
          không đọc được.
        </li>
        <li>
          <strong>Hồ sơ:</strong> ảnh đại diện, ảnh bìa, tiểu sử, mục tiêu mỗi
          ngày, giờ nhắc học, kết quả kiểm tra đầu vào, huy hiệu — do bạn tự
          nhập hoặc app tính từ việc học.
        </li>
        <li>
          <strong>Tiến độ học:</strong> từ nào đã ôn, nhớ hay quên, hoạt động
          nào (học, trò chơi, nghe chép, shadowing), ngày học, điểm mock test,
          điểm danh, nhiệm vụ đã xong, bộ từ bạn tự tạo.
        </li>
        <li>
          <strong>Thông báo đẩy:</strong> nếu bạn bật nhắc học, trình duyệt cấp
          một địa chỉ đăng ký (push subscription) để server gửi thông báo. Tắt
          nhắc học là địa chỉ đó bị xoá.
        </li>
        <li>
          <strong>Cài đặt trên máy:</strong> giao diện sáng/tối, giọng đọc, âm
          thanh, thanh bên thu gọn, mục đã xem ở chuông — lưu trong trình duyệt
          của bạn, không gửi lên server.
        </li>
      </ul>

      <h2>Không lưu</h2>
      <ul>
        <li>
          <strong>Giọng nói:</strong> Shadowing và Luyện phát âm dùng nhận dạng
          giọng nói của trình duyệt; bản ghi âm chỉ nằm trong bộ nhớ trang để
          bạn nghe lại và mất khi rời trang. App không tải giọng bạn lên server.
        </li>
        <li>Không theo dõi hành vi, không cookie quảng cáo, không công cụ phân tích bên thứ ba.</li>
      </ul>

      <h2>Những gì người khác thấy</h2>
      <p>
        Bảng xếp hạng và trang cá nhân công khai hiện <strong>tên hiển thị, ảnh
        đại diện, ảnh bìa, tiểu sử, cấp độ, XP, chuỗi ngày, các con số tổng và
        huy hiệu</strong> của bạn. Email, nhật ký học chi tiết và bộ từ tự tạo
        không bao giờ hiện với người khác.
      </p>
      <p>
        Bật <strong>Ẩn tôi khỏi bảng xếp hạng</strong> ở tab Cá nhân là bạn biến
        mất khỏi bảng xếp hạng và trang cá nhân của bạn cũng không xem được nữa;
        XP và cấp độ vẫn tính bình thường.
      </p>

      <h2>Bạn kiểm soát ra sao</h2>
      <ul>
        <li>Sửa hoặc xoá ảnh, tiểu sử, tên hiển thị bất cứ lúc nào ở tab Cá nhân.</li>
        <li>Tắt nhắc học, ẩn khỏi bảng xếp hạng bằng công tắc tương ứng.</li>
        <li>Đăng xuất là mọi phiên trên thiết bị đó kết thúc ngay.</li>
      </ul>

      <p className="text-sm">Cập nhật lần cuối: tháng 9/2026.</p>
    </DocPage>
  );
}
