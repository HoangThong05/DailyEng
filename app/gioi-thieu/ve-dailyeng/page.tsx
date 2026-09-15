import type { Metadata } from "next";
import { DocPage } from "../_components/doc-page";

export const metadata: Metadata = { title: "Về DailyEng" };

export default function VeDailyEngPage() {
  return (
    <DocPage
      title="Về DailyEng"
      subtitle="Một app học tiếng Anh nhỏ, làm ra để dùng thật mỗi ngày."
    >
      <p>
        DailyEng bắt đầu từ một nhu cầu rất cá nhân: học từ vựng đều đặn mà
        không chán. Các app có sẵn hoặc nặng quảng cáo, hoặc khoá tính năng sau
        gói trả phí, hoặc chỉ là flashcard lật qua lật lại. Nên tác giả tự xây
        một app theo đúng cách mình muốn học.
      </p>

      <h2>Học thế nào</h2>
      <ul>
        <li>
          <strong>Học theo chặng:</strong> mỗi 5 từ là một chặng — gặp từ, trắc
          nghiệm, rồi điền từ vào câu ví dụ. App tự chấm; từ sai quay lại ngay
          cuối chặng.
        </li>
        <li>
          <strong>Ôn tập giãn cách (Leitner):</strong> từ nhớ đúng thì lâu mới
          gặp lại, từ quên thì hôm sau gặp lại. Mọi hoạt động — học, chơi, nói —
          đều ghi vào cùng một hệ.
        </li>
        <li>
          <strong>Trò chơi và kỹ năng:</strong> Mưa từ vựng, Ghép cặp, Nghe &
          gõ, Nghe chọn hình, Quiz; Nghe chép câu, Shadowing, Luyện phát âm,
          Mock test TOEIC Part 2 và Part 5.
        </li>
        <li>
          <strong>Động lực:</strong> XP, cấp độ, chuỗi ngày, bảng xếp hạng, và
          một chú vịt ăn mừng khi bạn đạt mục tiêu.
        </li>
      </ul>

      <h2>Nội dung</h2>
      <p>
        36 bộ từ có sẵn (TOEIC, Cốt lõi, Giao tiếp, Công việc, Học thuật) với
        hơn 3.300 từ kèm phiên âm và câu ví dụ, sinh bằng AI rồi duyệt tay. Bạn
        cũng có thể dán danh sách từ của riêng mình từ Excel, Google Sheets hay
        Quizlet.
      </p>

    </DocPage>
  );
}
