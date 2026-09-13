import type { MascotVariant } from "@/app/_components/mascot";

/**
 * Danh sách trò chơi hiện ở hub. Mỗi trò có màu riêng để bìa và nút nhận ra
 * ngay dù chưa đọc chữ.
 *
 * Ảnh bìa vẽ riêng nằm ở public/games/<slug>.png, map trong game-card.tsx.
 */
export type GameEntry = {
  slug: string;
  /** game: chơi cho vui để nhớ từ; skill: luyện kỹ năng / thi thử. */
  kind: "game" | "skill";
  href: string;
  title: string;
  description: string;
  badge: "Mới" | "Chơi đơn" | "Nghe · nói" | "TOEIC";
  /** Tư thế linh vật đại diện (dùng ở nơi khác, ví dụ màn intro). */
  mascot: MascotVariant;
  /** Tailwind class cho nền bìa và nút. */
  gradient: string;
  button: string;
  /** Tên icon trong _components/icons, map ở game-card.tsx. */
  icon: "rain" | "gamepad" | "speaker" | "quiz" | "mic" | "pencil" | "clock";
};

export const GAMES: GameEntry[] = [
  {
    slug: "chep-cau",
    kind: "skill",
    href: "/tro-choi/chep-cau",
    title: "Nghe chép câu",
    description:
      "Máy đọc cả câu ví dụ, bạn gõ lại toàn bộ. Chấm từng từ, có nút đọc chậm và gợi ý từ khoá — luyện nghe hiểu thật sự.",
    badge: "Mới",
    mascot: "nghe",
    gradient: "from-rose-500 via-pink-600 to-fuchsia-800",
    button: "bg-rose-600 hover:bg-rose-500",
    icon: "pencil",
  },
  {
    slug: "mock-test",
    kind: "skill",
    href: "/tro-choi/mock-test",
    title: "Mock test TOEIC Part 5",
    description:
      "20 câu điền vào chỗ trống như đề thật, có đồng hồ 10 phút. Chấm ngay, giải thích từng câu, lưu điểm cao nhất.",
    badge: "TOEIC",
    mascot: "tot-nghiep",
    gradient: "from-orange-500 via-red-500 to-rose-700",
    button: "bg-orange-600 hover:bg-orange-500",
    icon: "clock",
  },
  {
    slug: "mua-tu",
    kind: "game",
    href: "/tro-choi/mua-tu",
    title: "Mưa từ vựng",
    description:
      "Từ rơi từ trên trời xuống, gõ đúng để máy bay bắn hạ trước khi chạm đất. Có hai chế độ: gõ từ tiếng Anh đang rơi hoặc nhìn nghĩa nhớ ra từ.",
    badge: "Mới",
    mascot: "choi",
    gradient: "from-indigo-600 via-blue-700 to-slate-900",
    button: "bg-blue-600 hover:bg-blue-500",
    icon: "rain",
  },
  {
    slug: "ghep-cap",
    kind: "game",
    href: "/tro-choi/ghep-cap",
    title: "Ghép cặp",
    description:
      "16 ô trộn lẫn từ và nghĩa. Chạm một từ rồi chạm nghĩa của nó, càng nhanh càng ít sai càng tốt. Có lưu kỷ lục theo từng bộ.",
    badge: "Chơi đơn",
    mascot: "hoc",
    gradient: "from-emerald-500 via-teal-600 to-cyan-800",
    button: "bg-emerald-600 hover:bg-emerald-500",
    icon: "gamepad",
  },
  {
    slug: "nghe-go",
    kind: "game",
    href: "/tro-choi/nghe-go",
    title: "Nghe & gõ",
    description:
      "Máy đọc từng từ tiếng Anh, bạn gõ lại đúng chính tả. Nghe lại bao nhiêu lần cũng được, có gợi ý nghĩa khi bí.",
    badge: "Nghe · nói",
    mascot: "nghe",
    gradient: "from-amber-400 via-orange-500 to-rose-600",
    button: "bg-orange-500 hover:bg-orange-400",
    icon: "speaker",
  },
  {
    slug: "quiz",
    kind: "game",
    href: "/quiz",
    title: "Quiz trắc nghiệm",
    description:
      "Mỗi câu một từ, chọn nghĩa đúng trong 4 đáp án. Cuối lượt xem lại những từ chọn sai để ôn thêm.",
    badge: "Chơi đơn",
    mascot: "tot-nghiep",
    gradient: "from-fuchsia-500 via-purple-600 to-indigo-800",
    button: "bg-purple-600 hover:bg-purple-500",
    icon: "quiz",
  },
  {
    slug: "phat-am",
    kind: "skill",
    href: "/phat-am",
    title: "Luyện phát âm",
    description:
      "Nghe giọng mẫu, bấm micro và nói theo. Máy chấm điểm từng từ, ghi âm lại để bạn tự nghe và so sánh.",
    badge: "Nghe · nói",
    mascot: "noi",
    gradient: "from-sky-400 via-cyan-500 to-blue-700",
    button: "bg-sky-600 hover:bg-sky-500",
    icon: "mic",
  },
];
