"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { recordReview } from "@/app/_actions/study";
import { Celebration } from "@/app/_components/celebration";
import { CountUp } from "@/app/_components/count-up";
import { SpeakerIcon } from "@/app/_components/icons";
import { Mascot, resultMascot } from "@/app/_components/mascot";
import {
  gradeSentence,
  passesSentence,
  type SentenceItem,
  type TokenMark,
} from "@/lib/dictation-game";
import { playCorrect, playMiss, readSoundPreference, unlockAudio } from "@/lib/game-audio";
import { speak } from "@/lib/speech";
import { xpForAnswers } from "@/lib/xp";

type Phase = "intro" | "typing" | "checked" | "finished";

type Result = {
  item: SentenceItem;
  answer: string;
  marks: TokenMark[];
  accuracy: number;
  passed: boolean;
};

const SLOW_RATE = 0.6;

export function SentenceSession({ items }: { items: SentenceItem[] }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [plays, setPlays] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [sound, setSound] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const item = items[index];
  const current = results[results.length - 1];

  // Sang câu mới thì đọc luôn và đưa con trỏ vào ô gõ. Câu đầu do nút
  // "Bắt đầu" đọc, vì iOS chỉ cho phát tiếng sau một cú chạm.
  useEffect(() => {
    if (phase !== "typing" || index === 0) return;
    speak(items[index].sentence);
    inputRef.current?.focus();
  }, [phase, index, items]);

  function start() {
    unlockAudio();
    setSound(readSoundPreference());
    speak(items[0].sentence);
    setPhase("typing");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function replay(rate?: number) {
    speak(item.sentence, "en-US", rate);
    setPlays((count) => count + 1);
  }

  function check() {
    if (phase !== "typing" || !answer.trim()) return;

    const grade = gradeSentence(answer, item);
    const passed = passesSentence(grade);
    setResults((list) => [
      ...list,
      { item, answer, marks: grade.marks, accuracy: grade.accuracy, passed },
    ]);
    setPhase("checked");
    if (sound) (passed ? playCorrect : playMiss)();

    // Chép được câu có từ khoá = nhớ từ đó. Lưu chạy nền.
    void recordReview(item.wordId, passed, "chep-cau").catch(() => {});
  }

  function next() {
    setAnswer("");
    setPlays(0);
    setShowHint(false);
    if (index + 1 >= items.length) {
      setPhase("finished");
      return;
    }
    setIndex((value) => value + 1);
    setPhase("typing");
  }

  if (phase === "intro") {
    return (
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <Mascot variant="nghe" size={128} priority />
        <h2 className="mt-4 text-xl font-bold">{items.length} câu</h2>
        <p className="text-muted mt-2 max-w-xs text-sm">
          Máy đọc cả câu ví dụ, bạn gõ lại. Nghe lại bao nhiêu lần cũng được,
          có nút đọc chậm. Chấm từng từ, đúng từ khoá và ≥ 70% câu là đạt.
        </p>
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

  if (phase === "finished") {
    const passedCount = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed);
    const avg = Math.round(
      (results.reduce((sum, r) => sum + r.accuracy, 0) / results.length) * 100,
    );

    return (
      <div className="space-y-5 px-5 pt-2">
        <Celebration />
        <div className="border-border bg-card rounded-2xl border p-6 text-center">
          <Mascot
            variant={resultMascot(passedCount, results.length)}
            size={112}
            className="mx-auto"
          />
          <p className="text-muted mt-2 text-sm">Câu đạt</p>
          <p className="mt-1 text-5xl font-bold tabular-nums">
            <CountUp value={passedCount} />/{results.length}
          </p>
          <p className="text-muted mt-3 text-sm">
            Chép đúng trung bình <CountUp value={avg} suffix="%" /> số từ.
          </p>
          <p className="text-brand mt-3 text-sm font-semibold tabular-nums">
            <CountUp
              prefix="+"
              value={xpForAnswers(passedCount, failed.length)}
              suffix=" XP"
            />
          </p>
        </div>

        {failed.length > 0 ? (
          <div className="border-border bg-card rounded-2xl border p-4">
            <p className="mb-2 text-sm font-semibold">Câu chưa đạt</p>
            <ul className="space-y-3">
              {failed.map((r) => (
                <li key={r.item.wordId} className="text-sm">
                  <p className="font-medium">{r.item.sentence}</p>
                  <p className="text-muted">{r.item.translation ?? r.item.meaning}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 pb-4">
          <Link
            href="/ky-nang/chep-cau"
            className="bg-brand flex min-h-12 items-center justify-center rounded-xl font-semibold text-white press"
          >
            Chọn bộ khác
          </Link>
          <Link
            href="/ky-nang"
            className="border-border text-muted flex min-h-12 items-center justify-center rounded-xl border font-medium press"
          >
            Về luyện kỹ năng
          </Link>
        </div>
      </div>
    );
  }

  const checked = phase === "checked" && current;

  return (
    <div className="px-5 pt-2">
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuenow={index}
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-label="Tiến độ"
          className="bg-brand-soft h-2 flex-1 overflow-hidden rounded-full"
        >
          <div
            className="bg-brand h-full rounded-full transition-[width] duration-300"
            style={{ width: `${(index / items.length) * 100}%` }}
          />
        </div>
        <span className="text-muted text-sm tabular-nums">
          {index + 1}/{items.length}
        </span>
      </div>

      <div key={index} className="step-enter border-border bg-card mt-5 rounded-3xl border p-6 text-center">
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => replay()}
            aria-label="Nghe lại"
            className="bg-brand flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg shadow-brand/30 press"
          >
            <SpeakerIcon className="h-9 w-9" />
          </button>
          <button
            type="button"
            onClick={() => replay(SLOW_RATE)}
            className="border-border bg-card text-muted min-h-11 rounded-xl border px-4 text-sm font-semibold press"
          >
            🐢 Đọc chậm
          </button>
        </div>
        <p className="text-muted mt-3 text-xs">
          {plays > 0 ? `Đã nghe ${plays + 1} lần` : "Nghe cả câu rồi gõ lại"}
        </p>

        {checked ? (
          <div className="mt-5 text-left">
            <p className="text-lg leading-relaxed">
              {current.marks.map((mark, i) => (
                <span
                  key={i}
                  className={`mr-1 inline-block rounded px-1 ${
                    mark.hit
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-red-500/15 font-semibold text-red-500"
                  }`}
                >
                  {mark.text}
                </span>
              ))}
            </p>
            <p className="text-muted mt-2 text-sm">
              {current.item.translation ?? current.item.meaning}
            </p>
            <p
              className={`mt-3 text-sm font-semibold ${
                current.passed ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {current.passed ? "Đạt" : "Chưa đạt"} ·{" "}
              {Math.round(current.accuracy * 100)}% từ đúng
            </p>
            {current.answer.trim() ? (
              <p className="text-muted mt-2 text-sm">
                Bạn gõ: <span className="italic">{current.answer}</span>
              </p>
            ) : null}
          </div>
        ) : showHint ? (
          <p className="text-brand mt-4 text-sm">
            Từ khoá: <span className="font-semibold">{item.term}</span> —{" "}
            {item.meaning}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setShowHint(true)}
            className="text-muted mt-4 text-sm underline"
          >
            Gợi ý từ khoá
          </button>
        )}
      </div>

      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (phase === "typing") check();
          else next();
        }}
      >
        <textarea
          ref={inputRef}
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          onKeyDown={(event) => {
            // Enter gửi, Shift+Enter xuống dòng.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (phase === "typing") check();
              else next();
            }
          }}
          disabled={phase !== "typing"}
          rows={3}
          autoCapitalize="sentences"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Gõ lại cả câu…"
          aria-label="Câu trả lời"
          className="border-border bg-card focus:border-brand w-full resize-none rounded-2xl border px-4 py-3 text-lg outline-none"
        />
        <button
          type="submit"
          className="bg-brand min-h-14 w-full rounded-2xl font-semibold text-white press"
        >
          {phase === "typing"
            ? "Kiểm tra"
            : index + 1 >= items.length
              ? "Xem kết quả"
              : "Câu tiếp"}
        </button>
      </form>
    </div>
  );
}
