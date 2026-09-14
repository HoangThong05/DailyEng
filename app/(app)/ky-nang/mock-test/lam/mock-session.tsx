"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { submitMockTest } from "@/app/_actions/mock-test";
import { Celebration } from "@/app/_components/celebration";
import { CountUp } from "@/app/_components/count-up";
import { Mascot, resultMascot } from "@/app/_components/mascot";
import type { MockQuestion } from "@/lib/mock-test";

const LETTERS = ["A", "B", "C", "D"];

type Props = { questions: MockQuestion[]; token: string; seconds: number };

function formatClock(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Phần trước/sau chỗ trống, để vẽ ô trống nổi bật trong câu. */
function Blank({ sentence, filled }: { sentence: string; filled?: string }) {
  const [before, after] = sentence.split("____");
  return (
    <p className="text-lg leading-relaxed">
      {before}
      <span
        className={`mx-1 inline-block min-w-20 rounded-md border-b-2 px-2 text-center font-semibold ${
          filled ? "border-brand text-brand" : "border-border text-muted"
        }`}
      >
        {filled ?? " "}
      </span>
      {after}
    </p>
  );
}

export function MockSession({ questions, token, seconds }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    questions.map(() => null),
  );
  const [left, setLeft] = useState(seconds);
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Đồng hồ đếm ngược; hết giờ thì tự nộp.
  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setLeft((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  useEffect(() => {
    if (left === 0 && !submitted) submit();
    // submit đọc state hiện tại; chỉ cần chạy khi đồng hồ về 0.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  const score = questions.filter((q, i) => answers[i] === q.answer).length;
  const answered = answers.filter((a) => a !== null).length;

  function choose(optionIndex: number) {
    if (submitted) return;
    setAnswers((previous) => {
      const next = [...previous];
      next[index] = optionIndex;
      return next;
    });
  }

  function submit() {
    if (submitted) return;
    setSubmitted(true);

    // Server kiểm đề đã ký, tự chấm và lưu; màn kết quả hiện điểm tính tại chỗ
    // (giống hệt vì cùng đáp án), lỗi lưu thì báo.
    void submitMockTest(token, answers, seconds - left).then((result) => {
      if (!result.ok) setSaveError(result.error);
    });
  }

  /* ---------- Kết quả ---------- */

  if (submitted) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <div className="space-y-5 px-5 pt-2 pb-4">
        <Celebration />
        <div className="border-border bg-card rounded-2xl border p-6 text-center">
          <Mascot
            variant={resultMascot(score, questions.length)}
            size={112}
            className="mx-auto"
          />
          <p className="text-muted mt-2 text-sm">Kết quả</p>
          <p className="mt-1 text-5xl font-bold tabular-nums">
            <CountUp value={score} />/{questions.length}
          </p>
          <p className="text-muted mt-2 text-sm">
            <CountUp value={percent} suffix="%" /> đúng · làm trong{" "}
            {formatClock(seconds - left)}
          </p>
          <p className="text-muted mt-1 text-sm">
            {percent >= 85
              ? "Rất tốt — ngang mức 800+ ở Part 5."
              : percent >= 65
                ? "Khá ổn, xem lại các câu sai bên dưới."
                : "Ôn thêm các bộ TOEIC rồi thử lại nhé."}
          </p>
          {saveError ? (
            <p role="alert" className="mt-3 text-sm text-red-500">
              Không lưu được kết quả: {saveError}
            </p>
          ) : null}
        </div>

        <ol className="space-y-3">
          {questions.map((question, i) => {
            const mine = answers[i];
            const correct = mine === question.answer;
            return (
              <li
                key={question.id}
                className={`rounded-2xl border p-4 ${
                  correct
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-red-500/40 bg-red-500/5"
                }`}
              >
                <p className="text-muted mb-1 text-xs font-semibold">
                  Câu {i + 1} · {question.tag === "grammar" ? "Ngữ pháp" : "Từ vựng"}
                </p>
                <Blank sentence={question.sentence} filled={question.options[question.answer]} />
                <p className="mt-2 text-sm">
                  {correct ? (
                    <span className="font-semibold text-emerald-600">Đúng</span>
                  ) : (
                    <>
                      <span className="font-semibold text-red-500">
                        {mine === null ? "Bỏ trống" : `Bạn chọn: ${question.options[mine]}`}
                      </span>
                      {" · "}Đáp án:{" "}
                      <span className="font-semibold">
                        {LETTERS[question.answer]}. {question.options[question.answer]}
                      </span>
                    </>
                  )}
                </p>
                <p className="text-muted mt-1 text-sm">{question.explain}</p>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col gap-3">
          <Link
            href="/ky-nang/mock-test/lam"
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

  const question = questions[index];
  const chosen = answers[index];
  const urgent = left <= 60;

  return (
    <div className="px-5 pt-2 pb-4">
      <div className="flex items-center justify-between">
        <span className="text-muted text-sm tabular-nums">
          Câu {index + 1}/{questions.length} · đã làm {answered}
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

      <div key={index} className="step-enter border-border bg-card mt-4 rounded-3xl border p-6">
        <p className="text-muted mb-3 text-xs font-semibold tracking-wide uppercase">
          {question.tag === "grammar" ? "Ngữ pháp" : "Từ vựng"}
        </p>
        <Blank
          sentence={question.sentence}
          filled={chosen === null ? undefined : question.options[chosen]}
        />
      </div>

      <div className="mt-4 grid gap-3">
        {question.options.map((option, optionIndex) => {
          const active = chosen === optionIndex;
          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(optionIndex)}
              aria-pressed={active}
              className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 text-left font-medium press ${
                active
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-border bg-card"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  active ? "bg-brand text-white" : "bg-brand-soft text-muted"
                }`}
              >
                {LETTERS[optionIndex]}
              </span>
              {option}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="border-border min-h-12 flex-1 rounded-xl border font-semibold press disabled:opacity-40"
        >
          ← Trước
        </button>
        {index + 1 < questions.length ? (
          <button
            type="button"
            onClick={() => setIndex((i) => i + 1)}
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

      {/* Lưới câu: nhảy nhanh, thấy câu nào chưa làm */}
      <ol className="mt-5 grid grid-cols-10 gap-1.5" aria-label="Danh sách câu">
        {questions.map((q, i) => (
          <li key={q.id}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-current={i === index ? "true" : undefined}
              aria-label={`Câu ${i + 1}${answers[i] === null ? ", chưa làm" : ""}`}
              className={`h-8 w-full rounded-md text-xs font-bold tabular-nums transition-colors ${
                i === index
                  ? "bg-brand text-white"
                  : answers[i] !== null
                    ? "bg-brand-soft text-brand"
                    : "border-border text-muted border"
              }`}
            >
              {i + 1}
            </button>
          </li>
        ))}
      </ol>

      {index + 1 < questions.length && answered === questions.length ? (
        <button
          type="button"
          onClick={submit}
          className="mt-4 min-h-12 w-full rounded-xl bg-emerald-600 font-semibold text-white press"
        >
          Đã làm hết — Nộp bài
        </button>
      ) : null}
    </div>
  );
}
