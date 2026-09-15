"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { recordReview } from "@/app/_actions/study";
import { Celebration } from "@/app/_components/celebration";
import { CountUp } from "@/app/_components/count-up";
import { SpeakerIcon } from "@/app/_components/icons";
import { Mascot, resultMascot } from "@/app/_components/mascot";
import { isCorrectAnswer } from "@/lib/dictation-game";
import {
  playCombo,
  playCorrect,
  playMiss,
  readSoundPreference,
  unlockAudio,
} from "@/lib/game-audio";
import { speak } from "@/lib/speech";
import {
  buildChoose,
  buildType,
  hintFor,
  MAX_RETRIES,
  MAX_TYPE_ATTEMPTS,
  splitSentence,
  type PathWord,
  type Pool,
  type Stage,
  type Step,
} from "@/lib/study-path";
import { xpForAnswers } from "@/lib/xp";

type Props = {
  deckName: string;
  stages: Stage[];
  pool: Pool;
};

type Phase = "intro" | "playing" | "finished";
/** Trạng thái của bước hiện tại: đang trả lời / vừa đúng / vừa sai. */
type Feedback = "none" | "correct" | "wrong";

type WordResult = {
  /** Đã ghi Leitner chưa (chỉ ghi ở bước gõ đầu tiên). */
  reviewed: boolean;
  remembered: boolean;
  retries: number;
};

const OPTION_KEYS = ["1", "2", "3", "4"];
/** Đúng thì tự qua bước sau ngần này ms; sai thì chờ bấm. */
const AUTO_NEXT_MS = 900;

function Highlighted({ sentence, term }: { sentence: string; term: string }) {
  const { before, hit, after } = splitSentence(sentence, term);
  return (
    <>
      {before}
      {hit ? (
        <mark className="bg-brand/15 text-brand rounded px-1 font-semibold">
          {hit}
        </mark>
      ) : null}
      {after}
    </>
  );
}

function SpeakButton({
  text,
  size = "sm",
  className = "",
}: {
  text: string;
  size?: "sm" | "lg";
  className?: string;
}) {
  const box = size === "lg" ? "h-20 w-20" : "h-10 w-10";
  const icon = size === "lg" ? "h-9 w-9" : "h-5 w-5";
  return (
    <button
      type="button"
      aria-label="Nghe phát âm"
      onClick={() => speak(text)}
      className={`bg-brand-soft text-brand flex items-center justify-center rounded-full press ${box} ${className}`}
    >
      <SpeakerIcon className={icon} />
    </button>
  );
}

/**
 * Câu ví dụ: từ được tô sáng, bản dịch, hai nút nghe (thường / chậm).
 * Nghe cả câu giúp nhớ từ trong ngữ cảnh và quen ngữ điệu, không chỉ từ lẻ.
 */
