/**
 * Âm thanh cho trò chơi, tổng hợp bằng Web Audio API nên không cần file mp3.
 *
 * AudioContext chỉ được tạo/mở sau một cú chạm của người dùng (trình duyệt
 * chặn phát tiếng tự động), vì thế gọi unlockAudio() trong handler nút
 * "Bắt đầu" trước khi phát bất cứ gì.
 */

const SOUND_KEY = "dailyeng:sound";

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  return context;
}

/** Gọi trong một handler chạm/bấm để trình duyệt cho phép phát tiếng. */
export function unlockAudio() {
  const ctx = getContext();
  if (ctx?.state === "suspended") void ctx.resume();
}

export function readSoundPreference(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function saveSoundPreference(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, enabled ? "on" : "off");
  } catch {
    // Chế độ riêng tư có thể chặn; chỉ mất ghi nhớ giữa các lần mở.
  }
}

/** Một nốt oscillator trượt tần số rồi tắt dần. */
function tone(
  type: OscillatorType,
  fromHz: number,
  toHz: number,
  seconds: number,
  volume: number,
) {
  const ctx = getContext();
  if (!ctx || ctx.state !== "running") return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(fromHz, now);
  osc.frequency.exponentialRampToValueAtTime(toHz, now + seconds);

  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + seconds);
}

/** Tiếng "pew" ngắn khi bắn một viên. */
export function playShot() {
  tone("square", 900, 300, 0.08, 0.12);
}

/** Tiếng nổ: nhiễu trắng qua lọc thấp, tắt dần. */
export function playExplosion() {
  const ctx = getContext();
  if (!ctx || ctx.state !== "running") return;

  const seconds = 0.35;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    // Nhiễu giảm dần theo thời gian để tiếng nổ có "đuôi".
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1200, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + seconds);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.35, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);

  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();

  // Thêm một nốt trầm cho tiếng nổ có lực.
  tone("sine", 160, 40, 0.3, 0.25);
}

/** Tiếng trầm rè khi để giọt chạm đáy. */
export function playMiss() {
  tone("sawtooth", 220, 70, 0.35, 0.15);
}
