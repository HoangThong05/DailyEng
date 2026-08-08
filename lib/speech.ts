/**
 * Bọc Web Speech API cho gọn.
 *
 * lib.dom của TypeScript đã có SpeechRecognitionResultList nhưng chưa có
 * SpeechRecognition, nên phải tự khai báo phần còn thiếu.
 */

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
  recognition.maxAlternatives = 1;
  recognition.continuous = false;
  return recognition;
}

/** Trình duyệt có nhận dạng giọng nói hay không. Chỉ gọi được ở client. */
export function supportsRecognition(): boolean {
  if (typeof window === "undefined") return false;
  const speechWindow = window as SpeechWindow;
  return Boolean(
    speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition,
  );
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