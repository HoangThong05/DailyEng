"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MicIcon, SpeakerIcon } from "@/app/_components/icons";
import { useHydrated } from "@/app/_components/use-hydrated";
import type { Word } from "@/lib/database.types";
import { assessAttempt, type Attempt } from "@/lib/pronunciation";
import {
  createRecognition,
  readAlternatives,
  speak,
  startRecording,
  supportsRecognition,
  type RecognitionErrorCode,
  type Recorder,
  type SpeechRecognitionLike,
} from "@/lib/speech";

const REASON_TEXT: Record<Attempt["reason"], string> = {
  exact: "Chuẩn rồi 👏",
  guessed: "Gần đúng, thử lại xem",
  partial: "Gần đúng, thử lại xem",
  mismatch: "Chưa khớp",
};

const REASON_COLOR: Record<Attempt["reason"], string> = {
  exact: "text-emerald-500",
  guessed: "text-amber-500",
  partial: "text-amber-500",
  mismatch: "text-red-500",
};

const BAR_COLOR: Record<Attempt["reason"], string> = {
  exact: "bg-emerald-500",
  guessed: "bg-amber-500",
  partial: "bg-amber-500",
  mismatch: "bg-red-500",
};

function errorMessage(code: RecognitionErrorCode): string | null {
  switch (code) {
    case "aborted":
      // Do chính người dùng dừng hoặc chuyển từ, không phải lỗi.
      return null;
    case "no-speech":
      return "Không nghe thấy gì. Nói to và rõ hơn một chút nhé.";
    case "not-allowed":
    case "service-not-allowed":
      return "Trình duyệt chưa được cấp quyền dùng micro. Mở phần cài đặt quyền của trang để bật lại.";
    case "audio-capture":
      return "Không tìm thấy micro nào trên máy.";
    case "network":
      return "Nhận dạng giọng nói cần mạng. Kiểm tra kết nối rồi thử lại.";
    default:
      return "Không nhận dạng được, thử lại nhé.";
  }
}

export function PronunciationSession({
  deckName,
  words,
}: {
  deckName: string;
  words: Word[];
}) {
  const hydrated = useHydrated();
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<Attempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const recordingUrlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const word = words[index];

  /** Thay đoạn ghi âm hiện có, nhớ thu hồi URL cũ kẻo rò bộ nhớ. */
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

  // supportsRecognition() đọc window nên phải chờ hydrate xong mới hỏi,
  // nếu không server và client sẽ render lệch nhau.
  const canRecord = hydrated && supportsRecognition();

  function goTo(nextIndex: number) {
    recognitionRef.current?.abort();
    void recorderRef.current?.stop();
    recorderRef.current = null;
    setListening(false);
    setResult(null);
    setError(null);
    replaceRecording(null);
    setIndex(nextIndex);
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

    setResult(null);
    setError(null);
    replaceRecording(null);

    recognition.onresult = (event) => {
      setResult(assessAttempt(word.term, readAlternatives(event.results)));
    };
    recognition.onerror = (event) => setError(errorMessage(event.error));
    recognition.onend = () => {
      setListening(false);
      void finishRecording();
    };

    recognitionRef.current = recognition;
    setListening(true);

    // Ghi âm chỉ là phụ. startRecording() tự nuốt lỗi nên hỏng cũng không sao.
    recorderRef.current = await startRecording();

    try {
      recognition.start();
    } catch {
      setListening(false);
      void finishRecording();
      setError("Không khởi động được micro, thử lại nhé.");
    }
  }

  return (
    <div className="px-5 pt-2">
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={words.length}
          aria-label={`Từ thứ ${index + 1} trong bộ ${deckName}`}
          className="bg-brand-soft h-2 flex-1 overflow-hidden rounded-full"
        >
          <div
            className="bg-brand h-full rounded-full transition-[width] duration-300"
            style={{ width: `${((index + 1) / words.length) * 100}%` }}
          />
        </div>
        <span className="text-muted text-sm tabular-nums">
          {index + 1}/{words.length}
        </span>
      </div>

      <div className="border-border bg-card mt-5 rounded-3xl border p-6 text-center">
        <p className="text-3xl font-bold tracking-tight">{word.term}</p>
        {word.phonetic ? (
          <p className="text-muted mt-1 text-lg">{word.phonetic}</p>
        ) : null}
        <p className="text-muted mt-3 text-sm">{word.meaning_vi}</p>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => speak(word.term)}
          className="border-border bg-card flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl border font-semibold transition-transform duration-100 active:scale-95"
        >
          <SpeakerIcon className="h-5 w-5" />
          Nghe mẫu
        </button>

        {canRecord ? (
          <button
            type="button"
            onClick={listen}
            aria-pressed={listening}
            className={`flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl font-semibold text-white transition-transform duration-100 active:scale-95 ${
              listening ? "animate-pulse bg-red-500" : "bg-brand"
            }`}
          >
            <MicIcon className="h-5 w-5" />
            {listening ? "Đang nghe…" : "Nói theo"}
          </button>
        ) : null}
      </div>

      {recordingUrl ? (
        <>
          <audio ref={audioRef} src={recordingUrl} className="hidden" />
          <button
            type="button"
            onClick={() => audioRef.current?.play()}
            className="border-border bg-card mt-3 min-h-12 w-full rounded-xl border text-sm font-semibold transition-transform duration-100 active:scale-[0.98]"
          >
            Nghe lại giọng bạn
          </button>
        </>
      ) : null}

      {hydrated && !canRecord ? (
        <p className="text-muted mt-4 text-sm">
          Trình duyệt này không hỗ trợ nhận dạng giọng nói. Phần nghe mẫu vẫn
          dùng bình thường. Muốn chấm điểm thì mở bằng Chrome hoặc Edge.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-red-500">
          {error}
        </p>
      ) : null}

      {result ? (
        <div
          role="status"
          className="border-border bg-card mt-4 rounded-2xl border p-4"
        >
          <p className={`font-semibold ${REASON_COLOR[result.reason]}`}>
            {REASON_TEXT[result.reason]}
          </p>

          <p className="text-muted mt-1 text-sm">
            Máy nghe được:{" "}
            <span className="text-fg font-medium">
              {result.heard || "(không rõ)"}
            </span>
          </p>

          <div className="mt-3 flex items-center gap-3">
            <div className="bg-brand-soft h-2 flex-1 overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full ${BAR_COLOR[result.reason]}`}
                style={{ width: `${result.match}%` }}
              />
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {result.match}%
            </span>
          </div>

          {result.rank > 1 ? (
            <p className="text-muted mt-2 text-xs">
              Máy phải xét tới phương án thứ {result.rank} mới ra từ này — dấu
              hiệu bạn nói chưa thật rõ.
            </p>
          ) : null}

          {result.confidence > 0 ? (
            <p className="text-muted mt-1 text-xs">
              Độ tin cậy máy tự báo: {Math.round(result.confidence * 100)}%
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="border-border text-muted min-h-12 flex-1 rounded-xl border font-medium transition-transform duration-100 active:scale-[0.98] disabled:opacity-40"
        >
          Từ trước
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index + 1 >= words.length}
          className="bg-brand min-h-12 flex-1 rounded-xl font-semibold text-white transition-transform duration-100 active:scale-[0.98] disabled:opacity-40"
        >
          Từ tiếp theo
        </button>
      </div>

      <Link
        href="/phat-am"
        className="text-muted mt-4 block min-h-11 text-center text-sm font-medium"
      >
        Chọn bộ khác
      </Link>
    </div>
  );
}