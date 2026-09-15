"use client";

import Link from "next/link";
import { useState } from "react";
import { Celebration } from "@/app/_components/celebration";
import { Mascot } from "@/app/_components/mascot";
import { DeckCard } from "@/app/(app)/hoc/deck-card";
import type { DeckSummary } from "@/lib/decks";
import {
  GOALS,
  LEVEL_LABEL,
  LEVELS,
  type PlacementGoal,
  type PlacementQuestion,
  type PlacementResult,
  recommendDecks,
  summarize,
  verdictFor,
} from "@/lib/placement";
import { savePlacement } from "./actions";

type Phase = "intro" | "testing" | "result";

type Props = { questions: PlacementQuestion[]; decks: DeckSummary[] };

/**
 * Bài kiểm tra: chọn mục tiêu → 20 câu không báo đúng sai từng câu (để đo
 * thật) → kết quả, mức nên học và 3 bộ gợi ý. Không cộng XP.
 */
export function PlacementSession({ questions, decks }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [goal, setGoal] = useState<PlacementGoal>("chua-ro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  function start(chosen: PlacementGoal) {
    setGoal(chosen);
    setIndex(0);
    setAnswers(questions.map(() => null));
    setResult(null);
    setPhase("testing");
  }

  function answer(optionIndex: number) {
    const next = [...answers];
    next[index] = optionIndex;
    setAnswers(next);

    if (index + 1 < questions.length) {
      setIndex(index + 1);
      return;
    }
    const summary = summarize(questions, next, goal);
    setResult(summary);
    setPhase("result");
    savePlacement(summary).then((saved) => {
      if (!saved.ok) setSaveError(saved.error);
    });
  }

  if (phase === "intro") {
    return (
      <div className="stagger space-y-4 px-5 pt-2">
        <div className="border-border bg-card flex items-center gap-4 rounded-2xl border p-4">
          <Mascot variant="hoc" size={80} className="shrink-0 rounded-2xl" />
          <p className="text-sm leading-relaxed">
            {questions.length} câu chọn nghĩa, từ dễ tới khó. Không biết thì cứ chọn đại — bài này
            để <span className="font-semibold">đo</span>, không tính điểm hay XP.
          </p>
        </div>
        <p className="text-muted px-1 text-sm font-medium">Bạn học tiếng Anh để làm gì?</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {GOALS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => start(option.key)}
              className="border-border bg-card hover:border-brand/60 rounded-2xl border p-4 text-left transition-colors press"
            >
              <span className="block font-semibold">{option.label}</span>
              <span className="text-muted mt-0.5 block text-sm">{option.hint}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    const verdict = verdictFor(result.level, result.score, result.total);
    const suggested = recommendDecks(decks, result.level, result.goal);
    return (
      <div className="stagger space-y-5 px-5 pt-2 pb-4">
        <Celebration />
        <div className="border-border bg-card rounded-2xl border p-6 text-center">
          <Mascot variant={result.level === "beginner" ? "hoc" : "an-mung"} size={104} className="mx-auto" />
          <p className="text-muted mt-3 text-sm">
            Đúng {result.score}/{result.total} · mức nên học:
          </p>
          <p className="text-brand mt-1 text-2xl font-extrabold">{LEVEL_LABEL[result.level]}</p>
          <p className="mt-2 font-semibold">{verdict.title}</p>
          <p className="text-muted mt-1 text-sm leading-relaxed">{verdict.text}</p>

          <ul className="mt-5 space-y-2 text-left text-sm">
            {LEVELS.map((level) => {
              const { correct, total } = result.byLevel[level];
              const percent = total ? Math.round((correct / total) * 100) : 0;
              return (
                <li key={level} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 font-medium">{LEVEL_LABEL[level]}</span>
                  <span className="bg-brand-soft h-2 flex-1 overflow-hidden rounded-full">
                    <span
                      className={`block h-full rounded-full ${percent >= 70 ? "bg-emerald-500" : "bg-brand"}`}
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="text-muted w-10 shrink-0 text-right tabular-nums">
                    {correct}/{total}
                  </span>
                </li>
              );
            })}
          </ul>
          {saveError ? (
            <p role="alert" className="mt-3 text-xs text-red-500">
              Không lưu được kết quả: {saveError}
            </p>
          ) : null}
        </div>

        {suggested.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-muted px-1 text-sm font-medium">Bộ nên bắt đầu</h2>
            <div className="grid gap-4">
              {suggested.map((deck) => (
                <DeckCard key={deck.id} deck={deck} />
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPhase("intro")}
            className="border-border text-muted min-h-12 rounded-xl border font-medium press"
          >
            Làm lại
          </button>
          <Link
            href="/hoc"
            className="bg-brand flex min-h-12 items-center justify-center rounded-xl font-semibold text-white press"
          >
            Tới trang Học
          </Link>
        </div>
      </div>
    );
  }

  const question = questions[index];
  const percent = Math.round((index / questions.length) * 100);

  return (
    <div className="px-5 pt-2 pb-4">
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuenow={index}
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-label="Tiến độ bài kiểm tra"
          className="bg-brand-soft h-2 flex-1 overflow-hidden rounded-full"
        >
          <div className="bg-brand h-full rounded-full transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-muted shrink-0 text-sm tabular-nums">
          {index + 1}/{questions.length}
        </span>
      </div>

      <div key={question.wordId} className="step-enter mt-4">
        <div className="border-border bg-card rounded-3xl border p-6 text-center">
          <p className="text-muted text-xs font-semibold tracking-wide uppercase">
            {LEVEL_LABEL[question.level]}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{question.term}</p>
          {question.phonetic ? <p className="ipa text-muted mt-1">{question.phonetic}</p> : null}
          <p className="text-muted mt-3 text-sm">Nghĩa của từ này là gì?</p>
        </div>

        <div className="mt-4 grid gap-3">
          {question.options.map((option, optionIndex) => (
            <button
              key={option}
              type="button"
              onClick={() => answer(optionIndex)}
              className="border-border bg-card hover:border-brand/50 flex min-h-14 items-center gap-3 rounded-2xl border px-4 text-left font-medium transition-colors press"
            >
              <span className="bg-brand-soft text-muted flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
                {optionIndex + 1}
              </span>
              <span className="flex-1">{option}</span>
            </button>
          ))}
        </div>
        <p className="text-muted mt-3 text-center text-xs">Không chắc thì chọn đại — không bị trừ gì cả.</p>
      </div>
    </div>
  );
}
