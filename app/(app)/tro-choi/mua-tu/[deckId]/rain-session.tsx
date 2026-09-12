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

/**
 * go:    từ tiếng Anh rơi, gõ đúng chữ để bắn — luyện gõ và chính tả.
 * nghia: nghĩa tiếng Việt rơi, phải nhớ ra từ tiếng Anh — luyện ghi nhớ.
 */
type Mode = "go" | "nghia";

type Drop = {
  id: string;
  word: GameWord;
  duration: number;
};

type Point = { x: number; y: number };

/** Tia laser từ tàu tới giọt vừa trúng, tự tắt sau vài trăm ms. */
type Laser = { id: number; from: Point; to: Point };

/** Vụ nổ nhỏ tại chỗ giọt tan. */
type Burst = { id: number; at: Point };

const MODES: { value: Mode; title: string; description: string }[] = [
  {
    value: "go",
    title: "Gõ từ rơi",
    description: "Từ tiếng Anh rơi xuống, gõ theo cho kịp. Luyện gõ và chính tả.",
  },
  {
    value: "nghia",
    title: "Dịch nghĩa",
    description: "Nghĩa tiếng Việt rơi xuống, nhớ ra từ tiếng Anh. Khó hơn.",
  },
];

/** Số chữ đầu của `term` khớp với `input` (không phân biệt hoa thường). */
function matchedPrefix(term: string, input: string) {
  const a = term.toLowerCase();
  const b = input.toLowerCase();
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n += 1;
  return n;
}

/** Toạ độ tâm của một phần tử, tính theo sân chơi. */
function centerOf(element: Element, field: Element): Point {
  const box = element.getBoundingClientRect();
  const origin = field.getBoundingClientRect();
  return {
    x: box.left - origin.left + box.width / 2,
    y: box.top - origin.top + box.height / 2,
  };
}

