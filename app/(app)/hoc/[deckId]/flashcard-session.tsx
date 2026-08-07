"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { recordReview, refreshStudyViews } from "@/app/_actions/study";
import { MAX_BOX } from "@/lib/leitner";
import type { StudyCard } from "@/lib/decks";

/** Kéo quá bao nhiêu pixel thì tính là đã vuốt dứt khoát. */
const SWIPE_THRESHOLD = 90;
/** Di chuyển dưới ngưỡng này coi như chạm để lật thẻ, không phải kéo. */
const TAP_TOLERANCE = 8;
/** Một từ chỉ lặp lại tối đa ngần này lần trong cùng một phiên. */
const MAX_REPEATS = 3;

type Props = {
  deckName: string;
  cards: StudyCard[];
};

export function FlashcardSession({ deckName, cards }: Props) {
  const [queue, setQueue] = useState(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [rememberedIds, setRememberedIds] = useState<Set<string>>(new Set());
  const [failedSaves, setFailedSaves] = useState(0);
  const [dragX, setDragX] = useState(0);
  // Đang kéo thì bỏ transition để thẻ bám tay; thả ra mới cho nó trượt về.
  const [dragging, setDragging] = useState(false);

  const seenCount = useRef(new Map<string, number>());
  const dragStartX = useRef<number | null>(null);
  const movedFar = useRef(false);

  const current = queue[index];
  const finished = index >= queue.length;
  const progress = Math.round((rememberedIds.size / cards.length) * 100);

  function decide(remembered: boolean) {
    if (!current) return;

    const wordId = current.id;
    setDragX(0);
    setFlipped(false);

    // Không chờ mạng: thẻ chuyển ngay, kết quả lưu chạy nền.
    recordReview(wordId, remembered)
      .then((result) => {
        if (!result.ok) setFailedSaves((count) => count + 1);
      })
      .catch(() => setFailedSaves((count) => count + 1));

    const times = (seenCount.current.get(wordId) ?? 0) + 1;
    seenCount.current.set(wordId, times);

    let nextQueue = queue;
    if (remembered) {
      setRememberedIds((previous) => new Set(previous).add(wordId));
    } else if (times < MAX_REPEATS) {
      // Chưa thuộc thì gặp lại ở cuối phiên.
      nextQueue = [...queue, current];
      setQueue(nextQueue);
    }

    const nextIndex = index + 1;
    setIndex(nextIndex);

    if (nextIndex >= nextQueue.length) void refreshStudyViews();
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    dragStartX.current = event.clientX;
    movedFar.current = false;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStartX.current === null) return;
    const offset = event.clientX - dragStartX.current;
    if (Math.abs(offset) > TAP_TOLERANCE) movedFar.current = true;
    setDragX(offset);
  }

  function handlePointerUp() {
    if (dragStartX.current === null) return;
    dragStartX.current = null;
    setDragging(false);

    if (Math.abs(dragX) >= SWIPE_THRESHOLD) {
      decide(dragX > 0);
      return;
    }

    // Kéo nhẹ rồi thả thì coi như chạm lật thẻ.
    if (!movedFar.current) setFlipped((value) => !value);
    setDragX(0);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") decide(true);
    else if (event.key === "ArrowLeft") decide(false);
    else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      setFlipped((value) => !value);
    }
  }

  if (finished) {
    const forgot = cards.length - rememberedIds.size;

    return (
      <div className="flex flex-col items-center px-6 py-14 text-center">
        <span className="bg-brand-soft text-brand flex h-16 w-16 items-center justify-center rounded-2xl text-3xl">
          🎉
        </span>
        <h2 className="mt-5 text-xl font-bold">Xong phiên học</h2>
        <p className="text-muted mt-2 text-sm">
          Thuộc <span className="text-fg font-semibold">{rememberedIds.size}</span>
          /{cards.length} từ
          {forgot > 0 ? `, còn ${forgot} từ sẽ quay lại sớm` : ""}.
        </p>

        {failedSaves > 0 ? (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500"
          >
            {failedSaves} lượt chưa lưu được lên máy chủ, có thể do mất mạng.
            Những từ đó sẽ xuất hiện lại lần sau.
          </p>
        ) : null}

        <div className="mt-8 flex w-full flex-col gap-3">
          <Link
            href="/hoc"
            className="bg-brand flex min-h-12 items-center justify-center rounded-xl font-semibold text-white transition-transform duration-100 active:scale-[0.98]"
          >
            Chọn bộ khác
          </Link>
          <Link
            href="/"
            className="border-border text-muted flex min-h-12 items-center justify-center rounded-xl border font-medium transition-transform duration-100 active:scale-[0.98]"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const swipingRight = dragX > TAP_TOLERANCE;
  const swipingLeft = dragX < -TAP_TOLERANCE;

  return (
    <div className="px-5 pt-2">
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuenow={rememberedIds.size}
          aria-valuemin={0}
          aria-valuemax={cards.length}
          aria-label="Tiến độ phiên học"
          className="bg-brand-soft h-2 flex-1 overflow-hidden rounded-full"
        >
          <div
            className="bg-brand h-full rounded-full transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-muted text-sm tabular-nums">
          {rememberedIds.size}/{cards.length}
        </span>
      </div>

      <div
        role="group"
        aria-label={`Thẻ từ vựng, bộ ${deckName}. Mũi tên phải là đã thuộc, mũi tên trái là chưa thuộc, phím cách để lật thẻ.`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="mt-5 [perspective:1200px] focus:outline-none"
        // touch-none để trình duyệt không cuộn trang khi đang vuốt thẻ
        style={{ touchAction: "none" }}
      >
        <div
          className="relative min-h-[19rem] transition-transform [transform-style:preserve-3d]"
          style={{
            transform: `translateX(${dragX}px) rotate(${dragX / 22}deg) ${
              flipped ? "rotateY(180deg)" : ""
            }`,
            transitionDuration: dragging ? "0ms" : "300ms",
          }}
        >
          {/* Mặt trước: từ tiếng Anh */}
          <div className="border-border bg-card absolute inset-0 flex flex-col items-center justify-center rounded-3xl border p-6 text-center [backface-visibility:hidden]">
            <span className="text-muted absolute top-4 right-5 text-xs">
              Hộp {current.box}/{MAX_BOX}
            </span>
            <p className="text-3xl font-bold tracking-tight">{current.term}</p>
            {current.phonetic ? (
              <p className="text-muted mt-2 text-lg">{current.phonetic}</p>
            ) : null}
            <p className="text-muted mt-8 text-xs">Chạm để xem nghĩa</p>
          </div>

          {/* Mặt sau: nghĩa tiếng Việt */}
          <div className="border-border bg-card absolute inset-0 flex flex-col items-center justify-center rounded-3xl border p-6 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-2xl font-bold">{current.meaning_vi}</p>
            {current.example_en ? (
              <p className="text-muted mt-6 text-sm italic">
                {current.example_en}
              </p>
            ) : null}
            {current.example_vi ? (
              <p className="text-muted mt-1 text-sm">{current.example_vi}</p>
            ) : null}
          </div>

          {/* Nhãn hiện lên khi đang vuốt */}
          {swipingRight ? (
            <span className="pointer-events-none absolute top-6 left-6 rotate-[-12deg] rounded-lg border-2 border-emerald-500 px-3 py-1 text-sm font-bold text-emerald-500">
              THUỘC
            </span>
          ) : null}
          {swipingLeft ? (
            <span className="pointer-events-none absolute top-6 right-6 rotate-12 rounded-lg border-2 border-red-500 px-3 py-1 text-sm font-bold text-red-500">
              CHƯA THUỘC
            </span>
          ) : null}
        </div>
      </div>

      {/* Nút bấm thay cho vuốt — cần cho người dùng bàn phím và trình đọc màn hình */}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => decide(false)}
          className="min-h-14 flex-1 rounded-2xl border border-red-500/40 font-semibold text-red-500 transition-transform duration-100 active:scale-95"
        >
          Chưa thuộc
        </button>
        <button
          type="button"
          onClick={() => decide(true)}
          className="bg-brand min-h-14 flex-1 rounded-2xl font-semibold text-white transition-transform duration-100 active:scale-95"
        >
          Đã thuộc
        </button>
      </div>
    </div>
  );
}