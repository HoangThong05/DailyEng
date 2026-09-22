"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { recordReview } from "@/app/_actions/study";
import { Celebration } from "@/app/_components/celebration";
import { CountUp } from "@/app/_components/count-up";
import { MicIcon, SpeakerIcon } from "@/app/_components/icons";
import { Mascot, resultMascot } from "@/app/_components/mascot";
import { useHydrated } from "@/app/_components/use-hydrated";
import type { SentenceItem } from "@/lib/dictation-game";
import { assessShadowing, SHADOW_PASS, type ShadowAttempt } from "@/lib/shadowing";
import {
  createRecognition,
  readAlternatives,
  speak,
  startRecording,
  supportsRecognition,
  type Recorder,
  type RecognitionErrorCode,
  type SpeechRecognitionLike,
} from "@/lib/speech";
import { playCorrect, playMiss, readSoundPreference } from "@/lib/game-audio";
import { xpForAnswers } from "@/lib/xp";

type Phase = "intro" | "practice" | "finished";

const SLOW_RATE = 0.6;

function errorMessage(code: RecognitionErrorCode): string | null {
  switch (code) {
    case "no-speech":
      return "Không nghe thấy gì. Bấm micro rồi nói cả câu nhé.";
    case "not-allowed":
    case "service-not-allowed":
      return "Trình duyệt chưa cho phép dùng micro.";
    case "network":
      return "Nhận dạng giọng nói cần mạng, kiểm tra kết nối nhé.";
    case "aborted":
      return null;
    default:
      return "Có lỗi khi nhận dạng, thử lại nhé.";
  }
}

