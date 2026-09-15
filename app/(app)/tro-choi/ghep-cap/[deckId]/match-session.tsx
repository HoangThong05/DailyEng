"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { recordReview } from "@/app/_actions/study";
import { Celebration } from "@/app/_components/celebration";
import { CountUp } from "@/app/_components/count-up";
import { Mascot, resultMascot } from "@/app/_components/mascot";
import { playCorrect, playMiss, readSoundPreference } from "@/lib/game-audio";
import { buildMatchTiles, type MatchPair, type MatchTile } from "@/lib/match-game";
import { xpForAnswers } from "@/lib/xp";

/** Ô sai đỏ lên trong ngần này ms rồi tự bỏ chọn. */
const WRONG_FLASH_MS = 450;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function bestKey(deckId: string) {
  return `dailyeng:ghep-cap:best:${deckId}`;
}

/** Lưu kỷ lục nếu nhanh hơn; trả về kỷ lục cũ (null nếu chưa có). */
function saveBest(deckId: string, seconds: number): number | null {
  try {
    const saved = localStorage.getItem(bestKey(deckId));
    const previous = saved ? Number(saved) : null;
    if (previous === null || seconds < previous) {
      localStorage.setItem(bestKey(deckId), String(seconds));
    }
    return previous;
  } catch {
    // Chế độ riêng tư có thể chặn localStorage; không có kỷ lục cũng không sao.
    return null;
  }
}

type Props = {
  deckId: string;
  pairs: MatchPair[];
  /** Đã trộn sẵn ở server, để HTML server và client khớp nhau. */
  initialTiles: MatchTile[];
};

export function MatchSession({ deckId, pairs, initialTiles }: Props) {
  const [tiles, setTiles] = useState(initialTiles);
  const [selected, setSelected] = useState<MatchTile | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<[string, string] | null>(null);
  const [mistakes, setMistakes] = useState<Map<string, number>>(new Map());
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [previousBest, setPreviousBest] = useState<number | null>(null);

  // Đồng hồ: mỗi giây cộng 1 từ lần chạm đầu tới khi ghép xong.
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);

  function finish(finalMistakes: Map<string, number>) {
    setRunning(false);
    setFinished(true);
    setPreviousBest(saveBest(deckId, elapsed));

    // Ghép đúng ngay lần đầu = nhớ; sai dù một lần = chưa nhớ. Lưu chạy nền.
    void Promise.all(
      pairs.map((pair) =>
        recordReview(pair.wordId, (finalMistakes.get(pair.wordId) ?? 0) === 0, "game"),
      ),
    ).catch(() => {});
  }

  function tap(tile: MatchTile) {
    if (finished || wrong || matched.has(tile.wordId)) return;

    if (!running) setRunning(true);

    if (!selected) {
      setSelected(tile);
      return;
    }
    if (selected.id === tile.id) {
      setSelected(null);
      return;
    }

    if (selected.wordId === tile.wordId && selected.kind !== tile.kind) {
      const nextMatched = new Set(matched).add(tile.wordId);
      setMatched(nextMatched);
      setSelected(null);
      if (readSoundPreference()) playCorrect();
      if (nextMatched.size === pairs.length) finish(mistakes);
      return;
    }

    // Sai: cả hai từ dính lỗi, ô đỏ lên rồi tự nhả.
    const nextMistakes = new Map(mistakes);
    for (const wordId of [selected.wordId, tile.wordId]) {
      nextMistakes.set(wordId, (nextMistakes.get(wordId) ?? 0) + 1);
    }
    setMistakes(nextMistakes);
    setWrong([selected.id, tile.id]);
    if (readSoundPreference()) playMiss();
    setTimeout(() => {
      setWrong(null);
      setSelected(null);
    }, WRONG_FLASH_MS);
  }

  function replay() {
    setTiles(buildMatchTiles(pairs));
    setSelected(null);
    setMatched(new Set());
    setWrong(null);
    setMistakes(new Map());
    setElapsed(0);
    setRunning(false);
    setFinished(false);
  }

  // Mỗi lần sai cộng lỗi cho cả hai từ, nên chia đôi ra số lần chạm sai.
  const totalMistakes = [...mistakes.values()].reduce((a, b) => a + b, 0) / 2;

  if (finished) {
    const clean = pairs.filter((pair) => !mistakes.has(pair.wordId)).length;
    const isRecord = previousBest === null || elapsed < previousBest;

    return (
      <div className="space-y-5 px-5 pt-2">
        <Celebration />
        <div className="border-border bg-card rounded-2xl border p-6 text-center">
          <Mascot
            variant={resultMascot(clean, pairs.length)}
            size={112}
            className="mx-auto"
          />
          <p className="text-muted mt-2 text-sm">Xong trong</p>
          <p className="mt-1 text-5xl font-bold tabular-nums">
            {formatTime(elapsed)}
          </p>
          <p className="text-muted mt-3 text-sm">
            {clean}/{pairs.length} cặp đúng ngay lần đầu · {totalMistakes} lần
            sai
            {isRecord
              ? " · kỷ lục mới!"
              : ` · kỷ lục ${formatTime(previousBest)}`}
          </p>
          <p className="text-brand mt-3 text-sm font-semibold tabular-nums">
            <CountUp prefix="+" value={xpForAnswers(clean, pairs.length - clean)} suffix=" XP" />
          </p>
        </div>

        {clean < pairs.length ? (
          <div className="border-border bg-card rounded-2xl border p-4">
            <p className="mb-2 text-sm font-semibold">Từ cần xem lại</p>
            <ul className="space-y-1.5">
              {pairs
                .filter((pair) => mistakes.has(pair.wordId))
                .map((pair) => (
                  <li key={pair.wordId} className="text-sm">
                    <span className="font-medium">{pair.term}</span>
                    <span className="text-muted"> · {pair.meaning}</span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

        <button
          type="button"
          onClick={replay}
          className="bg-brand min-h-12 w-full rounded-xl text-base font-semibold text-white press"
        >
          Chơi lại
        </button>
        <Link
          href="/tro-choi/ghep-cap"
          className="border-border text-muted flex min-h-12 items-center justify-center rounded-xl border font-medium press"
        >
          Chọn bộ khác
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 pt-2">
      <div className="text-muted mb-3 flex items-center justify-between px-1 text-sm tabular-nums">
        <span>
          {matched.size}/{pairs.length} cặp
        </span>
        <span className="text-fg font-semibold">{formatTime(elapsed)}</span>
        <span>{totalMistakes} sai</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {tiles.map((tile) => {
          const isMatched = matched.has(tile.wordId);
          const isSelected = selected?.id === tile.id;
          const isWrong = wrong?.includes(tile.id) ?? false;

          const state = isMatched
            ? "pointer-events-none scale-90 border-transparent bg-transparent opacity-0"
            : isWrong
              ? "border-red-500 bg-red-500/10 text-red-500"
              : isSelected
                ? "border-brand bg-brand-soft text-brand"
                : "border-border bg-card";

          return (
            <button
              key={tile.id}
              type="button"
              onClick={() => tap(tile)}
              disabled={isMatched}
              aria-pressed={isSelected}
              className={`flex min-h-20 items-center justify-center rounded-xl border px-1.5 py-2 text-center text-sm leading-snug break-words transition-all duration-200 select-none active:scale-95 ${
                tile.kind === "term" ? "font-semibold" : ""
              } ${state}`}
            >
              {tile.text}
            </button>
          );
        })}
      </div>

      <p className="text-muted mt-4 text-center text-sm">
        Chạm một từ rồi chạm nghĩa của nó.
      </p>
    </div>
  );
}
