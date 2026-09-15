"use client";

import Link from "next/link";
import { useState } from "react";
import { recordReview } from "@/app/_actions/study";
import { Celebration } from "@/app/_components/celebration";
import { CountUp } from "@/app/_components/count-up";
import { Mascot, resultMascot } from "@/app/_components/mascot";
import { playCorrect, playMiss, readSoundPreference } from "@/lib/game-audio";
import type { QuizQuestion } from "@/lib/quiz";
import { xpForAnswers } from "@/lib/xp";

type Props = {
  deckId: string;
  questions: QuizQuestion[];
};

type WrongAnswer = { term: string; correct: string; picked: string };

export function QuizSession({ deckId, questions }: Props) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrong, setWrong] = useState<WrongAnswer[]>([]);
  const [finished, setFinished] = useState(false);

  const question = questions[index];
  const answered = picked !== null;

  function choose(option: number) {
    if (answered) return;

    const isCorrect = option === question.correctIndex;
    setPicked(option);
    if (readSoundPreference()) (isCorrect ? playCorrect : playMiss)();

    if (isCorrect) {
      setCorrectCount((count) => count + 1);
    } else {
      setWrong((list) => [
        ...list,
        {
          term: question.term,
          correct: question.options[question.correctIndex],
          picked: question.options[option],
        },
      ]);
    }

    // Trả lời quiz cũng là một lần nhớ lại, nên đẩy luôn vào hệ Leitner.
    // Không chờ mạng: giao diện phản hồi ngay.
    void recordReview(question.wordId, isCorrect, "game").catch(() => {});
  }

  function next() {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setPicked(null);
  }

  if (finished) {
    const percent = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="px-5 py-10">
        <Celebration />
        <div className="flex flex-col items-center text-center">
          <Mascot
            variant={resultMascot(correctCount, questions.length)}
            size={128}
          />
          <span className="bg-brand-soft text-brand mt-2 flex h-14 w-20 items-center justify-center rounded-2xl text-2xl font-bold tabular-nums">
            <CountUp value={percent} suffix="%" />
          </span>
          <h2 className="mt-5 text-xl font-bold">
            Đúng {correctCount}/{questions.length} câu
          </h2>
          <p className="text-muted mt-2 text-sm">
            {percent === 100
              ? "Trọn vẹn, không sai câu nào."
              : "Những từ sai sẽ sớm quay lại để bạn ôn thêm."}
          </p>
          <p className="text-brand mt-3 text-sm font-semibold tabular-nums">
            <CountUp
              prefix="+"
              value={xpForAnswers(correctCount, questions.length - correctCount)}
              suffix=" XP"
            />
          </p>
        </div>

        {wrong.length > 0 ? (
          <section aria-labelledby="tu-sai" className="mt-8 space-y-3">
            <h3 id="tu-sai" className="text-muted px-1 text-sm font-medium">
              Cần xem lại
            </h3>
            {wrong.map((item) => (
              <div
                key={item.term}
                className="border-border bg-card rounded-2xl border p-4"
              >
                <p className="font-semibold">{item.term}</p>
                <p className="mt-1 text-sm text-emerald-500">{item.correct}</p>
                <p className="text-muted mt-0.5 text-sm line-through">
                  {item.picked}
                </p>
              </div>
            ))}
          </section>
        ) : null}

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/quiz/${deckId}`}
            className="bg-brand flex min-h-12 items-center justify-center rounded-xl font-semibold text-white press"
          >
            Làm lại
          </Link>
          <Link
            href="/quiz"
            className="border-border text-muted flex min-h-12 items-center justify-center rounded-xl border font-medium press"
          >
            Chọn bộ khác
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-2">
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={questions.length}
          aria-label="Tiến độ quiz"
          className="bg-brand-soft h-2 flex-1 overflow-hidden rounded-full"
        >
          <div
            className="bg-brand h-full rounded-full transition-[width] duration-300"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-muted text-sm tabular-nums">
          {index + 1}/{questions.length}
        </span>
      </div>

      <div className="border-border bg-card mt-5 rounded-3xl border p-6 text-center">
        <p className="text-muted text-xs">Từ này nghĩa là gì?</p>
        <p className="mt-2 text-3xl font-bold tracking-tight">
          {question.term}
        </p>
        {question.phonetic ? (
          <p className="ipa text-muted mt-1 text-lg">{question.phonetic}</p>
        ) : null}
      </div>

      <div className="mt-5 space-y-3">
        {question.options.map((option, optionIndex) => {
          const isCorrect = optionIndex === question.correctIndex;
          const isPicked = optionIndex === picked;

          let tone = "border-border bg-card";
          if (answered && isCorrect) {
            tone = "border-emerald-500 bg-emerald-500/10 text-emerald-600";
          } else if (answered && isPicked) {
            tone = "border-red-500 bg-red-500/10 text-red-500";
          } else if (answered) {
            tone = "border-border bg-card opacity-50";
          }

          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(optionIndex)}
              disabled={answered}
              className={`min-h-14 w-full rounded-2xl border px-4 text-left font-medium transition-colors duration-150 active:scale-[0.98] disabled:active:scale-100 ${tone}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {answered ? (
        <button
          type="button"
          onClick={next}
          className="bg-brand mt-5 min-h-12 w-full rounded-xl font-semibold text-white press"
        >
          {index + 1 >= questions.length ? "Xem kết quả" : "Câu tiếp theo"}
        </button>
      ) : null}
    </div>
  );
}