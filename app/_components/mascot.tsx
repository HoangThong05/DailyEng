import Image from "next/image";
import vitAnMung from "@/public/mascot/vit-an-mung.png";
import vitBuon from "@/public/mascot/vit-buon.png";
import vitChao from "@/public/mascot/vit-chao.png";
import vitChaoTrong from "@/public/mascot/vit-chao-trong.png";
import vitChoi from "@/public/mascot/vit-choi.png";
import vitHoc from "@/public/mascot/vit-hoc.png";
import vitNghe from "@/public/mascot/vit-nghe.png";
import vitNgu from "@/public/mascot/vit-ngu.png";
import vitNoi from "@/public/mascot/vit-noi.png";
import vitTotNghiep from "@/public/mascot/vit-tot-nghiep.png";

/**
 * Linh vật DailyEng — chú vịt vàng, 9 tư thế cho 9 ngữ cảnh.
 *
 * Bốn tư thế có ô nền xanh bo góc (dùng như logo/ảnh bìa):
 *  - tot-nghiep: đội mũ cử nhân ôm sách "English" — logo, icon app
 *  - chao:       nháy mắt vẫy "HELLO!"           — chào ở đăng nhập, trang chủ
 *  - chao-trong: bản chao đã bỏ ô nền xanh        — màn đang tải (vẫy tay)
 *  - nghe:       đeo tai nghe đọc sách ABC       — trò chơi, nghe & gõ
 *  - hoc:        đeo kính, cắm cúi viết          — tạo bộ từ, màn chưa có dữ liệu
 *  - choi:       cầm tay cầm, "GAME ON!"          — hub trò chơi
 * Bốn tư thế nền trong suốt (đặt thẳng lên card):
 *  - an-mung:    giơ cúp, pháo giấy              — kết quả tốt, đạt mục tiêu
 *  - buon:       mắt ướt, gãi đầu                — kết quả thấp, thua game
 *  - ngu:        đội mũ ngủ ôm gối, Zzz          — chưa học hôm nay, nhắc học
 *  - noi:        cầm micro, tai nghe             — luyện phát âm
 *
 * Ảnh gốc trong public/mascot/, next/image tự thu về đúng kích thước.
 * Bộ icon PWA/favicon sinh từ ảnh tot-nghiep bằng scripts/render-icons.mjs.
 */
export type MascotVariant =
  | "tot-nghiep"
  | "chao"
  | "chao-trong"
  | "nghe"
  | "hoc"
  | "choi"
  | "an-mung"
  | "buon"
  | "ngu"
  | "noi";

const SOURCES = {
  "tot-nghiep": vitTotNghiep,
  chao: vitChao,
  "chao-trong": vitChaoTrong,
  nghe: vitNghe,
  hoc: vitHoc,
  choi: vitChoi,
  "an-mung": vitAnMung,
  buon: vitBuon,
  ngu: vitNgu,
  noi: vitNoi,
} as const;

/** Chọn vịt vui hay buồn theo tỉ lệ đúng của một phiên. */
export function resultMascot(correct: number, total: number): MascotVariant {
  return total > 0 && correct / total >= 0.7 ? "an-mung" : "buon";
}

type MascotProps = {
  variant: MascotVariant;
  /** Cạnh hình vuông, px. */
  size: number;
  className?: string;
  /** Ảnh nằm trên màn hình đầu (LCP) thì nạp ưu tiên. */
  priority?: boolean;
};

export function Mascot({ variant, size, className, priority }: MascotProps) {
  return (
    <Image
      src={SOURCES[variant]}
      alt=""
      aria-hidden
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
