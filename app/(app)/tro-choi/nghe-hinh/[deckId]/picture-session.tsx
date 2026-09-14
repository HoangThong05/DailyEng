"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { recordReview } from "@/app/_actions/study";
import { Celebration } from "@/app/_components/celebration";
import { CountUp } from "@/app/_components/count-up";
import { EmojiImage, WordPicture } from "@/app/_components/emoji-image";
import { SpeakerIcon } from "@/app/_components/icons";
import { Mascot, resultMascot } from "@/app/_components/mascot";
import {
  playCombo,
  playCorrect,
  playMiss,
  readSoundPreference,
  unlockAudio,
} from "@/lib/game-audio";
import type { PictureQuestion } from "@/lib/picture-game";
import { speak } from "@/lib/speech";
import { xpForAnswers } from "@/lib/xp";

type Phase = "intro" | "playing" | "finished";

type Result = { question: PictureQuestion; picked: number; correct: boolean };

/** Đúng thì tự qua câu sau ngần này ms; sai thì chờ bấm để kịp nhìn đáp án. */
const AUTO_NEXT_MS = 1000;

export function PictureSession({ questions }: { questions: PictureQuestion[] }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [sound, setSound] = useState(true);

  const question = questions[index];

  // Sang câu mới thì đọc từ. Câu đầu do nút Bắt đầu đọc (iOS cần một cú chạm).
  useEffect(() => {
    if (phase !== "playing" || index === 0) return;
    speak(questions[index].term);
  }, [phase, index, questions]);

  function start() {
    unlockAudio();
    setSound(readSoundPreference());
    speak(questions[0].term);
    setPhase("playing");
  }

  function next() {
    setPicked(null);
    if (index + 1 >= questions.length) {
      setPhase("finished");
      return;
    }
    setIndex((value) => value + 1);
  }

  function choose(optionIndex: number) {
    if (picked !== null) return;
    const correct = optionIndex === question.correctIndex;
    setPicked(optionIndex);
    setResults((list) => [...list, { question, picked: optionIndex, correct }]);

    if (correct) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setBestCombo((best) => Math.max(best, nextCombo));
      if (sound) (nextCombo >= 3 ? () => playCombo(nextCombo) : playCorrect)();
      setTimeout(next, AUTO_NEXT_MS);
    } else {
      setCombo(0);
      if (sound) playMiss();
    }

    void recordReview(question.wordId, correct).catch(() => {});
  }

  if (phase === "intro") {
    return (
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <Mascot variant="nghe" size={128} priority className="rounded-3xl" />
        <h2 className="mt-4 text-xl font-bold">{questions.length} từ</h2>
        <p className="text-muted mt-2 max-w-xs text-sm">
          Nghe máy đọc một từ, chạm vào hình đúng trong bốn hình. Không có chữ
          — luyện phản xạ nghe hiểu thuần tuý.
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
    const correctCount = results.filter((r) => r.correct).length;
    const wrong = results.filter((r) => !r.correct);
    return (
      <div className="space-y-5 px-5 pt-2 pb-4">
        <Celebration />
        <div className="border-border bg-card rounded-2xl border p-6 text-center">
          <Mascot
            variant={resultMascot(correctCount, results.length)}
            size={112}
            className="mx-auto"
          />
          <p className="text-muted mt-2 text-sm">Đúng</p>
          <p className="mt-1 text-5xl font-bold tabular-nums">
            <CountUp value={correctCount} />/{results.length}
          </p>
          <p className="text-muted mt-3 text-sm">
            Combo cao nhất ×{bestCombo}
          </p>
          <p className="text-brand mt-3 text-sm font-semibold tabular-nums">
            <CountUp
              prefix="+"
              value={xpForAnswers(correctCount, wrong.length)}
              suffix=" XP"
            />
          </p>
        </div>

        {wrong.length > 0 ? (
          <div className="border-border bg-card rounded-2xl border p-4">
            <p className="mb-2 text-sm font-semibold">Nghe nhầm</p>
            <ul className="space-y-2">
              {wrong.map((r) => (
                <li key={r.question.wordId} className="flex items-center gap-3 text-sm">
                  <EmojiImage
                    emoji={r.question.options[r.question.correctIndex].emoji}
                    size={36}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{r.question.term}</span>
                    <span className="text-muted"> · {r.question.meaning}</span>
                  </span>
                  <span className="text-muted flex items-center gap-1 text-sm" aria-label="bạn chọn">
                    ✗ <EmojiImage emoji={r.question.options[r.picked].emoji} size={28} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <Link
            href="/tro-choi/nghe-hinh"
            className="bg-brand flex min-h-12 items-center justify-center rounded-xl font-semibold text-white press"
          >
            Chọn bộ khác
          </Link>
          <Link
            href="/tro-choi"
            className="border-border text-muted flex min-h-12 items-center justify-center rounded-xl border font-medium press"
          >
            Về trò chơi
          </Link>
        </div>
      </div>
    );
  }

  const answered = picked !== null;
  const wrongPick = answered && picked !== question.correctIndex;

  return (
    <div className="px-5 pt-2 pb-4">
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuenow={index}
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-label="Tiến độ"
          className="bg-brand-soft h-2 flex-1 overflow-hidden rounded-full"
        >
          <div
            className="bg-brand h-full rounded-full transition-[width] duration-300"
            style={{ width: `${(index / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-muted text-sm tabular-nums">
          {index + 1}/{questions.length}
        </span>
        {combo >= 2 ? (
          <span
            key={combo}
            className="combo-pop from-brand rounded-full bg-gradient-to-r to-violet-500 px-2.5 py-0.5 text-xs font-bold text-white"
          >
            ×{combo}
          </span>
        ) : null}
      </div>

      <div key={index} className="step-enter mt-5 flex flex-col items-center">
        <button
          type="button"
          onClick={() => speak(question.term)}
          aria-label="Nghe lại"
          className="bg-brand flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg shadow-blue-500/30 press"
        >
          <SpeakerIcon className="h-11 w-11" />
        </button>
        <p className="text-muted mt-3 min-h-6 text-sm">
          {answered ? (
            <>
              <span className="text-fg font-semibold">{question.term}</span>
              {question.phonetic ? (
                <span className="ipa"> {question.phonetic}</span>
              ) : null}{" "}
              · {question.meaning}
            </>
          ) : (
            "Từ nào đây?"
          )}
        </p>

        <div className="mt-5 grid w-full grid-cols-2 gap-3">
          {question.options.map((option, optionIndex) => {
            const isCorrect = optionIndex === question.correctIndex;
            const isPicked = optionIndex === picked;
            let look = "border-border bg-card";
            if (answered) {
              if (isCorrect) look = "border-emerald-500 bg-emerald-500/10";
              else if (isPicked) look = "border-red-500 bg-red-500/10 rain-shake";
              else look = "border-border bg-card opacity-40";
            }
            return (
              <button
                key={`${option.term}-${optionIndex}`}
                type="button"
                disabled={answered}
                onClick={() => choose(optionIndex)}
                aria-label={answered ? option.term : `Hình ${optionIndex + 1}`}
                className={`aspect-[4/3] overflow-hidden rounded-3xl border-2 transition-colors press ${look}`}
              >
                <WordPicture photo={option.photo} emoji={option.emoji} />
              </button>
            );
          })}
        </div>
      </div>

      {wrongPick ? (
        <button
          type="button"
          onClick={next}
          className="bg-brand mt-5 min-h-12 w-full rounded-2xl font-semibold text-white press"
        >
          {index + 1 >= questions.length ? "Xem kết quả" : "Tiếp"}
        </button>
      ) : null}
    </div>
  );
}
