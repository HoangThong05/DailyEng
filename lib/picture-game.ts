import emojiMap from "@/content/emoji-words.json";

/** Số câu mỗi lượt Nghe chọn hình. */
export const PICTURE_SIZE = 10;
/** Cần ít nhất ngần này từ có hình để dựng được câu hỏi 4 lựa chọn. */
export const PICTURE_MIN_WORDS = 4;

const MAP: Record<string, string> = Object.fromEntries(
  Object.entries(emojiMap).filter(([key]) => !key.startsWith("_")),
);

/** Emoji minh hoạ cho từ, hoặc undefined nếu từ không có hình. */
export function emojiFor(term: string) {
  return MAP[term.trim().toLowerCase()];
}

export function hasPicture(term: string) {
  return emojiFor(term) !== undefined;
}

/** Danh sách [từ, emoji] toàn cục, để mượn đáp án nhiễu khi bộ ít từ có hình. */
export const PICTURE_POOL: [string, string][] = Object.entries(MAP);

export type PictureOption = { emoji: string; term: string };

export type PictureQuestion = {
  wordId: string;
  term: string;
  meaning: string;
  phonetic: string | null;
  options: PictureOption[];
  correctIndex: number;
};
