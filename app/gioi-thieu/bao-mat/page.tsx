import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { DocPage } from "../_components/doc-page";

export const metadata: Metadata = { title: "Chính sách quyền riêng tư" };

export default function BaoMatPage() {
  return (
    <DocPage
      title="Chính sách quyền riêng tư"
      subtitle="DailyEng thu thập gì, dùng vào việc gì, chia sẻ với ai, và bạn kiểm soát ra sao."
    >
      <h2>Giới thiệu</h2>
      <p>
        DailyEng là ứng dụng học tiếng Anh do {SITE.author.name} phát triển và
        vận hành, miễn phí và không có quảng cáo. Chúng tôi coi quyền riêng tư
        là một phần của sản phẩm: chỉ lưu những gì cần để app hoạt động, nói rõ
        ai thấy được gì, và để bạn tự tay sửa hoặc gỡ. Chính sách này áp dụng
        cho phiên bản web và phiên bản cài lên màn hình chính (PWA).
      </p>

      <h2>Thông tin chúng tôi thu thập</h2>
      <ul>
        <li>
          <strong>Thông tin tài khoản:</strong> địa chỉ email, tên hiển thị và
          ảnh đại diện. Đăng nhập bằng Google thì tên được lấy từ tài khoản
          Google của bạn. Mật khẩu được băm ở hệ thống xác thực, app không đọc
          được và không lưu bản gốc.
        </li>
        <li>
          <strong>Hồ sơ do bạn tự nhập:</strong> ảnh bìa, tiểu sử, màu bìa, mục
          tiêu số từ mỗi ngày, giờ nhắc học, lựa chọn ẩn khỏi bảng xếp hạng.
        </li>
        <li>
          <strong>Dữ liệu học tập:</strong> từ nào bạn đã ôn, nhớ hay quên, hộp
          ôn tập và ngày đến hạn của từng từ, hoạt động phát sinh lượt trả lời
          (học theo chặng, ôn tập, trò chơi, nghe chép câu, shadowing), ngày
          học, điểm và thời gian làm mock test, kết quả kiểm tra đầu vào, điểm
          danh, nhiệm vụ đã hoàn thành, huy hiệu và các bộ từ bạn tự tạo.
        </li>
        <li>
          <strong>Phản hồi:</strong> nội dung bạn gửi qua trang{" "}
          <Link href="/gioi-thieu/gop-y">Góp ý</Link>, kèm email nếu bạn để lại.
        </li>
        <li>
          <strong>Thông báo đẩy:</strong> nếu bạn bật nhắc học, trình duyệt cấp
          một địa chỉ đăng ký (push subscription) gắn với thiết bị đó để server
          gửi thông báo. Không có địa chỉ này thì không gửi được.
        </li>
        <li>
          <strong>Cài đặt trên thiết bị:</strong> giao diện sáng/tối, giọng đọc,
          âm thanh, thanh bên thu gọn, mục đã xem ở chuông — lưu trong trình
          duyệt của bạn, không gửi lên máy chủ.
        </li>
      </ul>
      <p>
        Chúng tôi <strong>không</strong> thu thập vị trí, danh bạ, ngày sinh,
        giới tính, số điện thoại, và không đọc dữ liệu từ các ứng dụng khác.
      </p>

      <h2>Cách chúng tôi sử dụng thông tin</h2>
      <ul>
        <li>Xếp lịch ôn tập giãn cách cho từng từ và dựng phiên học phù hợp với bạn.</li>
        <li>Tính chuỗi ngày, XP, cấp độ, nhiệm vụ, huy hiệu và thống kê tiến độ.</li>
        <li>Gợi ý bộ từ nên học dựa trên kết quả kiểm tra đầu vào.</li>
        <li>Gửi thông báo nhắc học đúng giờ bạn chọn, và chỉ khi hôm đó bạn chưa học.</li>
        <li>Hiển thị bảng xếp hạng và trang cá nhân công khai (xem mục bên dưới).</li>
        <li>Đọc phản hồi để sửa lỗi và cải thiện app.</li>
      </ul>

      <h2>Chúng tôi không bán dữ liệu của bạn</h2>
      <ul>
        <li>Không bán, cho thuê hay trao đổi thông tin cá nhân của bạn cho bất kỳ ai.</li>
        <li>Không có quảng cáo, không chia sẻ dữ liệu với nhà quảng cáo.</li>
        <li>Không dùng công cụ phân tích hành vi hay cookie theo dõi của bên thứ ba.</li>
        <li>Không dùng dữ liệu của bạn để huấn luyện mô hình AI.</li>
        <li>Dữ liệu chỉ dùng để vận hành và cải thiện chính tính năng học tập của app.</li>
      </ul>

      <h2>Dịch vụ bên thứ ba</h2>
      <p>Để app chạy được, một số dịch vụ hạ tầng xử lý dữ liệu thay chúng tôi:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — cơ sở dữ liệu, xác thực và lưu ảnh đại
          diện/ảnh bìa. Dữ liệu được bảo vệ bằng chính sách truy cập theo hàng:
          mỗi tài khoản chỉ đọc/ghi được dữ liệu của chính mình.
        </li>
        <li>
          <strong>Vercel</strong> — máy chủ chạy ứng dụng và phân phối nội dung.
        </li>
        <li>
          <strong>Google</strong> — chỉ khi bạn chọn đăng nhập bằng Google; chúng
          tôi nhận email và tên, không nhận gì khác.
        </li>
        <li>
          <strong>Dịch vụ đẩy của trình duyệt</strong> (Google, Apple, Mozilla) —
          chuyển thông báo nhắc học tới thiết bị của bạn; nội dung chỉ là lời
          nhắc ngắn.
        </li>
        <li>
          <strong>Pixabay</strong> — nguồn ảnh minh hoạ cho trò Nghe chọn hình.
          Ảnh được tải sẵn trong app, trình duyệt của bạn không kết nối tới
          Pixabay.
        </li>
      </ul>
      <p>
        Các dịch vụ này có chính sách quyền riêng tư riêng. Chúng tôi chọn cấu
        hình hạn chế nhất mà app vẫn hoạt động được.
      </p>

      <h2>Giọng nói và micro</h2>
      <ul>
        <li>
          Shadowing và Luyện phát âm dùng tính năng nhận dạng giọng nói tích hợp
          sẵn của trình duyệt (Web Speech API). Việc chuyển giọng nói thành chữ
          do trình duyệt xử lý theo chính sách của nhà cung cấp trình duyệt.
        </li>
        <li>
          Bản ghi âm để bạn nghe lại chỉ nằm trong bộ nhớ của trang và mất khi
          bạn rời trang. <strong>App không tải giọng nói của bạn lên máy chủ</strong>{" "}
          và không lưu bất kỳ bản ghi nào.
        </li>
        <li>
          Micro chỉ được bật khi bạn cấp quyền trong trình duyệt và có thể thu
          hồi bất cứ lúc nào trong cài đặt trình duyệt.
        </li>
      </ul>

      <h2>Hỏi AI</h2>
      <ul>
        <li>
          Khi bạn trò chuyện với Vịt gia sư, nội dung bạn gõ (và vài lượt hội
          thoại trước đó để giữ mạch) được gửi tới nhà cung cấp mô hình AI mà
          app đang dùng — <strong>Google</strong> (Gemini) hoặc{" "}
          <strong>Anthropic</strong> (Claude) — để tạo câu trả lời.{" "}
          <strong>Đừng gõ thông tin cá nhân nhạy cảm vào đó</strong>: với gói
          miễn phí của Google, nội dung có thể được họ dùng để cải thiện dịch vụ.
        </li>
        <li>
          DailyEng <strong>không lưu nội dung hội thoại</strong> trên máy chủ; chỉ
          ghi số tin và số token mỗi ngày để giới hạn hạn mức và theo dõi chi phí.
          Rời trang là hội thoại mất.
        </li>
        <li>DailyEng không dùng nội dung hội thoại vào bất cứ việc gì ngoài việc trả lời bạn.</li>
      </ul>

      <h2>Những gì người dùng khác thấy</h2>
      <p>
        Bảng xếp hạng và trang cá nhân công khai hiển thị{" "}
        <strong>tên hiển thị, ảnh đại diện, ảnh bìa, tiểu sử, cấp độ, XP, chuỗi
        ngày, các con số tổng (từ đã học, đã thuộc, lượt trả lời) và huy hiệu</strong>.
      </p>
      <p>
        <strong>Không bao giờ hiển thị</strong> với người khác: email, nhật ký
        học chi tiết, từ nào bạn hay sai, bộ từ bạn tự tạo, điểm từng lần mock
        test, giờ nhắc học.
      </p>
      <p>
        Bật <strong>Ẩn tôi khỏi bảng xếp hạng</strong> ở tab Cá nhân thì bạn
        biến mất khỏi bảng xếp hạng và trang cá nhân của bạn cũng không xem được
        nữa; XP và cấp độ vẫn tính bình thường cho riêng bạn.
      </p>

      <h2>Bảo mật và lưu trữ</h2>
      <ul>
        <li>Mọi kết nối đều qua HTTPS.</li>
        <li>
          Cơ sở dữ liệu áp dụng chính sách truy cập theo hàng (Row Level
          Security): kể cả khi có lỗi ở giao diện, tài khoản này không đọc được
          dữ liệu của tài khoản khác.
        </li>
        <li>
          Ảnh đại diện và ảnh bìa nằm ở kho ảnh công khai (để hiện được trên
          bảng xếp hạng); đường dẫn ảnh là chuỗi ngẫu nhiên gắn với tài khoản.
          Đừng tải lên ảnh có thông tin nhạy cảm.
        </li>
        <li>
          Phiên đăng nhập lưu bằng cookie bảo mật (HttpOnly). Đăng xuất là phiên
          trên thiết bị đó kết thúc ngay.
        </li>
        <li>Tài khoản quản trị chỉ xem số liệu tổng hợp và phản hồi bạn gửi, không xem nhật ký học của từng người.</li>
      </ul>

      <h2>Thời gian lưu giữ</h2>
      <ul>
        <li>Dữ liệu tài khoản và học tập được giữ chừng nào tài khoản còn tồn tại, để chuỗi ngày và lịch ôn tập của bạn không mất.</li>
        <li>Địa chỉ thông báo đẩy bị xoá ngay khi bạn tắt nhắc học hoặc khi trình duyệt báo không còn hợp lệ.</li>
        <li>Ảnh đại diện/ảnh bìa bị thay thế khi bạn tải ảnh mới hoặc chọn “Dùng vịt” / “Dùng màu”.</li>
        <li>Phản hồi được giữ cho tới khi xử lý xong.</li>
      </ul>

      <h2>Quyền của bạn</h2>
      <ul>
        <li><strong>Xem</strong> mọi dữ liệu học tập của mình ở các trang Cá nhân, Thống kê, Phần thưởng.</li>
        <li><strong>Sửa hoặc gỡ</strong> tên, tiểu sử, ảnh đại diện, ảnh bìa, mục tiêu, giờ nhắc bất cứ lúc nào ở tab Cá nhân.</li>
        <li><strong>Tắt</strong> thông báo nhắc học bằng công tắc; tắt là không còn nhận gì.</li>
        <li><strong>Ẩn</strong> mình khỏi bảng xếp hạng và trang cá nhân công khai.</li>
        <li>
          <strong>Yêu cầu xoá toàn bộ tài khoản và dữ liệu</strong> hoặc{" "}
          <strong>xin bản sao dữ liệu</strong> bằng cách liên hệ theo mục dưới,
          từ địa chỉ email đã đăng ký. Chúng tôi xử lý trong vòng 7 ngày.
        </li>
      </ul>

      <h2>Trẻ em</h2>
      <p>
        DailyEng không có tính năng nhắn tin, trò chuyện hay gọi thoại giữa người
        dùng; tương tác duy nhất giữa người dùng là bảng xếp hạng và trang cá
        nhân công khai. Chúng tôi không cố ý thu thập thông tin cá nhân của trẻ
        dưới 13 tuổi ngoài những gì cần để học. Phụ huynh muốn xoá dữ liệu của
        con mình có thể liên hệ theo mục dưới.
      </p>

      <h2>Thay đổi chính sách</h2>
      <p>
        Khi app có tính năng mới ảnh hưởng tới dữ liệu, chính sách này được cập
        nhật và ngày cập nhật ở cuối trang thay đổi. Thay đổi lớn sẽ được thông
        báo trên trang chủ của app.
      </p>

      <h2>Liên hệ</h2>
      <p>
        Mọi câu hỏi về quyền riêng tư hoặc yêu cầu về dữ liệu, gửi tới{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> hoặc qua
        trang <Link href="/gioi-thieu/gop-y">Góp ý</Link>.
      </p>

      <p className="text-sm">Cập nhật lần cuối: tháng 9/2026.</p>
    </DocPage>
  );
}
