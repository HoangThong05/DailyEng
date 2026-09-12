"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { recordReview, refreshStudyViews } from "@/app/_actions/study";
import { SpeakerIcon } from "@/app/_components/icons";
import { Mascot, resultMascot } from "@/app/_components/mascot";
import { useHydrated } from "@/app/_components/use-hydrated";
import { isCorrectAnswer, type DictationWord } from "@/lib/dictation-game";
import { speak } from "@/lib/speech";
import { xpForAnswers } from "@/lib/xp";

type Phase = "intro" | "typing" | "checked" | "finished";

type Result = { word: DictationWord; answer: string; correct: boolean };

function supportsSpeech() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function DictationSession({ words }: { words: DictationWord[] }) {
  const hydrated = useHydrated();
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const word = words[index];
  const current = results[results.length - 1];

  // Sang từ mới thì đọc luôn và đưa con trỏ vào ô gõ. Lượt đầu do nút
  // "Bắt đầu" đọc, vì iOS chỉ cho phát tiếng sau một cú chạm.
  useEffect(() => {
    if (phase !== "typing" || index === 0) return;
    speak(words[index].term);
    inputRef.current?.focus();
  }, [phase, index, words]);

  function start() {
    speak(words[0].term);
    setPhase("typing");
    // Ô nhập chưa mount ở render này; đợi một nhịp rồi focus.
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function check() {
    if (phase !== "typing" || !answer.trim()) return;

    const correct = isCorrectAnswer(answer, word.term);
    setResults((list) => [...list, { word, answer, correct }]);
    setPhase("checked");

    // Không chờ mạng: giao diện phản hồi ngay, kết quả lưu chạy nền.
    void recordReview(word.wordId, correct).catch(() => {});
  }

  function next() {
    if (index + 1 >= words.length) {
      setPhase("finished");
      void refreshStudyViews();
      return;
    }
    setIndex((value) => value + 1);
    setAnswer("");
    setShowHint(false);
    setPhase("typing");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (phase === "typing") check();
    else if (phase === "checked") next();
  }

  if (hydrated && !supportsSpeech()) {
    return (
      <div className="px-5 pt-2">
        <div className="border-border bg-card rounded-2xl border p-6 text-center">
          <p className="font-semibold">Trình duyệt này không đọc được từ</p>
          <p className="text-muted mt-2 text-sm">
            Hãy thử Chrome, Edge hoặc Safari mới hơn.
          </p>
        </div>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="space-y-4 px-5 pt-2">
        <div className="border-border bg-card rounded-2xl border p-6 text-center">
          <Mascot variant="nghe" size={128} className="mx-auto rounded-3xl" />
          <p className="mt-4 font-semibold">Nghe rồi gõ lại từ</p>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Máy sẽ đọc từng từ tiếng Anh. Bạn gõ đúng chính tả rồi bấm Enter.
            Nghe lại bao nhiêu lần cũng được.
          </p>
        </div>
        <button
          type="button"
          onClick={start}
          className="bg-brand min-h-12 w-full rounded-xl text-base font-semibold text-white transition-transform duration-100 active:scale-[0.98]"
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
      <div className="space-y-5 px-5 pt-2">
        <div className="border-border bg-card rounded-2xl border p-6 text-center">
          <Mascot
            variant={resultMascot(correctCount, words.length)}
            size={112}
            className="mx-auto"
          />
          <p className="text-muted mt-2 text-sm">Đúng</p>
          <p className="mt-1 text-5xl font-bold tabular-nums">
            {correctCount}/{words.length}
          </p>
          <p className="text-muted mt-3 text-sm">
            {wrong.length === 0
              ? "Chính tả chuẩn không cần chỉnh!"
              : `${wrong.length} từ gõ chưa đúng, xem lại bên dưới.`}
          </p>
          <p className="text-brand mt-3 text-sm font-semibold tabular-nums">
            +{xpForAnswers(correctCount, wrong.length)} XP
          </p>
        </div>

        {wrong.length > 0 ? (
          <div className="border-border bg-card rounded-2xl border p-4">
            <p className="mb-2 text-sm font-semibold">Từ gõ sai</p>
            <ul className="space-y-2">
              {wrong.map((r) => (
                <li key={r.word.wordId} className="text-sm">
                  <span className="font-medium">{r.word.term}</span>
                  <span className="text-muted"> · {r.word.meaning}</span>
                  <span className="block text-red-500 line-through">
                    {r.answer}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Link
          href="/tro-choi/nghe-go"
          className="bg-brand flex min-h-12 items-center justify-center rounded-xl text-base font-semibold text-white transition-transform duration-100 active:scale-[0.98]"
        >
          Chơi bộ khác
        </Link>
        <Link
          href="/tro-choi"
          className="border-border text-muted flex min-h-12 items-center justify-center rounded-xl border font-medium transition-transform duration-100 active:scale-[0.98]"
        >
          Về trò chơi
        </Link>
      </div>
    );
  }

  const checked = phase === "checked";

  return (
    <div className="space-y-4 px-5 pt-2">
      <p className="text-muted px-1 text-sm tabular-nums">
        Từ {index + 1}/{words.length}
      </p>

      <div className="border-border bg-card rounded-2xl border p-6 text-center">
        <button
          type="button"
          onClick={() => speak(word.term)}
          aria-label="Nghe lại"
          className="bg-brand mx-auto flex h-20 w-20 items-center justify-center rounded-full text-white transition-transform duration-100 active:scale-90"
        >
          <SpeakerIcon className="h-9 w-9" />
        </button>
        <p className="text-muted mt-3 text-sm">Chạm để nghe lại</p>

        {checked ? (
          <div className="mt-5">
            <p
              className={`text-2xl font-bold ${
                current?.correct ? "text-green-600" : "text-red-500"
              }`}
            >
              {current?.correct ? "Chính xác!" : word.term}
            </p>
            {word.phonetic ? (
              <p className="text-muted mt-1 text-sm">{word.phonetic}</p>
            ) : null}
            <p className="mt-2 text-sm">{word.meaning}</p>
          </div>
        ) : showHint ? (
          <p className="mt-5 text-sm">
            Gợi ý: <span className="font-medium">{word.meaning}</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setShowHint(true)}
            className="text-brand mt-5 text-sm font-semibold"
          >
            Xem nghĩa gợi ý
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        onKeyDown={handleKeyDown}
        readOnly={checked}
        placeholder="Gõ từ vừa nghe…"
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint={checked ? "next" : "done"}
        aria-label="Từ vừa nghe"
        className={`min-h-14 w-full rounded-xl border px-4 text-center text-xl font-semibold outline-none ${
          checked
            ? current?.correct
              ? "border-green-600 bg-green-600/10"
              : "border-red-500 bg-red-500/10 line-through"
            : "border-border bg-card focus:border-brand"
        }`}
      />

      {checked ? (
        <button
          type="button"
          onClick={next}
          className="bg-brand min-h-12 w-full rounded-xl text-base font-semibold text-white transition-transform duration-100 active:scale-[0.98]"
        >
          {index + 1 >= words.length ? "Xem kết quả" : "Tiếp"}
        </button>
      ) : (
        <button
          type="button"
          onClick={check}
          disabled={!answer.trim()}
          className="bg-brand min-h-12 w-full rounded-xl text-base font-semibold text-white transition-transform duration-100 active:scale-[0.98] disabled:opacity-60"
        >
          Kiểm tra
        </button>
      )}
    </div>
  );
}
