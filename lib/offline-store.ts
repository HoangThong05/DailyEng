import type { Rating } from "@/lib/leitner";
import type { PathWord } from "@/lib/study-path";

/**
 * Kho offline trong localStorage (chỉ gọi ở client):
 *  - gói từ: những từ sắp/đến hạn ôn, tải sẵn khi còn mạng;
 *  - hàng đợi: kết quả ôn lúc mất mạng, đẩy lên server khi có mạng lại.
 */
const PACK_KEY = "dailyeng-offline-pack";
const QUEUE_KEY = "dailyeng-offline-queue";

/** Gói cũ hơn ngần này thì tải lại (ms). */
export const PACK_MAX_AGE = 6 * 60 * 60 * 1000;

export type OfflinePack = { savedAt: number; words: PathWord[] };
export type QueuedReview = { wordId: string; rating: Rating; at: number };

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Hết chỗ / chế độ riêng tư: bỏ qua, offline chỉ là tiện ích phụ.
  }
}

export function readPack(): OfflinePack | null {
  const pack = read<OfflinePack>(PACK_KEY);
  return pack && Array.isArray(pack.words) ? pack : null;
}

export function writePack(words: PathWord[]) {
  write(PACK_KEY, { savedAt: Date.now(), words } satisfies OfflinePack);
}

export function packIsStale() {
  const pack = readPack();
  return !pack || Date.now() - pack.savedAt > PACK_MAX_AGE;
}

export function readQueue(): QueuedReview[] {
  return read<QueuedReview[]>(QUEUE_KEY) ?? [];
}

export function enqueueReview(wordId: string, rating: Rating) {
  write(QUEUE_KEY, [...readQueue(), { wordId, rating, at: Date.now() }]);
}

export function clearQueue() {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    // như trên
  }
}
