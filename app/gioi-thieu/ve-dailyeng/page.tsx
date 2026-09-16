import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { DocPage } from "../_components/doc-page";

export const metadata: Metadata = { title: "Về DailyEng" };

const SOCIALS: { key: keyof typeof SITE.social; label: string }[] = [
  { key: "github", label: "GitHub" },
  { key: "facebook", label: "Facebook" },
  { key: "tiktok", label: "TikTok" },
  { key: "youtube", label: "YouTube" },
  { key: "linkedin", label: "LinkedIn" },
];

export default function VeDailyEngPage() {
  const socials = SOCIALS.filter((item) => SITE.social[item.key]);

  return (
    <DocPage
      title="Về DailyEng"
      subtitle="Một app học tiếng Anh nhỏ, làm ra để dùng thật mỗi ngày."
    >
      <h2>Thông tin</h2>
      <ul>
        <li><strong>Tên:</strong> DailyEng</li>
        <li><strong>Ra đời:</strong> 2026, dự án cá nhân của {SITE.author.name}</li>
        <li><strong>Lĩnh vực:</strong> học từ vựng và luyện kỹ năng tiếng Anh theo lịch ôn tập giãn cách</li>
        <li><strong>Chi phí:</strong> miễn phí toàn bộ, không quảng cáo, không gói trả phí</li>
      </ul>

      <h2>Vì sao có DailyEng</h2>
      <p>
        DailyEng bắt đầu từ một nhu cầu rất cá nhân: học từ vựng đều đặn mà
        không chán. Các app có sẵn hoặc nặng quảng cáo, hoặc khoá tính năng sau
        gói trả phí, hoặc chỉ là flashcard lật qua lật lại. Nên tác giả tự xây
        một app theo đúng cách mình muốn học — và mở cho mọi người dùng chung.
      </p>
      <p>
        Sứ mệnh của DailyEng rất đơn giản: <strong>giúp bạn quay lại học mỗi
        ngày</strong>. Mười từ một ngày, đúng lịch ôn, đều đặn — sau vài tháng
        là một vốn từ thật sự thuộc chứ không phải chỉ “đã xem qua”.
      </p>

      <h2>Phương pháp học</h2>
      <ul>
        <li>
          <strong>Ôn tập giãn cách (hệ hộp Leitner):</strong> mỗi từ nằm trong
          một trong 5 hộp. Nhớ đúng thì lên hộp và lâu mới gặp lại (1 → 2 → 4
          → 7 → 14 ngày); quên thì về hộp 1, hôm sau gặp lại. Mọi hoạt động —
          học, chơi, nghe, nói — đều ghi vào cùng một hệ nên không có chuyện
          học một đằng ôn một nẻo.
        </li>
        <li>
          <strong>Học theo chặng:</strong> mỗi 5 từ là một chặng, từ mới đi qua
          gặp từ → trắc nghiệm (Anh–Việt, Việt–Anh, nghe–chọn) → gõ lại hoặc
          điền vào câu ví dụ. Có câu ví dụ đọc được cả câu, nghe chậm được; từ
          sai làm lại ngay cuối chặng.
        </li>
        <li>
          <strong>Ôn tập hôm nay:</strong> gom mọi từ tới hạn từ tất cả các bộ
          vào một phiên, khỏi phải nhớ hôm nay ôn bộ nào.
        </li>
        <li>
          <strong>Kiểm tra đầu vào:</strong> 20 câu, 3 phút, để biết nên bắt đầu
          từ bộ nào theo mục tiêu (TOEIC, giao tiếp, công việc, học thuật).
        </li>
      </ul>

      <h2>Có gì trong app</h2>
      <ul>
        <li>
          <strong>36 bộ từ, hơn 3.300 từ</strong> chia 5 nhóm: TOEIC, Cốt lõi
          (theo tần suất), Giao tiếp, Công việc & kinh doanh, Học thuật. Mỗi từ
          có phiên âm và câu ví dụ song ngữ; nội dung sinh bằng AI rồi duyệt
          tay. Bạn cũng dán được danh sách từ của riêng mình từ Excel, Google
          Sheets hay Quizlet.
        </li>
        <li>
          <strong>Trò chơi:</strong> Mưa từ vựng, Ghép cặp, Nghe & gõ, Nghe chọn
          hình (ảnh thật), Quiz — chơi cho vui nhưng vẫn tính vào lịch ôn.
        </li>
        <li>
          <strong>Kỹ năng:</strong> Nghe chép câu, Shadowing (nói theo, chấm
          từng từ), Luyện phát âm, Mock test TOEIC Part 2 (nghe hỏi–đáp) và
          Part 5 (điền vào chỗ trống) có đồng hồ và giải thích từng câu.
        </li>
        <li>
          <strong>Động lực:</strong> XP và cấp độ, chuỗi ngày, điểm danh, 3
          nhiệm vụ mỗi ngày, 22 huy hiệu, bảng xếp hạng tuần / toàn thời gian,
          trang cá nhân công khai — và một chú vịt ăn mừng khi bạn đạt mục tiêu.
        </li>
        <li>
          <strong>Nhắc học:</strong> thông báo đẩy vào giờ bạn chọn, chỉ khi hôm
          đó bạn chưa học.
        </li>
        <li>
          <strong>Chạy ở đâu cũng được:</strong> web, điện thoại (cài như app,
          có offline), máy tính với giao diện rộng; sáng/tối tuỳ chọn.
        </li>
      </ul>

      <h2>Vì sao chọn DailyEng</h2>
      <ul>
        <li>Miễn phí thật, không có nút “mở khoá Pro”.</li>
        <li>Một hệ ôn tập duy nhất cho mọi hoạt động — chơi game cũng là ôn.</li>
        <li>Nội dung tiếng Việt, ví dụ thực tế, có phiên âm và giọng đọc.</li>
        <li>Không theo dõi, không quảng cáo; dữ liệu của bạn chỉ để bạn học.</li>
        <li>Dữ liệu của bạn được bảo vệ bằng chính sách truy cập theo hàng, mỗi người chỉ đọc được phần của mình.</li>
      </ul>

      <h2>Về tác giả</h2>
      <p>
        {SITE.author.name} — {SITE.author.role}. Đọc thêm ở trang{" "}
        <Link href="/gioi-thieu/tac-gia">Tác giả</Link>.
      </p>

      {socials.length > 0 ? (
        <>
          <h2>Theo dõi</h2>
          <p>Cập nhật tính năng mới và góp ý trực tiếp:</p>
          <ul>
            {socials.map((item) => (
              <li key={item.key}>
                <a href={SITE.social[item.key]} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              Email: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
            </li>
          </ul>
        </>
      ) : null}
    </DocPage>
  );
}
