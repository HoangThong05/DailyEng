"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { recordRating } from "@/app/_actions/study";
import { Celebration } from "@/app/_components/celebration";
import { CountUp } from "@/app/_components/count-up";
import { CheckIcon, CloseIcon, SparkleIcon, SpeakerIcon } from "@/app/_components/icons";
import { Mascot, resultMascot } from "@/app/_components/mascot";
import { playCorrect, playMiss, readSoundPreference, unlockAudio } from "@/lib/game-audio";
import type { Rating } from "@/lib/leitner";
import { parseMeaning } from "@/lib/pos";
import { speak } from "@/lib/speech";
import { type PathWord, splitSentence } from "@/lib/study-path";
import { xpForAnswers } from "@/lib/xp";

type Phase = "intro" | "playing" | "finished";

type Props = {
  title: string;
  words: PathWord[];
  aiEnabled?: boolean;
  /** Thay cách lưu kết quả (mặc định gọi server). Ôn offline thì xếp hàng đợi. */
  onRate?: (wordId: string, rating: Rating) => void;
  /** Thay cụm nút ở màn kết quả (mặc định: Chọn bộ khác / Về trang chủ). */
  footer?: React.ReactNode;
};

/** Từ "quên" được cho gặp lại tối đa ngần này lần trong phiên. */
const MAX_AGAIN = 2;

/**
 * Hai mức tự chấm, nhất quán với cả app (nhớ / quên). Số hộp, số ngày là việc
 * của thuật toán Leitner, người học không cần bận tâm.
 */
const RATING_UI: {
  rating: Rating;
  label: string;
  Icon: (p: { className?: string }) => React.JSX.Element;
  className: string;
  key: string;
}[] = [
  {
    rating: "again",
    label: "Chưa nhớ",
    Icon: CloseIcon,
    className: "border-red-500/40 bg-red-500/10 text-red-500 hover:bg-red-500/20",
    key: "1",
  },
  {
    rating: "good",
    label: "Nhớ rồi",
    Icon: CheckIcon,
    className: "border-brand/50 bg-brand-soft text-brand hover:bg-brand/15",
    key: "2",
  },
];

function Highlighted({ sentence, term }: { sentence: string; term: string }) {
  const { before, hit, after } = splitSentence(sentence, term);
  return (
    <>
      {before}
      {hit ? <mark className="bg-brand/15 text-brand rounded px-1 font-semibold">{hit}</mark> : null}
      {after}
    </>
  );
}

/**
 * Chế độ "Thẻ lật": xem mặt trước (ảnh, từ, phiên âm), tự nhớ nghĩa, lật ra
 * kiểm tra rồi tự chấm 4 mức. Nhanh hơn học theo chặng, hợp với ôn từ đã quen.
 * Từ chấm "Quên" quay lại cuối hàng để gặp thêm lần nữa.
 */
