"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { submitMockTest } from "@/app/_actions/mock-test";
import { Celebration } from "@/app/_components/celebration";
import { CountUp } from "@/app/_components/count-up";
import { SpeakerIcon } from "@/app/_components/icons";
import { Mascot, resultMascot } from "@/app/_components/mascot";
import type { Part2Question } from "@/lib/mock-test";
import { pause, speak, speakAsync, stopSpeaking } from "@/lib/speech";

const LETTERS = ["A", "B", "C"];
/** Được nghe lại mỗi câu ngần này lần (đề thật là 0, tập thì nới ra). */
const REPLAYS = 1;

const TYPE_LABEL: Record<Part2Question["type"], string> = {
  wh: "Câu hỏi Wh-",
  yesno: "Câu hỏi Yes/No",
  choice: "Câu hỏi lựa chọn",
  statement: "Câu trần thuật",
  tag: "Câu hỏi đuôi",
};

type Props = { questions: Part2Question[]; token: string; seconds: number };
type Phase = "intro" | "testing" | "done";
/** Đang đọc gì: -1 câu hỏi, 0..2 đáp án, null im lặng. */
type Reading = -1 | 0 | 1 | 2 | null;

function formatClock(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Part 2: máy đọc câu hỏi rồi ba đáp án A, B, C; màn hình không in chữ.
 * Chọn A/B/C, sang câu sau tự đọc tiếp. Nộp bài mới thấy lời thoại và giải thích.
 */
export function Part2Session({ questions, token, seconds }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [replays, setReplays] = useState<number[]>(() => questions.map(() => 0));
  const [reading, setReading] = useState<Reading>(null);
  const [left, setLeft] = useState(seconds);
  const [saveError, setSaveError] = useState<string | null>(null);
  /** Tăng lên mỗi lần bắt đầu đọc, để lượt đọc cũ biết mình đã bị thay. */
  const playToken = useRef(0);

  useEffect(() => {
    if (phase !== "testing") return;
    const timer = setInterval(() => setLeft((value) => (value <= 1 ? 0 : value - 1)), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (left === 0 && phase === "testing") submit();
    // submit đọc state hiện tại; chỉ chạy khi đồng hồ về 0.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  // Rời trang thì tắt tiếng.
  useEffect(() => () => stopSpeaking(), []);

  async function play(i: number) {
    const mine = ++playToken.current;
    const alive = () => playToken.current === mine;
    stopSpeaking();
    const q = questions[i];

    setReading(-1);
    await speakAsync(q.question, 0.95);
    if (!alive()) return;
    await pause(700);
    for (let k = 0; k < q.options.length; k++) {
      if (!alive()) return;
      setReading(k as Reading);
      await speakAsync(`${LETTERS[k]}. ${q.options[k]}`, 0.95);
      await pause(500);
    }
    if (alive()) setReading(null);
  }

  function start() {
    setPhase("testing");
    void play(0);
  }

  function replay() {
    if (replays[index] >= REPLAYS || reading !== null) return;
    setReplays((list) => list.map((n, i) => (i === index ? n + 1 : n)));
    void play(index);
  }

  function choose(optionIndex: number) {
    setAnswers((list) => list.map((a, i) => (i === index ? optionIndex : a)));
  }

  function go(next: number) {
    setIndex(next);
    void play(next);
  }

  function submit() {
    if (phase === "done") return;
    playToken.current += 1;
    stopSpeaking();
    setReading(null);
    setPhase("done");
    void submitMockTest(token, answers, seconds - left, "toeic-part2").then((result) => {
      if (!result.ok) setSaveError(result.error);
    });
  }

  const score = questions.filter((q, i) => answers[i] === q.answer).length;

  /* ---------- Mở đầu ---------- */
  if (phase === "intro") {
    return (
      <div className="space-y-4 px-5 pt-2">
        <div className="border-border bg-card rounded-2xl border p-6 text-center">
          <Mascot variant="nghe" size={96} className="mx-auto rounded-2xl" />
          <p className="mt-3 font-semibold">Nghe câu hỏi, chọn câu đáp lại hợp nhất</p>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Máy đọc một câu hỏi (hoặc câu nói) rồi ba câu đáp A, B, C. Không có chữ trên
            màn hình — giống đề thật. Mỗi câu được nghe lại {REPLAYS} lần. Đeo tai nghe và
            chọn giọng đọc ở Cá nhân nếu nghe chưa rõ.
          </p>
        </div>
        <button
          type="button"
          onClick={start}
          className="bg-brand flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-lg font-bold text-white press"
        >
          <SpeakerIcon className="h-6 w-6" /> Bắt đầu nghe
        </button>
      </div>
    );
  }

  /* ---------- Kết quả ---------- */
  if (phase === "done") {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <div className="space-y-5 px-5 pt-2 pb-4">
        <Celebration />
        <div className="border-border bg-card rounded-2xl border p-6 text-center">
          <Mascot variant={resultMascot(score, questions.length)} size={112} className="mx-auto" />
          <p className="text-muted mt-2 text-sm">Kết quả Part 2</p>
          <p className="mt-1 text-5xl font-bold tabular-nums">
            <CountUp value={score} />/{questions.length}
          </p>
          <p className="text-muted mt-2 text-sm">
            <CountUp value={percent} suffix="%" /> đúng · làm trong {formatClock(seconds - left)}
          </p>
          <p className="text-muted mt-1 text-sm">
            {percent >= 85
              ? "Nghe rất tốt — đáp án bẫy lặp từ không lừa được bạn."
              : percent >= 65
                ? "Khá ổn. Để ý dạng câu hỏi: Wh- không trả lời Yes/No."
                : "Nghe lại từng câu bên dưới, chú ý từ để hỏi ở đầu câu."}
          </p>
          {saveError ? (
            <p role="alert" className="mt-3 text-sm text-red-500">
              Không lưu được kết quả: {saveError}
            </p>
          ) : null}
        </div>

        <ol className="space-y-3">
          {questions.map((q, i) => {
            const mine = answers[i];
            const correct = mine === q.answer;
            return (
              <li
                key={q.id}
                className={`rounded-2xl border p-4 ${
                  correct ? "border-emerald-500/40 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-muted text-xs font-semibold">
                    Câu {i + 1} · {TYPE_LABEL[q.type]}
                  </p>
                  <button
                    type="button"
                    aria-label="Nghe lại câu hỏi"
                    onClick={() => speak(q.question, "en-US", 0.95)}
                    className="bg-brand-soft text-brand flex h-8 w-8 items-center justify-center rounded-full press"
                  >
                    <SpeakerIcon className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 font-semibold">{q.question}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {q.options.map((option, k) => {
                    const isAnswer = k === q.answer;
                    const isMine = k === mine;
                    return (
                      <li
                        key={option}
                        className={`flex items-start gap-2 rounded-lg px-2 py-1 ${
                          isAnswer
                            ? "bg-emerald-500/15 font-semibold text-emerald-700 dark:text-emerald-400"
                            : isMine
                              ? "bg-red-500/10 text-red-500 line-through"
                              : "text-muted"
                        }`}
                      >
                        <span className="w-5 shrink-0 font-bold">{LETTERS[k]}.</span>
                        <span>{option}</span>
                      </li>
                    );
                  })}
                </ul>
                {mine === null ? (
                  <p className="mt-1 text-xs font-semibold text-red-500">Bỏ trống</p>
                ) : null}
                <p className="text-muted mt-2 text-sm">{q.explain}</p>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col gap-3">
          <Link
            href="/ky-nang/mock-test/part2"
            className="bg-brand flex min-h-12 items-center justify-center rounded-xl font-semibold text-white press"
          >
            Làm đề khác
          </Link>
          <Link
            href="/ky-nang/mock-test"
            className="border-border text-muted flex min-h-12 items-center justify-center rounded-xl border font-medium press"
          >
            Xem lịch sử
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- Đang làm ---------- */
  const chosen = answers[index];
  const urgent = left <= 60;
  const replaysLeft = REPLAYS - replays[index];

  return (
    <div className="px-5 pt-2 pb-4">
      <div className="flex items-center justify-between">
        <span className="text-muted text-sm tabular-nums">
          Câu {index + 1}/{questions.length} · đã làm {answers.filter((a) => a !== null).length}
        </span>
        <span
          aria-live="polite"
          className={`rounded-full px-3 py-1 text-sm font-bold tabular-nums ${
            urgent ? "bg-red-500/15 text-red-500" : "bg-brand-soft text-brand"
          }`}
        >
          ⏱ {formatClock(left)}
        </span>
      </div>

      <div key={index} className="step-enter border-border bg-card mt-4 rounded-3xl border p-6 text-center">
        <span
          className={`bg-brand-soft text-brand mx-auto flex h-20 w-20 items-center justify-center rounded-full transition-transform ${
            reading !== null ? "scale-110 animate-pulse" : ""
          }`}
        >
          <SpeakerIcon className="h-9 w-9" />
        </span>
        <p className="text-muted mt-4 min-h-5 text-sm" aria-live="polite">
          {reading === -1
            ? "Đang đọc câu hỏi…"
            : reading !== null
              ? `Đang đọc đáp án ${LETTERS[reading]}…`
              : chosen === null
                ? "Chọn câu đáp lại hợp nhất"
                : `Đã chọn ${LETTERS[chosen]}`}
        </p>
        <button
          type="button"
          onClick={replay}
          disabled={replaysLeft <= 0 || reading !== null}
          className="text-brand mt-3 text-sm font-semibold disabled:opacity-40"
        >
          Nghe lại{replaysLeft > 0 ? ` (còn ${replaysLeft})` : " (hết lượt)"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {LETTERS.map((letter, k) => {
          const active = chosen === k;
          const isReading = reading === k;
          return (
            <button
              key={letter}
              type="button"
              onClick={() => choose(k)}
              aria-pressed={active}
              className={`flex min-h-20 items-center justify-center rounded-2xl border text-2xl font-extrabold transition-colors press ${
                active
                  ? "border-brand bg-brand text-white"
                  : isReading
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-border bg-card"
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => go(Math.max(0, index - 1))}
          disabled={index === 0}
          className="border-border min-h-12 flex-1 rounded-xl border font-semibold press disabled:opacity-40"
        >
          ← Trước
        </button>
        {index + 1 < questions.length ? (
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="bg-brand min-h-12 flex-1 rounded-xl font-semibold text-white press"
          >
            Tiếp →
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            className="min-h-12 flex-1 rounded-xl bg-emerald-600 font-semibold text-white press"
          >
            Nộp bài
          </button>
        )}
      </div>
    </div>
  );
}
