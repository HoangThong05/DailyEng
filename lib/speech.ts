/**
 * Bọc Web Speech API cho gọn.
 *
 * lib.dom của TypeScript đã có SpeechRecognitionResultList nhưng chưa có
 * SpeechRecognition, nên phải tự khai báo phần còn thiếu.
 */

import type { Alternative } from "./pronunciation";

/**
 * Xin nhiều phương án thay vì một. Từ đúng tụt xuống phương án thứ 3, thứ 4
 * nghĩa là máy phải mò mãi mới ra — dấu hiệu phát âm chưa rõ.
 */
export const MAX_ALTERNATIVES = 5;

export type RecognitionErrorCode =
  | "no-speech"
  | "not-allowed"
  | "service-not-allowed"
  | "network"
  | "aborted"
  | "audio-capture"
  | (string & {});

export type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: { results: SpeechRecognitionResultList }) => void) | null;
  onerror: ((event: { error: RecognitionErrorCode }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

/** Tạo bộ nhận dạng giọng nói, trả về null nếu trình duyệt không hỗ trợ. */
export function createRecognition(
  lang = "en-US",
): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;

  const speechWindow = window as SpeechWindow;
  const Recognition =
    speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

  if (!Recognition) return null;

  const recognition = new Recognition();
  recognition.lang = lang;
  recognition.interimResults = false;
  recognition.maxAlternatives = MAX_ALTERNATIVES;
  recognition.continuous = false;
  return recognition;
}

/** Đổi kết quả thô của trình duyệt thành danh sách phương án. */
export function readAlternatives(
  results: SpeechRecognitionResultList,
): Alternative[] {
  const first = results[0];
  if (!first) return [];

  const alternatives: Alternative[] = [];
  for (let index = 0; index < first.length; index++) {
    const item = first[index];
    alternatives.push({
      transcript: item.transcript,
      // Không phải trình duyệt nào cũng báo confidence.
      confidence: Number.isFinite(item.confidence) ? item.confidence : 0,
    });
  }
  return alternatives;
}

/** Trình duyệt có nhận dạng giọng nói hay không. Chỉ gọi được ở client. */
export function supportsRecognition(): boolean {
  if (typeof window === "undefined") return false;
  const speechWindow = window as SpeechWindow;
  return Boolean(
    speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition,
  );
}

export type Recorder = {
  /** Dừng ghi, nhả micro, trả về đoạn âm thanh (null nếu không ghi được gì). */
  stop: () => Promise<Blob | null>;
};

/**
 * Bắt đầu ghi âm giọng người dùng để họ nghe lại.
 *
 * Không bao giờ ném lỗi: ghi âm chỉ là tính năng phụ, hỏng thì phần chấm điểm
 * vẫn phải chạy bình thường.
 */
export async function startRecording(): Promise<Recorder | null> {
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices?.getUserMedia ||
    typeof MediaRecorder === "undefined"
  ) {
    return null;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.start();

    const releaseMic = () => {
      for (const track of stream.getTracks()) track.stop();
    };

    return {
      stop: () =>
        new Promise<Blob | null>((resolve) => {
          if (recorder.state === "inactive") {
            releaseMic();
            resolve(null);
            return;
          }
          recorder.onstop = () => {
            releaseMic();
            resolve(
              chunks.length > 0
                ? new Blob(chunks, { type: recorder.mimeType || "audio/webm" })
                : null,
            );
          };
          recorder.stop();
        }),
    };
  } catch {
    return null;
  }
}

/** Đọc to một từ. Trả về false nếu trình duyệt không đọc được. */
export function speak(text: string, lang = "en-US"): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  // Bấm liên tục thì huỷ lượt đọc đang dở, tránh chồng tiếng.
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  // Chậm hơn bình thường một chút cho người học nghe rõ.
  utterance.rate = 0.85;

  // getVoices() có thể rỗng ở lần gọi đầu vì giọng nạp bất đồng bộ;
  // lúc đó cứ để trình duyệt tự chọn theo lang.
  const voice = window.speechSynthesis
    .getVoices()
    .find((item) => item.lang.replace("_", "-").toLowerCase().startsWith("en"));
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
  return true;
}