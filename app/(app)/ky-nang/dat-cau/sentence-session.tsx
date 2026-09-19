"use client";

import Link from "next/link";
import { useState } from "react";
import { Rich } from "@/app/_components/ai-chat";
import { SpeakerIcon } from "@/app/_components/icons";
import { Mascot } from "@/app/_components/mascot";
import type { PracticeWord } from "@/lib/sentence-practice";
import { speak } from "@/lib/speech";

const MAX_CHARS = 300;

type Result = { sentence: string; feedback: string; score: number | null };

/** Rút điểm x/10 từ dòng "**Điểm:** 7/10" của AI; không thấy thì null. */
function readScore(feedback: string): number | null {
  const match = feedback.match(/Điểm:\*{0,2}\s*(\d{1,2})\s*\/\s*10/);
  if (!match) return null;
  const value = Number(match[1]);
  return value >= 0 && value <= 10 ? value : null;
}

/**
 * Một lượt: lần lượt từng từ. Gửi câu → stream nhận xét → "Từ tiếp". Hết từ
 * thì tổng kết điểm trung bình. Hạn mức AI dùng chung với Hỏi AI.
 */
export function SentenceSession({ words }: { words: PracticeWord[] }) {
  const [index, setIndex] = useState(0);
  const [sentence, setSentence] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);

  const word = words[index];
  const finished = index >= words.length;
  const graded = feedback.length > 0 && !busy;

  async function submit() {
    const text = sentence.trim();
    if (!text || busy || !word) return;
    setBusy(true);
    setError(null);
    setFeedback("");

    const content = `Từ được giao: "${word.term}" (nghĩa: ${word.meaningVi}).\nCâu của học viên: ${text}`;
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "viet-cau", messages: [{ role: "user", content }] }),
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Không gọi được AI. Thử lại nhé.");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setFeedback(full);
      }
      // Lỗi giữa chừng được stream trong ngoặc vuông ở cuối.
      const trailing = full.match(/\n\n\[([^\]]+)\]\s*$/);
      if (trailing && !full.includes("Điểm")) {
        setError(trailing[1]);
        setFeedback("");
        return;
      }
      setResults((list) => [...list, { sentence: text, feedback: full, score: readScore(full) }]);
    } catch {
      setError("Mất kết nối. Thử lại nhé.");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setIndex((i) => i + 1);
    setSentence("");
    setFeedback("");
    setError(null);
  }

  if (finished) {
    const scored = results.filter((r) => r.score !== null) as (Result & { score: number })[];
    const avg = scored.length
      ? Math.round((scored.reduce((sum, r) => sum + r.score, 0) / scored.length) * 10) / 10
      : null;
    return (
      <div className="stagger space-y-5">
        <div className="border-border bg-card flex flex-col items-center rounded-3xl border p-6 text-center">
          <Mascot variant={avg !== null && avg >= 7 ? "an-mung" : "hoc"} size={112} />
          <h2 className="mt-3 text-2xl font-bold">Xong {results.length} câu</h2>
          {avg !== null ? (
            <p className="text-muted mt-1">
              Điểm trung bình <span className="text-brand font-bold">{avg}/10</span>
            </p>
          ) : null}
        </div>
        <ul className="space-y-3">
          {results.map((r, i) => (
            <li key={i} className="border-border bg-card rounded-2xl border p-4">
              <p className="flex items-center justify-between gap-3">
                <span className="font-medium">{words[i]?.term}</span>
                {r.score !== null ? (
                  <span className="bg-brand-soft text-brand rounded-full px-2 py-0.5 text-xs font-bold">
                    {r.score}/10
                  </span>
                ) : null}
              </p>
              <p className="text-muted mt-1 text-sm italic">“{r.sentence}”</p>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Link
            href="/ky-nang/dat-cau"
            className="bg-brand flex min-h-12 flex-1 items-center justify-center rounded-xl font-semibold text-white press"
          >
            Lượt mới
          </Link>
          <Link
            href="/ky-nang"
            className="border-border flex min-h-12 flex-1 items-center justify-center rounded-xl border font-semibold press"
          >
            Về Kỹ năng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted px-1 text-sm">
        Từ {index + 1}/{words.length}
      </p>

      {/* Từ được giao */}
      <section className="border-border bg-card rounded-3xl border p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-3xl font-bold tracking-tight">{word.term}</h2>
            {word.phonetic ? <p className="text-muted mt-0.5 text-sm">{word.phonetic}</p> : null}
            <p className="mt-2 text-lg">{word.meaningVi}</p>
          </div>
          <button
            type="button"
            onClick={() => speak(word.term)}
            aria-label="Đọc từ"
            className="bg-brand-soft text-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-full press"
          >
            <SpeakerIcon className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Câu của người học */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="space-y-3"
      >
        <textarea
          value={sentence}
          onChange={(event) => setSentence(event.target.value.slice(0, MAX_CHARS))}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          disabled={busy || graded}
          rows={3}
          autoFocus
          spellCheck={false}
          placeholder={`Viết một câu tiếng Anh có dùng "${word.term}"…`}
          aria-label="Câu của bạn"
          className="border-border bg-card placeholder:text-muted/70 focus:border-brand w-full resize-none rounded-2xl border px-4 py-3 text-base outline-none disabled:opacity-70"
        />
        {error ? (
          <p role="alert" className="text-sm font-medium text-red-500">
            {error}
          </p>
        ) : null}
        {!graded ? (
          <button
            type="submit"
            disabled={busy || sentence.trim().length === 0}
            className="bg-brand min-h-12 w-full rounded-xl font-semibold text-white press disabled:opacity-60"
          >
            {busy ? "Vịt đang chấm…" : "Chấm câu"}
          </button>
        ) : null}
      </form>

      {/* Nhận xét của AI, stream dần */}
      {feedback ? (
        <section className="border-brand/30 bg-brand-soft/40 flex gap-3 rounded-2xl border p-4">
          <Mascot variant={busy ? "ai-nghi" : "ai"} size={44} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <Rich text={feedback} />
          </div>
        </section>
      ) : null}

      {graded ? (
        <button
          type="button"
          onClick={next}
          className="bg-brand min-h-12 w-full rounded-xl font-semibold text-white press"
        >
          {index + 1 < words.length ? "Từ tiếp theo" : "Xem tổng kết"}
        </button>
      ) : null}
    </div>
  );
}