export function RainSession({ words }: { words: GameWord[] }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [mode, setMode] = useState<Mode>("go");
  const [drops, setDrops] = useState<Drop[]>([]);
  const [spawned, setSpawned] = useState(0);
  const [hits, setHits] = useState<GameWord[]>([]);
  const [misses, setMisses] = useState<GameWord[]>([]);
  const [lives, setLives] = useState(RAIN_LIVES);
  const [input, setInput] = useState("");
  const [shake, setShake] = useState(false);
  const [lasers, setLasers] = useState<Laser[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const shipRef = useRef<HTMLDivElement>(null);
  const dropRefs = useRef(new Map<string, HTMLDivElement>());
  const effectId = useRef(0);

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

  // Dọn hiệu ứng laser / nổ sau khi chúng chạy xong.
  useEffect(() => {
    if (lasers.length === 0 && bursts.length === 0) return;
    const timer = setTimeout(() => {
      setLasers([]);
      setBursts([]);
    }, 400);
    return () => clearTimeout(timer);
  }, [lasers, bursts]);

  useEffect(() => {
    if (!shake) return;
    const timer = setTimeout(() => setShake(false), 400);
    return () => clearTimeout(timer);
  }, [shake]);

  function finish() {
    setPhase("finished");
    void refreshStudyViews();
  }

  function start(chosen: Mode) {
    setMode(chosen);
    setDrops([]);
    setSpawned(0);
    setHits([]);
    setMisses([]);
    setLives(RAIN_LIVES);
    setInput("");
    setPhase("playing");
    // Ô nhập chưa mount ở render này; đợi một nhịp rồi focus.
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  /** Ván xong khi mọi từ đã rơi và không còn giọt nào trên màn. */
  function maybeFinish(remaining: Drop[]) {
    if (remaining.length === 0 && spawned >= words.length) finish();
  }

  function fireAt(drop: Drop) {
    const field = fieldRef.current;
    const ship = shipRef.current;
    const element = dropRefs.current.get(drop.id);
    if (!field || !ship || !element) return;

    const id = (effectId.current += 1);
    const to = centerOf(element, field);
    setLasers((list) => [...list, { id, from: centerOf(ship, field), to }]);
    setBursts((list) => [...list, { id, at: to }]);
  }

  function handleInput(value: string) {
    setInput(value);
    if (phase !== "playing") return;

    // Khớp giọt nào là bắn ngay, không cần Enter.
    const target = drops.find((drop) => isCorrectAnswer(value, drop.word.term));
    if (!target) return;

    fireAt(target);
    const remaining = drops.filter((drop) => drop.id !== target.id);
    setDrops(remaining);
    setHits((list) => [...list, target.word]);
    setInput("");
    void recordReview(target.word.wordId, true).catch(() => {});
    maybeFinish(remaining);
  }

  function handleMiss(drop: Drop) {
    if (phase !== "playing") return;

    const remaining = drops.filter((item) => item.id !== drop.id);
    setDrops(remaining);
    setMisses((list) => [...list, drop.word]);
    setShake(true);
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
      <div className="mx-auto max-w-md space-y-4 px-5 pt-2">
        <div className="border-border bg-card rounded-2xl border p-6 text-center">
          <span className="bg-brand-soft text-brand mx-auto flex h-16 w-16 items-center justify-center rounded-2xl">
            <CloudRainIcon className="h-8 w-8" />
          </span>
          <p className="mt-4 font-semibold">Chọn cách chơi</p>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Gõ đúng từ là bắn tan giọt, không cần Enter. Để {RAIN_LIVES} giọt
            chạm vạch đỏ là thua. Càng về sau rơi càng nhanh.
          </p>
        </div>

        {MODES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => start(option.value)}
            className="border-border bg-card w-full rounded-2xl border p-4 text-left transition-transform duration-100 active:scale-[0.98]"
          >
            <span className="block font-semibold">{option.title}</span>
            <span className="text-muted mt-0.5 block text-sm">
              {option.description}
            </span>
          </button>
        ))}
      </div>
    );
  }

  if (phase === "finished") {
    const survived = lives > 0;
    return (
      <div className="mx-auto max-w-md space-y-5 px-5 pt-2">
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
          onClick={() => start(mode)}
          className="bg-brand min-h-12 w-full rounded-xl text-base font-semibold text-white transition-transform duration-100 active:scale-[0.98]"
        >
          Chơi lại
        </button>
        <button
          type="button"
          onClick={() => setPhase("intro")}
          className="border-border flex min-h-12 w-full items-center justify-center rounded-xl border font-medium transition-transform duration-100 active:scale-[0.98]"
        >
          Đổi cách chơi
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

  // Ở chế độ gõ từ, giọt đang được gõ dở là "mục tiêu": chữ đã gõ sáng lên.
  const targetId =
    mode === "go" && input
      ? (drops.find((drop) => matchedPrefix(drop.word.term, input) === input.length)?.id ?? null)
      : null;

  return (
    <div className="space-y-3 px-5 pt-2">
      <div className="text-muted flex items-center justify-between px-1 text-sm tabular-nums">
        <span className="text-fg font-semibold">🏆 {hits.length}</span>
        <span className="text-muted">
          {MODES.find((option) => option.value === mode)?.title} ·{" "}
          {spawned}/{words.length} từ
        </span>
        <span aria-label={`Còn ${lives} mạng`} className="tracking-wider">
          {"❤️".repeat(lives)}
          <span className="opacity-25">{"❤️".repeat(RAIN_LIVES - lives)}</span>
        </span>
      </div>

      {/* Sân rơi: cao vừa để bàn phím điện thoại hiện lên vẫn thấy ô gõ. */}
      <div
        ref={fieldRef}
        aria-live="off"
        className={`rain-field relative h-[52dvh] min-h-64 overflow-hidden rounded-2xl border border-slate-800 md:h-[62vh] ${
          shake ? "rain-shake" : ""
        }`}
      >
        {drops.map((drop) => {
          const isTarget = drop.id === targetId;
          const matched = isTarget ? input.length : 0;
          const term = drop.word.term;

          return (
            <div
              key={drop.id}
              ref={(node) => {
                if (node) dropRefs.current.set(drop.id, node);
                else dropRefs.current.delete(drop.id);
              }}
              onAnimationEnd={() => handleMiss(drop)}
              style={
                {
                  left: `${drop.word.left}%`,
                  "--fall": `${drop.duration}s`,
                } as React.CSSProperties
              }
              className={`rain-drop absolute max-w-[40%] rounded-xl border px-3 py-1.5 text-center shadow-lg md:max-w-xs ${
                isTarget
                  ? "border-yellow-400 bg-slate-900/90 shadow-yellow-400/30"
                  : "border-slate-700 bg-slate-900/80"
              }`}
            >
              {mode === "go" ? (
                <>
                  <span className="block font-mono text-lg font-bold tracking-wide text-white">
                    <span className="text-green-400">{term.slice(0, matched)}</span>
                    {term.slice(matched)}
                  </span>
                  <span className="block truncate text-xs text-slate-400">
                    {drop.word.meaning}
                  </span>
                </>
              ) : (
                <span className="block text-base font-semibold text-white">
                  {drop.word.meaning}
                </span>
              )}
            </div>
          );
        })}

        {lasers.map((laser) => {
          const dx = laser.to.x - laser.from.x;
          const dy = laser.to.y - laser.from.y;
          return (
            <div
              key={laser.id}
              aria-hidden
              className="rain-laser absolute h-0.5 origin-left rounded-full bg-cyan-300 shadow-[0_0_8px_2px_rgba(103,232,249,0.8)]"
              style={{
                left: laser.from.x,
                top: laser.from.y,
                width: Math.hypot(dx, dy),
                transform: `rotate(${Math.atan2(dy, dx)}rad)`,
              }}
            />
          );
        })}

        {bursts.map((burst) => (
          <div
            key={burst.id}
            aria-hidden
            className="rain-burst absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-yellow-300"
            style={{ left: burst.at.x, top: burst.at.y }}
          />
        ))}

        {/* Vạch đỏ nguy hiểm + tàu */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-red-500/80 shadow-[0_0_12px_2px_rgba(239,68,68,0.6)]" />
        <div
          ref={shipRef}
          aria-hidden
          className="absolute bottom-2 left-1/2 -translate-x-1/2 text-4xl leading-none select-none"
        >
          🚀
        </div>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(event) => handleInput(event.target.value)}
        placeholder={mode === "go" ? "Gõ từ đang rơi…" : "Gõ từ tiếng Anh…"}
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="go"
        aria-label="Từ tiếng Anh"
        className="border-border bg-card focus:border-brand mx-auto block min-h-14 w-full max-w-md rounded-xl border px-4 text-center font-mono text-xl font-semibold outline-none"
      />
    </div>
  );
}
