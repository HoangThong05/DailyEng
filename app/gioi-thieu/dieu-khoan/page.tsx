import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { DocPage } from "../_components/doc-page";

export const metadata: Metadata = { title: "Điều khoản sử dụng" };

export default function DieuKhoanPage() {
  return (
    <DocPage
      title="Điều khoản sử dụng"
      subtitle="Những gì bạn và DailyEng đồng ý với nhau khi bạn dùng app."
    >
      <h2>Giới thiệu</h2>
      <p>
        Chào mừng bạn đến với DailyEng — ứng dụng học tiếng Anh do{" "}
        {SITE.author.name} phát triển và vận hành, cung cấp miễn phí và không
        có quảng cáo. Điều khoản này điều chỉnh việc bạn sử dụng DailyEng trên
        web và bản cài lên màn hình chính. Tạo tài khoản hoặc tiếp tục dùng app
        nghĩa là bạn đồng ý với các điều khoản dưới đây và{" "}
        <Link href="/gioi-thieu/bao-mat">Chính sách quyền riêng tư</Link>.
      </p>

      <h2>Tài khoản</h2>
      <ul>
        <li>Đăng ký bằng email hợp lệ hoặc tài khoản Google. Mỗi người một tài khoản.</li>
        <li>Bạn giữ bí mật thông tin đăng nhập và chịu trách nhiệm về mọi hoạt động diễn ra trên tài khoản của mình.</li>
        <li>
          Tên hiển thị, ảnh đại diện, ảnh bìa và tiểu sử được hiện công khai
          trên bảng xếp hạng và trang cá nhân, nên không được chứa nội dung
          xúc phạm, khiêu dâm, bạo lực, thù ghét, quảng cáo, thông tin liên hệ
          của người khác, hay mạo danh cá nhân/tổ chức.
        </li>
        <li>Bạn có thể ngừng dùng bất cứ lúc nào; yêu cầu xoá tài khoản theo mục Liên hệ.</li>
      </ul>

      <h2>Sử dụng nội dung của DailyEng</h2>
      <ul>
        <li>
          Bộ từ có sẵn, câu ví dụ, ngân hàng câu hỏi mock test, linh vật vịt và
          ảnh bìa các bộ từ thuộc về DailyEng. Bạn được dùng để học cá nhân.
        </li>
        <li>Không sao chép hàng loạt, phân phối lại, bán hay đưa nội dung vào sản phẩm khác mà không được đồng ý bằng văn bản.</li>
        <li>Ảnh minh hoạ trò Nghe chọn hình lấy từ Pixabay theo giấy phép của Pixabay.</li>
      </ul>

      <h2>Nội dung do bạn tạo</h2>
      <p>
        “Nội dung của bạn” gồm bộ từ tự tạo, tiểu sử, ảnh đại diện, ảnh bìa và
        phản hồi bạn gửi.
      </p>
      <ul>
        <li>Bạn giữ quyền sở hữu nội dung của mình. DailyEng chỉ lưu và hiển thị nó để app hoạt động cho bạn, không dùng vào việc khác.</li>
        <li>Bộ từ tự tạo là riêng tư: chỉ bạn thấy và học được.</li>
        <li>Bạn chịu trách nhiệm về tính hợp pháp và phù hợp của nội dung mình tải lên, kể cả bản quyền ảnh.</li>
        <li>DailyEng không kiểm duyệt trước nhưng có quyền gỡ nội dung vi phạm mà không cần báo trước.</li>
      </ul>

      <h2>Quy tắc sử dụng</h2>
      <p>Để giữ bảng xếp hạng công bằng và app chạy ổn định, bạn không được:</p>
      <ul>
        <li>Dùng bot, script hay bất kỳ công cụ tự động nào để trả lời, điểm danh, cày XP hay làm mock test.</li>
        <li>Tạo nhiều tài khoản để thao túng thứ hạng hoặc nhận thưởng nhiều lần.</li>
        <li>Can thiệp vào dữ liệu gửi lên máy chủ, khai thác lỗi hoặc truy cập khu vực không dành cho mình (kể cả khu quản trị).</li>
        <li>Gửi phản hồi spam, quấy rối hay chứa liên kết độc hại.</li>
        <li>Gây quá tải hệ thống một cách cố ý.</li>
      </ul>
      <p>
        Tài khoản vi phạm có thể bị đặt lại XP, ẩn khỏi bảng xếp hạng, gỡ huy
        hiệu, tạm khoá hoặc xoá tuỳ mức độ, có hoặc không có cảnh báo trước.
      </p>

      <h2>XP, cấp độ, huy hiệu và bảng xếp hạng</h2>
      <ul>
        <li>XP, cấp độ, huy hiệu, chuỗi ngày và thứ hạng chỉ là cơ chế động lực trong app, không có giá trị tiền tệ, không quy đổi, không chuyển nhượng.</li>
        <li>
          Công thức tính có thể được điều chỉnh để giữ cân bằng (ví dụ đổi số XP
          mỗi lượt hay trần XP theo ngày); khi đó cấp độ của mọi người được tính
          lại theo công thức mới. Quy định hiện hành luôn ghi ở trang{" "}
          <strong>Phần thưởng</strong> trong app.
        </li>
        <li>DailyEng có quyền sửa số liệu bị sai do lỗi hệ thống hoặc gian lận.</li>
      </ul>

      <h2>Hạt và vật phẩm trong cửa hàng</h2>
      <ul>
        <li>
          Hạt là điểm thưởng nội bộ của DailyEng, nhận được khi bạn học đều đặn.
          Hạt <strong>không phải tiền</strong>: không mua được bằng tiền thật,
          không bán, không quy đổi, không chuyển cho người khác.
        </li>
        <li>
          Vật phẩm mua bằng Hạt (khung ảnh đại diện, ảnh bìa, danh hiệu, đóng
          băng chuỗi) chỉ dùng để trang trí hồ sơ trong app. Vật phẩm theo mùa
          chỉ bán trong thời gian ghi trên thẻ; hết thời gian thì không mua được
          nữa, nhưng ai đã mua vẫn giữ.
        </li>
        <li>
          Giá, cách kiếm Hạt và danh mục vật phẩm có thể thay đổi để giữ cân bằng;
          quy định hiện hành luôn ghi ở trang <strong>Phần thưởng</strong> và{" "}
          <strong>Cửa hàng</strong> trong app.
        </li>
        <li>
          Xoá tài khoản là mất toàn bộ Hạt và vật phẩm, không hoàn lại. DailyEng
          có quyền thu hồi Hạt hoặc vật phẩm có được do lỗi hệ thống hoặc gian lận.
        </li>
      </ul>

      <h2>Giọng nói và micro</h2>
      <ul>
        <li>Shadowing và Luyện phát âm dùng nhận dạng giọng nói của trình duyệt; giọng nói của bạn không được gửi lên hay lưu ở máy chủ của DailyEng.</li>
        <li>Điểm chấm phát âm chỉ mang tính tham khảo, phụ thuộc vào micro, tiếng ồn và trình duyệt bạn dùng.</li>
        <li>Bạn toàn quyền cấp hoặc thu hồi quyền micro trong trình duyệt.</li>
      </ul>

      <h2>Thông báo nhắc học</h2>
      <p>
        Nhắc học chỉ được gửi khi bạn tự bật và tới đúng thiết bị đã bật. Bạn
        tắt bất cứ lúc nào bằng công tắc ở tab Cá nhân hoặc trong cài đặt
        trình duyệt. DailyEng không gửi thông báo tiếp thị.
      </p>

      <h2>Dịch vụ cung cấp nguyên trạng</h2>
      <ul>
        <li>DailyEng là dự án cá nhân, cung cấp “nguyên trạng” và “khi sẵn có”. Tác giả cố gắng giữ app ổn định nhưng không cam kết thời gian hoạt động, không có lỗi, hay dữ liệu không bao giờ mất.</li>
        <li>Tính năng có thể được thêm, đổi hoặc gỡ; nội dung bộ từ có thể được sửa để chính xác hơn.</li>
        <li>DailyEng là công cụ hỗ trợ học tập, không thay thế khoá học chính thức và không bảo đảm kết quả thi. Điểm mock test và kết quả kiểm tra đầu vào chỉ mang tính tham khảo.</li>
        <li>Nội dung được sinh bằng AI rồi duyệt tay; nếu thấy sai, hãy báo qua trang Góp ý.</li>
      </ul>

      <h2>Giới hạn trách nhiệm</h2>
      <p>
        Trong phạm vi pháp luật cho phép, tác giả không chịu trách nhiệm về
        thiệt hại gián tiếp, mất dữ liệu, mất cơ hội hay bất kỳ tổn thất nào
        phát sinh từ việc dùng hoặc không dùng được DailyEng. Vì app miễn phí,
        không có khoản thanh toán nào và do đó không có hoàn tiền.
      </p>

      <h2>Độ tuổi</h2>
      <p>
        DailyEng không có nhắn tin, trò chuyện hay gọi thoại giữa người dùng.
        Người dưới 13 tuổi nên dùng app với sự đồng ý của phụ huynh; phụ huynh
        có thể yêu cầu xoá tài khoản của con theo mục Liên hệ.
      </p>

      <h2>Chấm dứt</h2>
      <ul>
        <li>Bạn có thể ngừng dùng và yêu cầu xoá tài khoản bất cứ lúc nào.</li>
        <li>DailyEng có thể tạm khoá hoặc xoá tài khoản vi phạm điều khoản, hoặc ngừng dịch vụ hoàn toàn; nếu ngừng hẳn, tác giả sẽ thông báo trước trên trang chủ của app.</li>
      </ul>

      <h2>Thay đổi điều khoản</h2>
      <p>
        Điều khoản có thể được cập nhật khi app có tính năng mới. Ngày cập nhật
        ghi ở cuối trang; thay đổi lớn được thông báo trên trang chủ. Tiếp tục
        dùng app sau khi thay đổi nghĩa là bạn chấp nhận điều khoản mới.
      </p>

      <h2>Luật áp dụng</h2>
      <p>
        Điều khoản này được hiểu theo pháp luật Việt Nam. Tranh chấp (nếu có)
        ưu tiên giải quyết bằng trao đổi thiện chí qua email trước.
      </p>

      <h2>Liên hệ</h2>
      <p>
        Câu hỏi về điều khoản, yêu cầu xoá tài khoản hay báo vi phạm: gửi tới{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> hoặc
        trang <Link href="/gioi-thieu/gop-y">Góp ý</Link>.
      </p>

      <p className="text-sm">Cập nhật lần cuối: tháng 9/2026.</p>
    </DocPage>
  );
}
