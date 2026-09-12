"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { recordReview, refreshStudyViews } from "@/app/_actions/study";
import { CloudRainIcon } from "@/app/_components/icons";
import {
  fallDuration,
  isCorrectAnswer,
  RAIN_LIVES,
  spawnDelay,
  type GameWord,
} from "@/lib/dictation-game";
import { xpForAnswers } from "@/lib/xp";

type Phase = "intro" | "playing" | "finished";

type Drop = {
  id: string;
  word: GameWord;
  duration: number;
};

export function RainSession({ words }: { words: GameWord[] }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [drops, setDrops] = useState<Drop[]>([]);
  const [spawned, setSpawned] = useState(0);
  const [hits, setHits] = useState<GameWord[]>([]);
  const [misses, setMisses] = useState<GameWord[]>([]);
  const [lives, setLives] = useState(RAIN_LIVES);
  const [input, setInput] = useState("");
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Thả giọt kế tiếp sau một khoảng nghỉ ngắn dần. Mỗi lần `spawned` đổi,
  // effect chạy lại và hẹn giọt sau.
  useEffect(() => {
    if (phase !== "playing" || spawned >= words.length) return;

    const delay = spawned === 0 ? 400 : spawnDelay(spawned);
    const timer = setTimeout(() => {
      const word = words[spawned];
      setDrops((list) => [
        ...list,
        { id: `${word.wordId}-${spawned}`, word, duration: fallDuration(spawned) },
      ]);
      setSpawned(spawned + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [phase, spawned, words]);

  // Nháy màu viền ô gõ khi bắn trúng / để rơi.
  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 350);
    return () => clearTimeout(timer);
  }, [flash]);

  function finish() {
    setPhase("finished");
    void refreshStudyViews();
  }

  function start() {
    setPhase("playing");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function replay() {
    setDrops([]);
    setSpawned(0);
    setHits([]);
    setMisses([]);
    setLives(RAIN_LIVES);
    setInput("");
    setPhase("playing");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  /** Ván xong khi mọi từ đã rơi và không còn giọt nào trên màn. */
  function maybeFinish(remaining: Drop[]) {
    if (remaining.length === 0 && spawned >= words.length) finish();
  }

  function handleInput(value: string) {
    setInput(value);
    if (phase !== "playing") return;

    // Khớp giọt nào là bắn ngay, không cần Enter.
    const target = drops.find((drop) => isCorrectAnswer(value, drop.word.term));
    if (!target) return;

    const remaining = drops.filter((drop) => drop.id !== target.id);
    setDrops(remaining);
    setHits((list) => [...list, target.word]);
    setInput("");
    setFlash("hit");
    void recordReview(target.word.wordId, true).catch(() => {});
    maybeFinish(remaining);
  }

  function handleMiss(drop: Drop) {
    if (phase !== "playing") return;

    const remaining = drops.filter((item) => item.id !== drop.id);
    setDrops(remaining);
    setMisses((list) => [...list, drop.word]);
    setFlash("miss");
    void recordReview(drop.word.wordId, false).catch(() => {});

    const left = lives - 1;
    setLives(left);
    if (left <= 0) {
      finish();
      return;
    }
    maybeFinish(remaining);
  }

  if (phase === "intro") {
    return (
      <div className="space-y-4 px-5 pt-2">
        <div className="border-border bg-card rounded-2xl border p-6 text-center">
          <span className="bg-brand-soft text-brand mx-auto flex h-16 w-16 items-center justify-center rounded-2xl">
            <CloudRainIcon className="h-8 w-8" />
          </span>
          <p className="mt-4 font-semibold">Nghĩa rơi xuống, gõ từ tiếng Anh</p>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Gõ đúng từ là giọt tan ngay, không cần Enter. Để {RAIN_LIVES} giọt
            chạm đáy là thua. Càng về sau rơi càng nhanh.
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
    const survived = lives > 0;
    return (
      <div className="space-y-5 px-5 pt-2">
        <div className="border-border bg-card rounded-2xl border p-6 text-center">
          <p className="text-muted text-sm">
            {survived ? "Hết mưa!" : "Ướt hết rồi…"}
          </p>
          <p className="mt-1 text-5xl font-bold tabular-nums">
            {hits.length}/{words.length}
          </p>
          <p className="text-muted mt-3 text-sm">
            {survived
              ? `Bắn trúng ${hits.length} từ, để rơi ${misses.length}.`
              : `Thua sau ${hits.length + misses.length} từ. Chơi lại để đi xa hơn nhé.`}
          </p>
          <p className="text-brand mt-3 text-sm font-semibold tabular-nums">
            +{xpForAnswers(hits.length, misses.length)} XP
          </p>
        </div>

        {misses.length > 0 ? (
          <div className="border-border bg-card rounded-2xl border p-4">
            <p className="mb-2 text-sm font-semibold">Từ đã để rơi</p>
            <ul className="space-y-1.5">
              {misses.map((word, index) => (
                <li key={`${word.wordId}-${index}`} className="text-sm">
                  <span className="font-medium">{word.term}</span>
                  <span className="text-muted"> · {word.meaning}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <button
          type="button"
          onClick={replay}
          className="bg-brand min-h-12 w-full rounded-xl text-base font-semibold text-white transition-transform duration-100 active:scale-[0.98]"
        >
          Chơi lại
        </button>
        <Link
          href="/tro-choi/mua-tu"
          className="border-border text-muted flex min-h-12 items-center justify-center rounded-xl border font-medium transition-transform duration-100 active:scale-[0.98]"
        >
          Chọn bộ khác
        </Link>
      </div>
    );
  }

  const inputTone =
    flash === "hit"
      ? "border-green-600 bg-green-600/10"
      : flash === "miss"
        ? "border-red-500 bg-red-500/10"
        : "border-border bg-card focus:border-brand";

  return (
    <div className="space-y-3 px-5 pt-2">
      <div className="text-muted flex items-center justify-between px-1 text-sm tabular-nums">
        <span className="text-fg font-semibold">{hits.length} trúng</span>
        <span aria-label={`Còn ${lives} mạng`}>
          {"●".repeat(lives)}
          <span className="opacity-30">{"●".repeat(RAIN_LIVES - lives)}</span>
        </span>
        <span>
          {spawned}/{words.length} từ
        </span>
      </div>

      {/* Sân rơi: cao vừa để bàn phím điện thoại hiện lên vẫn thấy ô gõ. */}
      <div
        aria-live="off"
        className="border-border bg-card relative h-[50dvh] min-h-64 overflow-hidden rounded-2xl border"
      >
        {drops.map((drop) => (
          <div
            key={drop.id}
            onAnimationEnd={() => handleMiss(drop)}
            style={
              {
                left: `${drop.word.left}%`,
                "--fall": `${drop.duration}s`,
              } as React.CSSProperties
            }
            className="rain-drop bg-brand-soft text-fg absolute max-w-[30%] rounded-xl px-3 py-2 text-sm font-medium shadow-sm"
          >
            {drop.word.meaning}
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(event) => handleInput(event.target.value)}
        placeholder="Gõ từ tiếng Anh…"
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="go"
        aria-label="Từ tiếng Anh"
        className={`min-h-14 w-full rounded-xl border px-4 text-center text-xl font-semibold outline-none transition-colors ${inputTone}`}
      />
    </div>
  );
}