export function CardSession({ title, words, aiEnabled = false, onRate, footer }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [queue, setQueue] = useState<PathWord[]>(words);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [againCount, setAgainCount] = useState<Map<string, number>>(new Map());
  const [ratings, setRatings] = useState<Map<string, Rating>>(new Map());
  const [failedSaves, setFailedSaves] = useState(0);
  const [sound, setSound] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  const word = queue[index];
  const remembered = words.filter((w) => {
    const r = ratings.get(w.id);
    return r && r !== "again";
  });
  const forgot = words.filter((w) => !ratings.has(w.id) || ratings.get(w.id) === "again");

  // Sang thẻ mới: đọc từ và đưa focus vào thẻ để Space lật được ngay.
  useEffect(() => {
    if (phase !== "playing" || !word) return;
    speak(word.term);
    cardRef.current?.focus();
  }, [phase, word]);

  function start() {
    unlockAudio();
    setSound(readSoundPreference());
    setPhase("playing");
  }

  function flip() {
    setFlipped((value) => !value);
  }

  function rate(rating: Rating) {
    if (!word || busy) return;
    setBusy(true);
    if (sound) (rating === "again" ? playMiss : playCorrect)();

    // Mức cuối cùng của từ mới là thứ được tính ở màn kết quả.
    setRatings((previous) => new Map(previous).set(word.id, rating));
    if (onRate) {
      onRate(word.id, rating);
    } else {
      recordRating(word.id, rating)
        .then((result) => {
          if (!result.ok) setFailedSaves((n) => n + 1);
        })
        .catch(() => setFailedSaves((n) => n + 1));
    }

    // "Quên" thì xếp lại cuối hàng (tối đa MAX_AGAIN lần).
    if (rating === "again") {
      const seen = againCount.get(word.id) ?? 0;
      if (seen < MAX_AGAIN) {
        setAgainCount((previous) => new Map(previous).set(word.id, seen + 1));
        setQueue((previous) => [...previous, word]);
      }
    }

    setFlipped(false);
    setBusy(false);
    // Hết hàng (kể cả thẻ vừa nối thêm) thì sang màn kết quả.
    const willRequeue = rating === "again" && (againCount.get(word.id) ?? 0) < MAX_AGAIN;
    if (index + 1 >= queue.length && !willRequeue) setPhase("finished");
    else setIndex((i) => i + 1);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (phase !== "playing" || !word) return;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      flip();
      return;
    }
    if (!flipped) return;
    const found = RATING_UI.find((ui) => ui.key === event.key);
    if (found) {
      event.preventDefault();
      rate(found.rating);
    }
  }

  /* ---------- Giới thiệu ---------- */
  if (phase === "intro") {
    return (
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <Mascot variant="hoc" size={128} priority />
        <h2 className="mt-4 text-xl font-bold">{words.length} thẻ</h2>
        <p className="text-muted mt-2 max-w-xs text-sm">
          Nhìn từ, tự nhớ nghĩa, lật ra xem đúng không rồi tự chấm. App sẽ tự sắp lịch: từ quên
          gặp lại sớm, từ dễ lâu mới gặp lại.
        </p>
        <ul className="text-muted mt-6 w-full max-w-xs space-y-2 text-left text-sm">
          <li className="border-border bg-card flex items-center gap-3 rounded-xl border px-4 py-3">
            <span className="text-lg">🔄</span> Bấm thẻ hoặc phím Space để lật
          </li>
          <li className="border-border bg-card flex items-center gap-3 rounded-xl border px-4 py-3">
            <span className="text-lg">⌨️</span> Phím 1 = Chưa nhớ, 2 = Nhớ rồi
          </li>
          <li className="border-border bg-card flex items-center gap-3 rounded-xl border px-4 py-3">
            <span className="text-lg">🔁</span> Chưa nhớ thì thẻ quay lại cuối hàng
          </li>
        </ul>
        <button
          type="button"
          onClick={start}
          className="bg-brand mt-8 min-h-12 w-full max-w-xs rounded-xl font-semibold text-white press"
        >
          Bắt đầu
        </button>
      </div>
    );
  }

  /* ---------- Kết quả ---------- */
  if (phase === "finished" || !word) {
    return (
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <Celebration />
        <Mascot variant={resultMascot(remembered.length, words.length)} size={128} />
        <h2 className="mt-3 text-xl font-bold">Xong phiên ôn</h2>
        <p className="text-brand mt-2 text-sm font-semibold tabular-nums">
          <CountUp prefix="+" value={xpForAnswers(remembered.length, forgot.length)} suffix=" XP" />
        </p>
        <p className="text-muted mt-1 text-sm">
          Nhớ {remembered.length}/{words.length} thẻ
          {forgot.length > 0 ? ` · ${forgot.length} thẻ cần gặp lại` : ""}
        </p>
        {failedSaves > 0 ? (
          <p role="alert" className="mt-2 text-xs text-red-500">
            {failedSaves} lượt chưa lưu được — kiểm tra mạng rồi ôn lại nhé.
          </p>
        ) : null}

        {forgot.length > 0 ? (
          <ul className="mt-6 w-full max-w-sm space-y-2 text-left">
            {forgot.map((w) => (
              <li key={w.id} className="border-border bg-card flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="font-semibold">{w.term}</span>
                  <span className="text-muted"> · {parseMeaning(w.meaning_vi).meaning}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Nghe ${w.term}`}
                  onClick={() => speak(w.term)}
                  className="bg-brand-soft text-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-full press"
                >
                  <SpeakerIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {footer ?? (
          <div className="mt-8 grid w-full max-w-sm grid-cols-2 gap-3">
            <Link
              href="/hoc"
              className="border-border text-muted flex min-h-12 items-center justify-center rounded-xl border font-medium press"
            >
              Chọn bộ khác
            </Link>
            <Link
              href="/"
              className="bg-brand flex min-h-12 items-center justify-center rounded-xl font-semibold text-white press"
            >
              Về trang chủ
            </Link>
          </div>
        )}
      </div>
    );
  }

  /* ---------- Đang ôn ---------- */
  const parsed = parseMeaning(word.meaning_vi);
  const progress = Math.round((index / queue.length) * 100);

  return (
    <div className="px-5 pt-2 pb-6" onKeyDown={onKeyDown}>
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuenow={index}
          aria-valuemin={0}
          aria-valuemax={queue.length}
          aria-label={`Tiến độ ${title}`}
          className="bg-brand-soft h-2 flex-1 overflow-hidden rounded-full"
        >
          <div className="bg-brand h-full rounded-full transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-muted shrink-0 text-sm tabular-nums">
          {index + 1}/{queue.length}
        </span>
      </div>

      {/* Thẻ lật 3D: hai mặt chồng lên nhau, xoay quanh trục dọc */}
      <div className="flip-scene mt-4">
        <div
          ref={cardRef}
          role="button"
          tabIndex={0}
          onClick={flip}
          aria-pressed={flipped}
          aria-label={flipped ? "Thẻ đã lật, bấm để úp lại" : "Bấm để lật thẻ"}
          className={`flip-card focus-visible:ring-brand/50 w-full cursor-pointer rounded-3xl outline-none focus-visible:ring-4 ${
            flipped ? "is-flipped" : ""
          }`}
        >
          {/* Mặt trước */}
          <div
            inert={flipped}
            className="border-border bg-card flex min-h-[22rem] flex-col items-center justify-center rounded-3xl border px-6 py-6 text-center shadow-sm"
          >
            {/* Mặt trước chỉ có chữ: ảnh minh hoạ chỉ có cho một phần từ và
                đôi khi sai nghĩa, nên bỏ hẳn cho nhất quán. */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <p className="text-4xl font-bold tracking-tight">{word.term}</p>
              {parsed.pos ? (
                <span className="bg-brand-soft text-brand rounded-full px-2.5 py-0.5 text-xs font-bold">
                  {parsed.pos}
                </span>
              ) : null}
            </div>
            <div className="mt-2 flex items-center gap-2">
              {word.phonetic ? <span className="ipa text-muted text-lg">{word.phonetic}</span> : null}
              <button
                type="button"
                aria-label="Nghe phát âm"
                onClick={(event) => {
                  event.stopPropagation();
                  speak(word.term);
                }}
                className="bg-brand-soft text-brand flex h-9 w-9 items-center justify-center rounded-full press"
              >
                <SpeakerIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="text-muted mt-5 text-xs">Nhớ nghĩa chưa? Bấm để lật · Space</p>
          </div>

          {/* Mặt sau */}
          <div
            inert={!flipped}
            className="flip-back border-brand/40 bg-card flex min-h-[22rem] flex-col justify-center rounded-3xl border px-6 py-6 shadow-sm"
          >
            <p className="text-muted text-center text-sm font-semibold">
              {word.term}
              {word.phonetic ? <span className="ipa font-normal"> {word.phonetic}</span> : null}
            </p>
            <p className="mt-2 text-center text-3xl font-bold">{parsed.meaning}</p>
            {parsed.pos ? (
              <p className="text-brand mt-1 text-center text-xs font-bold">{parsed.pos}</p>
            ) : null}
            {word.example_en ? (
              <div className="bg-brand-soft/60 mt-5 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed">
                      <Highlighted sentence={word.example_en} term={word.term} />
                    </p>
                    {word.example_vi ? <p className="text-muted mt-1 text-sm">{word.example_vi}</p> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Nghe cả câu"
                      onClick={(event) => {
                        event.stopPropagation();
                        speak(word.example_en ?? "", "en-US", 0.95);
                      }}
                      className="bg-card text-brand border-border flex h-9 w-9 items-center justify-center rounded-full border press"
                    >
                      <SpeakerIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Nghe chậm"
                      onClick={(event) => {
                        event.stopPropagation();
                        speak(word.example_en ?? "", "en-US", 0.65);
                      }}
                      className="bg-card text-muted border-border flex h-9 w-9 items-center justify-center rounded-full border text-sm press"
                    >
                      🐢
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            {aiEnabled ? (
              <Link
                href={`/hoi-ai?q=${encodeURIComponent(
                  `Giải thích từ "${word.term}" (${parsed.meaning}) và cách dùng${word.example_en ? ` trong câu: "${word.example_en}"` : ""}`,
                )}`}
                onClick={(event) => event.stopPropagation()}
                className="text-brand mt-4 inline-flex items-center gap-1 self-center text-xs font-semibold hover:underline"
              >
                <SparkleIcon className="h-3.5 w-3.5" /> Hỏi AI về từ này
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Chấm điểm: chỉ hiện sau khi lật */}
      {flipped ? (
        <div className="step-enter mt-4">
          <div className="grid grid-cols-2 gap-3">
            {RATING_UI.map((ui) => (
              <button
                key={ui.rating}
                type="button"
                onClick={() => rate(ui.rating)}
                disabled={busy}
                className={`relative flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 text-base font-bold transition-colors press ${ui.className}`}
              >
                <ui.Icon className="h-5 w-5" />
                {ui.label}
                <kbd
                  aria-hidden
                  className="absolute top-1.5 right-2 hidden rounded-md border border-current/30 px-1.5 text-[10px] font-semibold opacity-60 sm:block"
                >
                  {ui.key}
                </kbd>
              </button>
            ))}
          </div>
          <p className="text-muted mt-3 text-center text-xs">
            Chưa nhớ → gặp lại ngay trong phiên · Nhớ rồi → lâu hơn mới gặp lại
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={flip}
          className="bg-brand mt-4 min-h-14 w-full rounded-2xl font-semibold text-white press"
        >
          Lật thẻ
        </button>
      )}
    </div>
  );
}
