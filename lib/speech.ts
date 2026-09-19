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

const VOICE_KEY = "dailyeng:voice";

/** Tên giọng người dùng đã chọn ở tab Cá nhân; null = để app tự chọn. */
export function readVoicePreference(): string | null {
  try {
    return localStorage.getItem(VOICE_KEY);
  } catch {
    return null;
  }
}

export function saveVoicePreference(name: string | null) {
  try {
    if (name) localStorage.setItem(VOICE_KEY, name);
    else localStorage.removeItem(VOICE_KEY);
  } catch {
    // Chế độ riêng tư có thể chặn; chỉ mất ghi nhớ giữa các lần mở.
  }
}

function isEnglish(voice: SpeechSynthesisVoice) {
  return voice.lang.replace("_", "-").toLowerCase().startsWith("en");
}

/**
 * Điểm chất lượng ước lượng theo tên: giọng "Natural"/"Online" của Edge,
 * "Google" của Chrome, Samantha/Karen của Apple nghe tự nhiên; giọng
 * Microsoft David/Zira cũ nghe như robot nên xếp cuối.
 */
function voiceQuality(voice: SpeechSynthesisVoice) {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.replace("_", "-").toLowerCase();
  let score = 0;
  if (name.includes("natural") || name.includes("online")) score += 50;
  if (name.includes("google")) score += 40;
  if (/aria|jenny|guy|samantha|karen|daniel|moira|ava|allison/.test(name)) score += 30;
  if (name.includes("premium") || name.includes("enhanced")) score += 20;
  if (lang === "en-us") score += 10;
  else if (lang === "en-gb") score += 6;
  if (/david|zira|mark|hazel|george/.test(name) && !name.includes("natural")) score -= 20;
  if (!voice.localService) score += 5; // giọng đám mây thường tốt hơn
  return score;
}

/** Giọng tiếng Anh máy có, tốt nhất xếp trước. Rỗng nếu chưa nạp xong. */
export function listEnglishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis
    .getVoices()
    .filter(isEnglish)
    .sort((a, b) => voiceQuality(b) - voiceQuality(a));
}

/** Giọng sẽ dùng: giọng người dùng chọn nếu còn, không thì giọng tốt nhất. */
export function pickVoice(): SpeechSynthesisVoice | null {
  const voices = listEnglishVoices();
  if (voices.length === 0) return null;
  const preferred = readVoicePreference();
  return voices.find((voice) => voice.name === preferred) ?? voices[0];
}

/**
 * Lượt đọc đang chờ khởi động. Bấm loa liên tục thì chỉ lượt cuối được đọc,
 * các lượt trước bị huỷ trước khi kịp phát.
 */
let queued: number | null = null;

/**
 * Chrome có hai tật:
 *  1. Gọi speak() ngay sau cancel() thì câu mới bị nuốt (không phát, không
 *     báo lỗi). Phải chờ một nhịp ngắn giữa hai lệnh.
 *  2. Đôi khi engine kẹt ở trạng thái "paused" sau khi chuyển tab; resume()
 *     trước khi đọc để chắc ăn.
 */
function speakNow(utterance: SpeechSynthesisUtterance) {
  const synth = window.speechSynthesis;
  const fire = () => {
    queued = null;
    const voice = pickVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    synth.resume();
    synth.speak(utterance);
  };

  if (queued !== null) clearTimeout(queued);
  if (synth.speaking || synth.pending) {
    synth.cancel();
    queued = window.setTimeout(fire, 90);
  } else {
    fire();
  }
}

/** Đọc to một đoạn tiếng Anh. Trả về false nếu trình duyệt không đọc được. */
export function speak(text: string, lang = "en-US", rate = 0.92): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  // Hơi chậm hơn bình thường cho người học nghe rõ; nút "Đọc chậm" truyền
  // rate thấp hơn nữa. Giọng tự nhiên đọc 0.92 nghe vẫn trôi chảy.
  utterance.rate = rate;

  // Chrome nạp danh sách giọng bất đồng bộ: lần gọi đầu getVoices() có thể
  // rỗng → chờ voiceschanged (tối đa 400ms) rồi mới đọc, để ngay câu đầu
  // đã đúng giọng đã chọn thay vì giọng mặc định.
  if (window.speechSynthesis.getVoices().length === 0) {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      window.speechSynthesis.removeEventListener("voiceschanged", go);
      speakNow(utterance);
    };
    window.speechSynthesis.addEventListener("voiceschanged", go);
    setTimeout(go, 400);
  } else {
    speakNow(utterance);
  }
  return true;
}

/** Gọi sớm khi app mở để trình duyệt bắt đầu nạp danh sách giọng. */
export function warmUpVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.getVoices();
}

/**
 * Đọc một đoạn và chờ đọc xong (để nối tiếp nhiều đoạn, ví dụ Part 2:
 * câu hỏi rồi A, B, C). Bị huỷ giữa chừng cũng resolve, không treo.
 */
export function speakAsync(text: string, rate = 0.92): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    utterance.onend = done;
    utterance.onerror = done;
    speakNow(utterance);
    // Vài trình duyệt không bắn onend khi bị cancel — chốt chặn theo độ dài.
    setTimeout(done, 1500 + (text.length * 90) / rate);
  });
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    if (queued !== null) clearTimeout(queued);
    queued = null;
    window.speechSynthesis.cancel();
  }
}

/** Nghỉ một nhịp giữa các đoạn đọc. */
export function pause(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
