import { SITE } from "@/lib/site";

/**
 * Nội dung trang Tác giả (/gioi-thieu/tac-gia).
 *
 * Mọi mục đều không bắt buộc: để mảng rỗng hoặc chuỗi rỗng thì mục đó tự ẩn
 * khỏi trang. Sửa ở đây, không phải sửa giao diện.
 */
export const AUTHOR = {
  name: SITE.author.name,
  /** Một dòng dưới tên. */
  title: "Sinh viên Software Engineering · người làm DailyEng",
  location: "TP. Hồ Chí Minh, Việt Nam",
  email: SITE.contactEmail,
  /** Ảnh chân dung trong public/ (đã cắt vuông từ avatar.jpg). */
  photo: "/tac-gia.jpg",

  /** 2–3 câu tự giới thiệu, hiện ngay dưới thẻ tên. */
  intro:
    "Mình là sinh viên ngành Kỹ thuật phần mềm và là người làm ra DailyEng — một app học tiếng Anh viết cho chính nhu cầu của mình, rồi mở cho mọi người dùng chung. Mình làm full-stack: từ giao diện, cơ sở dữ liệu tới lúc đưa lên chạy thật. Thích sản phẩm có người dùng mỗi ngày hơn là dự án chỉ để nộp bài.",

  /** Học vấn: trường, ngành, thời gian, mô tả ngắn. */
  education: [
    {
      school: "Đại học FPT — cơ sở TP. Hồ Chí Minh",
      major: "Kỹ thuật phần mềm (Software Engineering)",
      time: "Khoá K19",
      note: "",
    },
  ] as { school: string; major?: string; time?: string; note?: string }[],

  /** Chứng chỉ, điểm thi. */
  certificates: [
    { name: "TOEIC", value: "", note: "Đang học và luyện thi — cũng là lý do DailyEng có phần thi thử Part 2 và Part 5" },
  ] as { name: string; value?: string; note?: string }[],

  /** Học bổng, giải thưởng. */
  awards: [] as string[],

  /** Kỹ năng / công nghệ dùng thường xuyên. */
  skills: [
    "Next.js",
    "React",
    "TypeScript",
    "Java / Spring Boot",
    "Node.js / Express",
    "PostgreSQL · Supabase",
    "Tailwind CSS",
    "Vercel",
  ] as string[],

  /** Dự án đã làm; DailyEng luôn đứng đầu. */
  projects: [
    {
      name: "DailyEng",
      time: "2026",
      description:
        "App học tiếng Anh theo lịch ôn tập giãn cách: 36 bộ từ, trò chơi ôn từ, luyện nghe nói, thi thử TOEIC, gia sư AI. Tự làm từ thiết kế, nội dung tới lập trình và vận hành.",
      link: SITE.repo,
      linkLabel: "Mã nguồn trên GitHub",
    },
    {
      name: "Football Stats Tracker",
      description:
        "Web theo dõi 6 giải bóng đá châu Âu: bảng xếp hạng kèm phong độ, lịch và kết quả, tỉ số trực tiếp, vua phá lưới. Có phần dự đoán tỉ số tự chấm điểm, mini league mời bạn bè bằng mã, đăng nhập JWT/Google, song ngữ Việt–Anh. Backend Java Spring Boot + PostgreSQL, frontend React + Vite.",
      link: "https://football-stats-tracker-jet.vercel.app/",
      linkLabel: "Xem trang",
    },
    {
      name: "Marketing NH",
      description:
        "Công cụ quản lý khách hàng tiềm năng cho phòng marketing: khách tự điền form công khai, nhân viên nhận và chăm sóc theo 6 trạng thái, quản lý theo dõi tiến độ cả nhóm. Có bảng việc hôm nay, báo cáo hiệu suất, nhập/xuất Excel, thùng rác. React + Node/Express + PostgreSQL trên Supabase.",
      link: "https://marketing-nh.vercel.app/",
      linkLabel: "Xem trang",
    },
  ] as { name: string; time?: string; description: string; link?: string; linkLabel?: string }[],

  /** Câu chuyện phía sau app — phần dài nhất, viết bằng giọng của mình. */
  story: [
    "Mình học tiếng Anh để thi TOEIC và dùng cho công việc sau này, nhưng cứ học được vài hôm là bỏ. Không phải vì lười — mà vì mỗi lần mở app lên lại phải nghĩ xem hôm nay học gì, học bộ nào, ôn lại từ nào. Chỉ chừng đó thôi cũng đủ để mình bỏ qua một ngày, rồi thành một tuần.",
    "Các app có sẵn thì hoặc nặng quảng cáo, hoặc khoá tính năng sau gói trả phí, hoặc chỉ là flashcard lật qua lật lại. Cái mình cần đơn giản hơn nhiều: mở lên là biết ngay hôm nay học gì, học xong thấy mình tiến được một bước, và hôm sau có lý do để quay lại.",
    "Nên mình tự làm một cái theo đúng cách mình muốn học. DailyEng đặt mọi hoạt động — học theo chặng, trò chơi, nghe chép, shadowing, thi thử — vào cùng một hệ ôn tập giãn cách, để chơi game cũng là ôn bài. Thêm chuỗi ngày, nhiệm vụ, huy hiệu và một chú vịt ăn mừng khi đạt mục tiêu, vì động lực cũng là một phần của việc học.",
    "Làm cho mình dùng trước. Dùng được thật rồi mới mở cho mọi người, miễn phí, không quảng cáo, mã nguồn công khai. Đây cũng là dự án để mình học cách làm một sản phẩm hoàn chỉnh: từ thiết kế, nội dung, cơ sở dữ liệu, đến khi có người lạ đầu tiên đăng ký.",
  ] as string[],

  /** Câu tâm đắc, hiện ở cuối trang. Để trống thì ẩn. */
  quote: "Mình không làm app để gây ấn tượng — làm để chính mình học được mỗi ngày.",
} as const;
