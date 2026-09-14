import emojiMap from "@/content/emoji-words.json";
import photoMap from "@/content/photo-words.json";

/** Số câu mỗi lượt Nghe chọn hình. */
export const PICTURE_SIZE = 10;
/** Cần ít nhất ngần này từ có hình để dựng được câu hỏi 4 lựa chọn. */
export const PICTURE_MIN_WORDS = 4;

const MAP: Record<string, string> = Object.fromEntries(
  Object.entries(emojiMap).filter(([key]) => !key.startsWith("_")),
);

/**
 * Ảnh thật (Pixabay, tải bằng scripts/fetch-photos.py) cho từ, nếu có.
 * Đường dẫn công khai dưới public/photos/.
 */
const PHOTOS = photoMap as Record<string, { file: string }>;

export function photoFor(term: string) {
  const entry = PHOTOS[term.trim().toLowerCase()];
  return entry ? `/photos/${entry.file}` : undefined;
}

/** Emoji minh hoạ cho từ, hoặc undefined nếu từ không có hình. */
export function emojiFor(term: string) {
  return MAP[term.trim().toLowerCase()];
}

export function hasPicture(term: string) {
  return emojiFor(term) !== undefined;
}

/** Danh sách [từ, emoji] toàn cục, để mượn đáp án nhiễu khi bộ ít từ có hình. */
export const PICTURE_POOL: [string, string][] = Object.entries(MAP);

export type PictureOption = {
  emoji: string;
  term: string;
  /** Ảnh thật nếu đã tải; không có thì vẽ emoji. */
  photo?: string;
};

export type PictureQuestion = {
  wordId: string;
  term: string;
  meaning: string;
  phonetic: string | null;
  options: PictureOption[];
  correctIndex: number;
};