export function ShadowingSession({ items }: { items: SentenceItem[] }) {
  const hydrated = useHydrated();
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [attempt, setAttempt] = useState<ShadowAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  /** Điểm tốt nhất từng câu, để ghi Leitner một lần khi qua câu. */
  const [best, setBest] = useState<number[]>(() => items.map(() => -1));

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const recordingUrlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** Câu đã ghi Leitner — quay lại làm tiếp không ghi lần hai. */
  const committedRef = useRef(new Set<number>());

  const item = items[index];
  const canRecord = hydrated && supportsRecognition();
  // Không nhận dạng được (Firefox, Safari iOS) thì vẫn ghi âm để tự so với mẫu.
  const canRecordOnly =
    hydrated && !supportsRecognition() && typeof MediaRecorder !== "undefined";
  const [recordingOnly, setRecordingOnly] = useState(false);

  function replaceRecording(url: string | null) {
    if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
    recordingUrlRef.current = url;
    setRecordingUrl(url);
  }

  // Rời màn hình giữa chừng thì dừng micro, dừng giọng đọc, thu hồi URL.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      void recorderRef.current?.stop();
      if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function start() {
    speak(items[0].sentence);
    setPhase("practice");
  }

  async function finishRecording() {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (!recorder) return;
    const blob = await recorder.stop();
    if (blob) replaceRecording(URL.createObjectURL(blob));
  }

  async function listen() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = createRecognition();
    if (!recognition) return;

    window.speechSynthesis?.cancel();
    setAttempt(null);
    setError(null);
    replaceRecording(null);

    recognition.onresult = (event) => {
      const result = assessShadowing(
        item.sentence,
        item.term,
        readAlternatives(event.results),
      );
      setAttempt(result);
      if (readSoundPreference()) (result.score >= SHADOW_PASS ? playCorrect : playMiss)();
      setBest((list) => {
        const next = [...list];
        next[index] = Math.max(next[index], result.score);
        return next;
      });
    };
    recognition.onerror = (event) => setError(errorMessage(event.error));
    recognition.onend = () => {
      setListening(false);
      void finishRecording();
    };

    recognitionRef.current = recognition;
    setListening(true);
    recorderRef.current = await startRecording();
    try {
      recognition.start();
    } catch {
      setListening(false);
      void finishRecording();
      setError("Không khởi động được micro, thử lại nhé.");
    }
  }

  /** Chỉ ghi âm (không chấm) cho trình duyệt thiếu nhận dạng giọng nói. */
  async function toggleRecordOnly() {
    if (recordingOnly) {
      setRecordingOnly(false);
      await finishRecording();
      return;
    }
    window.speechSynthesis?.cancel();
    setError(null);
    replaceRecording(null);
    const recorder = await startRecording();
    if (!recorder) {
      setError("Không mở được micro. Kiểm tra quyền micro của trình duyệt.");
      return;
    }
    recorderRef.current = recorder;
    setRecordingOnly(true);
  }

  /** Nghe mẫu rồi nghe ngay giọng mình để so. */
  function compare() {
    if (!recordingUrl) return;
    const utterance = new SpeechSynthesisUtterance(item.sentence);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    utterance.onend = () => void audioRef.current?.play();
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function commit(i: number) {
    const score = best[i];
    if (score < 0 || committedRef.current.has(i)) return; // chưa thử / đã ghi
    committedRef.current.add(i);
    void recordReview(items[i].wordId, score >= SHADOW_PASS, "shadowing").catch(() => {});
  }

  function goTo(nextIndex: number) {
    recognitionRef.current?.abort();
    void recorderRef.current?.stop();
    recorderRef.current = null;
    commit(index);
    setListening(false);
    setRecordingOnly(false);
    setAttempt(null);
    setError(null);
    replaceRecording(null);
    if (nextIndex >= items.length) {
      setPhase("finished");
      return;
    }
    setIndex(nextIndex);
    speak(items[nextIndex].sentence);
  }

  if (phase === "intro") {
    return (
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <Mascot variant="noi" size={128} priority />
        <h2 className="mt-4 text-xl font-bold">{items.length} câu</h2>
        <p className="text-muted mt-2 max-w-sm text-sm">
          Nghe câu mẫu, bấm micro và nói theo ngay. Máy chấm từng từ nghe được,
          ghi âm để bạn nghe lại và so với mẫu. Không giới hạn số lần thử.
        </p>
        {hydrated && !supportsRecognition() ? (
          <p className="bg-brand-soft mt-4 rounded-xl px-4 py-3 text-sm">
            Trình duyệt này không chấm điểm được (cần Chrome hoặc Edge), nhưng
            bạn vẫn ghi âm và nghe so với mẫu được.
          </p>
        ) : null}
        <button
          type="button"
          onClick={start}
          className="bg-brand mt-8 min-h-12 w-full max-w-sm rounded-xl font-semibold text-white press"
        >
          Bắt đầu
        </button>
      </div>
    );
  }

  if (phase === "finished") {
    const tried = best.filter((score) => score >= 0);
    const passed = best.filter((score) => score >= SHADOW_PASS).length;
    const avg = tried.length
      ? Math.round(tried.reduce((sum, s) => sum + s, 0) / tried.length)
      : 0;
    return (
      <div className="space-y-5 px-5 pt-2 pb-4">
        <Celebration />
        <div className="border-border bg-card rounded-2xl border p-6 text-center">
          <Mascot
            variant={resultMascot(passed, items.length)}
            size={112}
            className="mx-auto"
          />
          <p className="text-muted mt-2 text-sm">Câu đạt</p>
          <p className="mt-1 text-5xl font-bold tabular-nums">
            <CountUp value={passed} />/{items.length}
          </p>
          <p className="text-muted mt-3 text-sm">
            Điểm trung bình <CountUp value={avg} suffix="%" />
            {tried.length < items.length
              ? ` · bỏ qua ${items.length - tried.length} câu`
              : ""}
          </p>
          <p className="text-brand mt-3 text-sm font-semibold tabular-nums">
            <CountUp
              prefix="+"
              value={xpForAnswers(passed, tried.length - passed)}
              suffix=" XP"
            />
          </p>
        </div>
        <ul className="border-border bg-card divide-border divide-y rounded-2xl border">
          {items.map((it, i) => (
            <li key={it.wordId} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="min-w-0 flex-1 truncate">{it.sentence}</span>
              <span
                className={`shrink-0 font-bold tabular-nums ${
                  best[i] >= SHADOW_PASS
                    ? "text-emerald-500"
                    : best[i] < 0
                      ? "text-muted"
                      : "text-red-500"
                }`}
              >
                {best[i] < 0 ? "—" : `${best[i]}%`}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3">
          <Link
            href="/ky-nang/shadowing"
            className="bg-brand flex min-h-12 items-center justify-center rounded-xl font-semibold text-white press"
          >
            Chọn bộ khác
          </Link>
          <Link
            href="/ky-nang"
            className="border-border text-muted flex min-h-12 items-center justify-center rounded-xl border font-medium press"
          >
            Về luyện kỹ năng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-2 pb-4">
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={items.length}
          aria-label="Tiến độ"
          className="bg-brand-soft h-2 flex-1 overflow-hidden rounded-full"
        >
          <div
            className="bg-brand h-full rounded-full transition-[width] duration-300"
            style={{ width: `${((index + 1) / items.length) * 100}%` }}
          />
        </div>
        <span className="text-muted text-sm tabular-nums">
          {index + 1}/{items.length}
        </span>
      </div>

      {/* Câu mẫu: hiện chữ để đọc theo; sau khi nói thì tô từng từ máy nghe được */}
      <div key={index} className="step-enter border-border bg-card mt-5 rounded-3xl border p-6">
        <p className="text-xl leading-relaxed font-semibold">
          {attempt
            ? attempt.marks.map((mark, i) => (
                <span
                  key={i}
                  className={`mr-1 inline-block rounded px-1 ${
                    mark.hit
                      ? "bg-emerald-500/15 text-emerald-600"
                      : "bg-red-500/15 text-red-500"
                  }`}
                >
                  {mark.text}
                </span>
              ))
            : item.sentence}
        </p>
        <p className="text-muted mt-2 text-sm">{item.translation ?? item.meaning}</p>
        <p className="text-muted mt-1 text-xs">
          Từ khoá: <span className="text-brand font-semibold">{item.term}</span>
        </p>

        {attempt ? (
          <div className="border-border mt-4 border-t pt-4">
            <p className="flex items-center gap-2">
              <span
                className={`text-3xl font-bold tabular-nums ${
                  attempt.verdict === "good"
                    ? "text-emerald-500"
                    : attempt.verdict === "close"
                      ? "text-amber-500"
                      : "text-red-500"
                }`}
              >
                {attempt.score}%
              </span>
              <span className="text-muted text-sm">
                {attempt.verdict === "good"
                  ? "Rõ ràng, máy nghe ra gần hết."
                  : attempt.verdict === "close"
                    ? "Gần đúng, chú ý các từ đỏ."
                    : "Máy nghe khác khá nhiều, thử chậm và rõ hơn."}
              </span>
            </p>
            {attempt.heard ? (
              <p className="text-muted mt-1 text-sm">
                Máy nghe: <span className="italic">{attempt.heard}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 text-sm font-medium text-red-500">
            {error}
          </p>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => speak(item.sentence)}
          className="border-border bg-card flex min-h-14 items-center justify-center gap-2 rounded-2xl border font-semibold press"
        >
          <SpeakerIcon className="h-5 w-5" />
          Nghe mẫu
        </button>
        <button
          type="button"
          onClick={() => speak(item.sentence, "en-US", SLOW_RATE)}
          className="border-border bg-card flex min-h-14 items-center justify-center gap-2 rounded-2xl border font-semibold press"
        >
          🐢 Đọc chậm
        </button>
      </div>

      {canRecord ? (
        <button
          type="button"
          onClick={listen}
          aria-pressed={listening}
          className={`mt-3 flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl text-lg font-bold text-white press ${
            listening ? "animate-pulse bg-red-500" : "bg-brand"
          }`}
        >
          <MicIcon className="h-6 w-6" />
          {listening ? "Đang nghe… bấm để dừng" : attempt ? "Nói lại" : "Nói theo"}
        </button>
      ) : canRecordOnly ? (
        <button
          type="button"
          onClick={toggleRecordOnly}
          aria-pressed={recordingOnly}
          className={`mt-3 flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl text-lg font-bold text-white press ${
            recordingOnly ? "animate-pulse bg-red-500" : "bg-brand"
          }`}
        >
          <MicIcon className="h-6 w-6" />
          {recordingOnly ? "Đang ghi… bấm để dừng" : "Ghi âm để tự so"}
        </button>
      ) : hydrated ? (
        <p className="text-muted mt-3 text-center text-sm">
          Trình duyệt này không dùng được micro; vẫn nghe mẫu và tự đọc theo.
        </p>
      ) : null}

      {recordingUrl ? (
        <div className="border-border bg-card mt-3 flex items-center gap-3 rounded-2xl border p-3">
          <audio ref={audioRef} src={recordingUrl} controls className="min-w-0 flex-1" />
          <button
            type="button"
            onClick={compare}
            className="bg-brand-soft text-brand min-h-11 shrink-0 rounded-xl px-3 text-sm font-semibold press"
          >
            So với mẫu
          </button>
        </div>
      ) : null}

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="border-border min-h-12 flex-1 rounded-xl border font-semibold press disabled:opacity-40"
        >
          ← Trước
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          className="bg-brand min-h-12 flex-1 rounded-xl font-semibold text-white press"
        >
          {index + 1 >= items.length ? "Xem kết quả" : "Câu tiếp →"}
        </button>
      </div>
    </div>
  );
}