function ExampleCard({
  word,
  className = "",
  onListen,
}: {
  word: PathWord;
  className?: string;
  /** Gọi khi bấm nghe, để phiên học dừng tự chuyển bước. */
  onListen?: () => void;
}) {
  if (!word.example_en) return null;
  const sentence = word.example_en;
  const listen = (rate: number) => {
    onListen?.();
    speak(sentence, "en-US", rate);
  };
  return (
    <div className={`bg-brand-soft/60 rounded-2xl p-4 text-left ${className}`}>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed">
            <Highlighted sentence={sentence} term={word.term} />
          </p>
          {word.example_vi ? (
            <p className="text-muted mt-1 text-sm">{word.example_vi}</p>
          ) : null}
        </div>
        {/* Hai nút nghe nằm ngang, căn giữa theo chiều cao khối câu */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label="Nghe cả câu"
            title="Nghe cả câu"
            onClick={() => listen(0.95)}
            className="bg-card text-brand border-border flex h-9 w-9 items-center justify-center rounded-full border press"
          >
            <SpeakerIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Nghe chậm"
            title="Nghe chậm"
            onClick={() => listen(0.65)}
            className="bg-card text-muted border-border flex h-9 w-9 items-center justify-center rounded-full border text-sm press"
          >
            🐢
          </button>
        </div>
      </div>
    </div>
  );
}

export function PathSession({ deckName, stages, pool }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [stageIndex, setStageIndex] = useState(0);
  // Các bước của chặng hiện tại; bước làm lại được nối thêm vào cuối.
  const [steps, setSteps] = useState<Step[]>(stages[0]?.steps ?? []);
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>("none");
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [results, setResults] = useState<Map<string, WordResult>>(new Map());
  const [failedInStage, setFailedInStage] = useState<Set<string>>(new Set());
  const [failedSaves, setFailedSaves] = useState(0);
  // Âm hiệu đúng/sai theo cài đặt chung của các trò chơi (tắt/bật ở trò chơi).
  const [sound, setSound] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Hẹn giờ tự qua bước khi đúng; bấm nghe câu thì huỷ để nghe cho hết. */
  const autoTimer = useRef<number | null>(null);
  const [held, setHeld] = useState(false);

  function scheduleAdvance(ms: number) {
    autoTimer.current = window.setTimeout(advance, ms);
  }

  function holdForListening() {
    if (autoTimer.current !== null) {
      clearTimeout(autoTimer.current);
      autoTimer.current = null;
    }
    setHeld(true);
  }

  const step = steps[stepIndex];
  const totalWords = stages.reduce((sum, stage) => sum + stage.words.length, 0);

  // Sang bước mới: đọc từ cho bước gặp/nghe, đưa con trỏ vào ô gõ.
  useEffect(() => {
    if (phase !== "playing" || !step) return;
    if (step.kind === "meet" || (step.kind === "choose" && step.prompt === "audio")) {
      speak(step.word.term);
    }
    if (step.kind === "type") inputRef.current?.focus();
  }, [phase, step]);

  function play(fn: () => void) {
    if (sound) fn();
  }

  function start() {
    unlockAudio();
    setSound(readSoundPreference());
    setPhase("playing");
  }

  function bumpCombo() {
    const next = combo + 1;
    setCombo(next);
    setBestCombo((best) => Math.max(best, next));
    play(() => (next >= 3 ? playCombo(next) : playCorrect()));
  }

  function breakCombo() {
    setCombo(0);
    play(playMiss);
  }

  /** Ghi Leitner một lần cho mỗi từ, ở bước gõ đầu tiên. */
  function commit(word: PathWord, remembered: boolean) {
    const current = results.get(word.id);
    if (current?.reviewed) return;

    setResults((previous) => {
      const next = new Map(previous);
      next.set(word.id, {
        reviewed: true,
        remembered,
        retries: current?.retries ?? 0,
      });
      return next;
    });

    recordReview(word.id, remembered)
      .then((result) => {
        if (!result.ok) setFailedSaves((count) => count + 1);
      })
      .catch(() => setFailedSaves((count) => count + 1));
  }

  function markFailed(word: PathWord) {
    setFailedInStage((previous) => new Set(previous).add(word.id));
  }

  function advance() {
    autoTimer.current = null;
    setHeld(false);
    setFeedback("none");
    setPicked(null);
    setTyped("");
    setAttempts(0);

    if (stepIndex + 1 < steps.length) {
      setStepIndex(stepIndex + 1);
      return;
    }

    // Hết chặng: từ sai được làm lại (trắc nghiệm + gõ) ngay trong chặng này.
    const retry = stages[stageIndex].words.filter((word) => {
      if (!failedInStage.has(word.id)) return false;
      return (results.get(word.id)?.retries ?? 0) < MAX_RETRIES;
    });

    if (retry.length > 0) {
      const extra: Step[] = [];
      for (const word of retry) {
        const choose = buildChoose(word, "term", pool);
        if (choose) extra.push(choose);
      }
      for (const word of retry) extra.push(buildType(word));

      setResults((previous) => {
        const next = new Map(previous);
        for (const word of retry) {
          const current = next.get(word.id) ?? {
            reviewed: false,
            remembered: false,
            retries: 0,
          };
          next.set(word.id, { ...current, retries: current.retries + 1 });
        }
        return next;
      });
      setFailedInStage(new Set());
      setSteps([...steps, ...extra]);
      setStepIndex(stepIndex + 1);
      return;
    }

    if (stageIndex + 1 < stages.length) {
      setStageIndex(stageIndex + 1);
      setSteps(stages[stageIndex + 1].steps);
      setStepIndex(0);
      setFailedInStage(new Set());
      return;
    }

    setPhase("finished");
  }

  function pick(optionIndex: number) {
    if (!step || step.kind !== "choose" || feedback !== "none") return;
    setPicked(optionIndex);
    const correct = optionIndex === step.correctIndex;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) {
      bumpCombo();
      // Có câu ví dụ thì nán thêm chút để kịp liếc từ trong câu.
      scheduleAdvance(step.word.example_en ? AUTO_NEXT_MS + 600 : AUTO_NEXT_MS);
    } else {
      breakCombo();
      markFailed(step.word);
    }
  }

  function check() {
    if (!step || step.kind !== "type" || feedback !== "none") return;
    if (!typed.trim()) return;

    if (isCorrectAnswer(typed, step.word.term)) {
      setFeedback("correct");
      bumpCombo();
      speak(step.word.term);
      commit(step.word, attempts === 0);
      scheduleAdvance(AUTO_NEXT_MS + 300);
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    breakCombo();
    markFailed(step.word);
    setTyped("");

    if (nextAttempts >= MAX_TYPE_ATTEMPTS) {
      setFeedback("wrong");
      commit(step.word, false);
    } else {
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!step) return;
    if (event.key === "Enter" || event.key === " ") {
      if (step.kind === "meet") {
        event.preventDefault();
        advance();
      } else if (feedback === "wrong") {
        event.preventDefault();
        advance();
      }
      return;
    }
    if (step.kind === "choose" && feedback === "none") {
      const optionIndex = OPTION_KEYS.indexOf(event.key);
      if (optionIndex >= 0 && optionIndex < step.options.length) pick(optionIndex);
    }
  }

  /* ---------- Màn giới thiệu ---------- */

  if (phase === "intro") {
    const newCount = stages
      .flatMap((stage) => stage.words)
      .filter((word) => word.box <= 1).length;
    return (
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <Mascot variant="hoc" size={128} priority className="rounded-3xl" />
        <h2 className="mt-4 text-xl font-bold">
          {stages.length} chặng · {totalWords} từ
        </h2>
        <p className="text-muted mt-2 text-sm">
          {newCount > 0
            ? `${newCount} từ mới sẽ đi qua gặp từ → trắc nghiệm → gõ lại.`
            : "Toàn từ đã quen, vào thẳng phần gõ lại cho nhanh."}
        </p>
        <ul className="text-muted mt-6 w-full max-w-xs space-y-2 text-left text-sm">
          <li className="border-border bg-card flex items-center gap-3 rounded-xl border px-4 py-3">
            <span className="bg-brand-soft text-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold">1</span>
            Gặp từ: nghe, đọc nghĩa và câu ví dụ
          </li>
          <li className="border-border bg-card flex items-center gap-3 rounded-xl border px-4 py-3">
            <span className="bg-brand-soft text-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold">2</span>
            Nhận diện: chọn đáp án, giữ combo
          </li>
          <li className="border-border bg-card flex items-center gap-3 rounded-xl border px-4 py-3">
            <span className="bg-brand-soft text-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold">3</span>
            Gõ lại: điền từ vào câu — bước quyết định
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

  /* ---------- Màn kết quả ---------- */

  if (phase === "finished" || !step) {
    const all = stages.flatMap((stage) => stage.words);
    const remembered = all.filter((word) => results.get(word.id)?.remembered);
    const forgot = all.filter((word) => !results.get(word.id)?.remembered);

    return (
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <Celebration />
        <Mascot variant={resultMascot(remembered.length, all.length)} size={128} />
        <h2 className="mt-3 text-xl font-bold">Xong phiên học</h2>
        <p className="text-brand mt-2 text-sm font-semibold tabular-nums">
          <CountUp
            prefix="+"
            value={xpForAnswers(remembered.length, forgot.length)}
            suffix=" XP"
          />
        </p>
        <div className="mt-5 grid w-full max-w-xs grid-cols-2 gap-3">
          <div className="border-border bg-card rounded-2xl border p-3">
            <p className="text-2xl font-bold tabular-nums">
              <CountUp value={remembered.length} />/{all.length}
            </p>
            <p className="text-muted text-xs">từ đã thuộc</p>
          </div>
          <div className="border-border bg-card rounded-2xl border p-3">
            <p className="text-2xl font-bold tabular-nums">
              ×<CountUp value={bestCombo} />
            </p>
            <p className="text-muted text-xs">combo cao nhất</p>
          </div>
        </div>

        {forgot.length > 0 ? (
          <div className="border-border bg-card mt-5 w-full max-w-xs rounded-2xl border p-4 text-left">
            <p className="mb-2 text-sm font-semibold">Sẽ gặp lại sớm</p>
            <ul className="space-y-1.5 text-sm">
              {forgot.map((word) => (
                <li key={word.id} className="flex justify-between gap-3">
                  <span className="font-medium">{word.term}</span>
                  <span className="text-muted truncate">{word.meaning_vi}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {failedSaves > 0 ? (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500"
          >
            {failedSaves} lượt chưa lưu được lên máy chủ, có thể do mất mạng.
          </p>
        ) : null}

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/hoc"
            className="bg-brand flex min-h-12 items-center justify-center rounded-xl font-semibold text-white press"
          >
            Chọn bộ khác
          </Link>
          <Link
            href="/"
            className="border-border text-muted flex min-h-12 items-center justify-center rounded-xl border font-medium press"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- Đang học ---------- */

  const stageProgress = Math.round((stepIndex / steps.length) * 100);
  const word = step.word;

  return (
    <div
      className="px-5 pt-2"
      onKeyDown={handleKeyDown}
      role="group"
      aria-label={`Học theo chặng, bộ ${deckName}`}
    >
      {/* Bản đồ chặng + tiến độ trong chặng */}
      <div className="flex items-center gap-3">
        <ol className="flex items-center gap-1.5" aria-label="Các chặng">
          {stages.map((stage) => {
            const done = stage.index < stageIndex;
            const active = stage.index === stageIndex;
            return (
              <li
                key={stage.index}
                aria-current={active ? "step" : undefined}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  active
                    ? "bg-brand w-6"
                    : done
                      ? "bg-brand/60 w-2.5"
                      : "bg-brand-soft w-2.5"
                }`}
              />
            );
          })}
        </ol>
        <div
          role="progressbar"
          aria-valuenow={stepIndex}
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-label="Tiến độ chặng"
          className="bg-brand-soft h-2 flex-1 overflow-hidden rounded-full"
        >
          <div
            className="bg-brand h-full rounded-full transition-[width] duration-300"
            style={{ width: `${stageProgress}%` }}
          />
        </div>
      </div>

      {/* Nhãn bước + combo */}
      <div className="mt-4 flex min-h-8 items-center justify-between">
        <span className="text-muted text-xs font-semibold tracking-wide uppercase">
          {step.kind === "meet"
            ? "Gặp từ"
            : step.kind === "choose"
              ? step.prompt === "audio"
                ? "Nghe rồi chọn"
                : step.prompt === "term"
                  ? "Chọn nghĩa"
                  : "Chọn từ"
              : step.mode === "blank"
                ? "Điền vào câu"
                : "Gõ lại từ"}
        </span>
        {combo >= 2 ? (
          <span
            key={combo}
            className="combo-pop from-brand rounded-full bg-gradient-to-r to-violet-500 px-3 py-1 text-xs font-bold text-white shadow-md"
          >
            Combo ×{combo}
          </span>
        ) : null}
      </div>

      {/* ---- Bước 1: Gặp từ ---- */}
      {step.kind === "meet" ? (
        <div key={`meet-${word.id}`} className="step-enter mt-3">
          <div className="border-border bg-card rounded-3xl border p-6 text-center">
            {/* Nút loa treo bên phải, không tính vào căn giữa để chữ và phiên âm thẳng hàng */}
            <div className="relative mx-auto w-fit">
              <p className="text-3xl font-bold tracking-tight">{word.term}</p>
              <SpeakButton
                text={word.term}
                className="absolute top-1/2 left-full ml-3 -translate-y-1/2"
              />
            </div>
            {word.phonetic ? (
              <p className="ipa text-muted mt-1 text-lg">{word.phonetic}</p>
            ) : null}
            <p className="mt-5 text-xl font-semibold">{word.meaning_vi}</p>
            <ExampleCard word={word} className="mt-5" />
          </div>
          <button
            type="button"
            onClick={advance}
            className="bg-brand mt-5 min-h-14 w-full rounded-2xl font-semibold text-white press"
          >
            Đã hiểu, tiếp
          </button>
        </div>
      ) : null}

      {/* ---- Bước 2: Trắc nghiệm ---- */}
      {step.kind === "choose" ? (
        <div key={`choose-${stepIndex}`} className="step-enter mt-3">
          <div className="border-border bg-card flex min-h-36 flex-col items-center justify-center rounded-3xl border p-6 text-center">
            {step.prompt === "audio" ? (
              <>
                <SpeakButton text={word.term} size="lg" />
                <p className="text-muted mt-3 text-sm">Nghe và chọn từ đúng</p>
              </>
            ) : step.prompt === "term" ? (
              <>
                <div className="relative mx-auto w-fit">
                  <p className="text-3xl font-bold tracking-tight">{word.term}</p>
                  <SpeakButton
                    text={word.term}
                    className="absolute top-1/2 left-full ml-3 -translate-y-1/2"
                  />
                </div>
                {word.phonetic ? (
                  <p className="ipa text-muted mt-1">{word.phonetic}</p>
                ) : null}
              </>
            ) : (
              <p className="text-2xl font-bold">{word.meaning_vi}</p>
            )}
          </div>

          <div className="mt-4 grid gap-3">
            {step.options.map((option, optionIndex) => {
              const isCorrect = optionIndex === step.correctIndex;
              const isPicked = optionIndex === picked;
              let look = "border-border bg-card hover:border-brand/50";
              if (feedback !== "none") {
                if (isCorrect) look = "border-emerald-500 bg-emerald-500/10 text-emerald-600";
                else if (isPicked) look = "border-red-500 bg-red-500/10 text-red-500 rain-shake";
                else look = "border-border bg-card opacity-50";
              }
              return (
                <button
                  key={option}
                  type="button"
                  disabled={feedback !== "none"}
                  onClick={() => pick(optionIndex)}
                  className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 text-left font-medium transition-colors press ${look}`}
                >
                  <span className="bg-brand-soft text-muted flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
                    {optionIndex + 1}
                  </span>
                  <span className="flex-1">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Trả lời xong (đúng hay sai) đều thấy từ trong câu để nhớ ngữ cảnh */}
          {feedback !== "none" ? (
            <div className="step-enter">
              {step.prompt !== "term" ? (
                <p className="mt-4 text-center">
                  <span className="text-xl font-bold">{word.term}</span>{" "}
                  <span className="ipa text-muted">{word.phonetic ?? ""}</span>
                  <span className="text-muted"> · {word.meaning_vi}</span>
                </p>
              ) : null}
              <ExampleCard word={word} className="mt-3" onListen={holdForListening} />
            </div>
          ) : null}

          {feedback === "wrong" || held ? (
            <button
              type="button"
              onClick={advance}
              className="bg-brand mt-4 min-h-12 w-full rounded-2xl font-semibold text-white press"
            >
              Tiếp
            </button>
          ) : null}
        </div>
      ) : null}

      {/* ---- Bước 3: Gõ lại ---- */}
      {step.kind === "type" ? (
        <div key={`type-${stepIndex}`} className="step-enter mt-3">
          <div className="border-border bg-card rounded-3xl border p-6 text-center">
            {step.mode === "blank" && step.sentence ? (
              <>
                <p className="text-lg leading-relaxed">
                  {step.sentence.split("____").map((part, i, parts) => (
                    <span key={i}>
                      {part}
                      {i < parts.length - 1 ? (
                        <span className="bg-brand/15 text-brand mx-1 inline-block min-w-16 rounded-md px-2 font-bold">
                          {feedback === "correct" || feedback === "wrong"
                            ? word.term
                            : typed || "…"}
                        </span>
                      ) : null}
                    </span>
                  ))}
                </p>
                <p className="text-muted mt-3 text-sm">{word.example_vi ?? word.meaning_vi}</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold">{word.meaning_vi}</p>
                <p className="text-muted mt-2 text-sm">Gõ từ tiếng Anh</p>
              </>
            )}
            {attempts > 0 && feedback === "none" ? (
              <p className="text-brand mt-4 font-mono text-lg tracking-wider">
                {hintFor(word.term)}
              </p>
            ) : null}
            {feedback === "correct" ? (
              <p className="mt-4 font-semibold text-emerald-500">
                Chính xác!{" "}
                <span className="ipa font-normal">{word.phonetic ?? ""}</span>
              </p>
            ) : null}
            {feedback === "wrong" ? (
              <p className="mt-4 text-sm">
                Đáp án: <span className="font-bold">{word.term}</span>{" "}
                <span className="ipa text-muted">{word.phonetic ?? ""}</span>
              </p>
            ) : null}
            {feedback !== "none" ? (
              step.mode === "blank" && word.example_en ? (
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      holdForListening();
                      speak(word.example_en ?? "", "en-US", 0.95);
                    }}
                    className="bg-brand-soft text-brand flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold press"
                  >
                    <SpeakerIcon className="h-4 w-4" /> Nghe cả câu
                  </button>
                  <button
                    type="button"
                    aria-label="Nghe chậm"
                    onClick={() => {
                      holdForListening();
                      speak(word.example_en ?? "", "en-US", 0.65);
                    }}
                    className="bg-brand-soft text-muted flex h-10 w-10 items-center justify-center rounded-full press"
                  >
                    🐢
                  </button>
                </div>
              ) : (
                <ExampleCard word={word} className="step-enter mt-4" onListen={holdForListening} />
              )
            ) : null}
          </div>

          <form
            className="mt-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              // Đúng thì bộ đếm tự chuyển bước; chỉ sai mới cần bấm Tiếp.
              if (feedback === "none") check();
              else if (feedback === "wrong" || held) advance();
            }}
          >
            <input
              ref={inputRef}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              disabled={feedback !== "none"}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              placeholder="Gõ từ…"
              aria-label="Câu trả lời"
              className={`border-border bg-card focus:border-brand min-h-14 flex-1 rounded-2xl border px-4 text-lg outline-none ${
                attempts > 0 && feedback === "none" ? "rain-shake border-red-500/60" : ""
              }`}
            />
            <button
              type="submit"
              className="bg-brand min-h-14 rounded-2xl px-5 font-semibold text-white press"
            >
              {feedback === "none" ? "Kiểm tra" : "Tiếp"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
