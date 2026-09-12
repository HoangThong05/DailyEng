/**
 * Phần thuần logic của trò Ghép cặp: kiểu dữ liệu, trộn, dựng ô.
 * Không import gì phía server nên client component dùng được.
 */

/** Số cặp mỗi ván ghép: 8 cặp = 16 ô, vừa một màn điện thoại không cuộn. */
export const MATCH_PAIRS = 8;
/** Bộ phải có ít nhất ngần này từ mới đủ để ghép có ý nghĩa. */
export const MATCH_MIN_WORDS = 4;

export type MatchPair = {
  wordId: string;
  term: string;
  meaning: string;
};

export type MatchTile = {
  id: string;
  wordId: string;
  kind: "term" | "meaning";
  text: string;
};

/** Trộn mảng, không đụng vào mảng gốc. */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Trải các cặp thành ô rời và trộn. Gọi ở server để client không lệch hydrate. */
export function buildMatchTiles(pairs: MatchPair[]): MatchTile[] {
  return shuffle(
    pairs.flatMap((pair) => [
      { id: `${pair.wordId}:t`, wordId: pair.wordId, kind: "term" as const, text: pair.term },
      { id: `${pair.wordId}:m`, wordId: pair.wordId, kind: "meaning" as const, text: pair.meaning },
    ]),
  );
}
