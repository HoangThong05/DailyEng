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

type ToneOptions = {
  type: OscillatorType;
  fromHz: number;
  toHz?: number;
  seconds: number;
  volume: number;
  /** Trễ trước khi phát, để xếp nhiều nốt nối tiếp nhau. */
  delay?: number;
  /** Lọc bớt tần số cao cho tiếng dịu, không chói. */
  lowpassHz?: number;
};

/**
 * Một nốt: âm lượng lên nhanh (vài ms, tránh tiếng "tách" lúc bắt đầu) rồi
 * tắt dần theo hàm mũ, tần số trượt từ fromHz tới toHz.
 */
function tone({
  type,
  fromHz,
  toHz = fromHz,
  seconds,
  volume,
  delay = 0,
  lowpassHz,
}: ToneOptions) {
  const ctx = getContext();
  if (!ctx || ctx.state !== "running") return;

  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(fromHz, start);
  osc.frequency.exponentialRampToValueAtTime(toHz, start + seconds);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);

  let chain: AudioNode = osc;
  if (lowpassHz) {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = lowpassHz;
    chain = chain.connect(filter);
  }
  chain.connect(gain).connect(ctx.destination);

  osc.start(start);
  osc.stop(start + seconds + 0.02);
}

/** Tiếng "piu" mềm khi bắn một viên: sóng tam giác trượt xuống, đã lọc. */
export function playShot() {
  tone({
    type: "triangle",
    fromHz: 1100,
    toHz: 420,
    seconds: 0.09,
    volume: 0.07,
    lowpassHz: 2400,
  });
}

/**
 * Hạ mục tiêu: một cú "bụp" trầm mềm + hai nốt chuông đi lên (E5 → A5)
 * cho cảm giác được thưởng, thay vì tiếng nổ nhiễu thô.
 */
export function playExplosion() {
  const ctx = getContext();
  if (!ctx || ctx.state !== "running") return;

  // Bụp: nhiễu ngắn lọc rất thấp, nghe như tiếng trống mềm.
  const seconds = 0.18;
  const buffer = ctx.createBuffer(
    1,
    Math.ceil(ctx.sampleRate * seconds),
    ctx.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(500, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + seconds);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();

  tone({ type: "sine", fromHz: 150, toHz: 60, seconds: 0.2, volume: 0.16 });

  // Chuông thưởng.
  tone({ type: "triangle", fromHz: 659, seconds: 0.16, volume: 0.07, lowpassHz: 3000 });
  tone({
    type: "triangle",
    fromHz: 880,
    seconds: 0.28,
    volume: 0.07,
    delay: 0.09,
    lowpassHz: 3000,
  });
}

/** Để giọt chạm đáy: nốt trầm mềm đi xuống, không rè. */
export function playMiss() {
  tone({
    type: "sine",
    fromHz: 320,
    toHz: 110,
    seconds: 0.35,
    volume: 0.12,
  });
}

/** Trả lời đúng: hai nốt chuông ngắn đi lên (C5 → G5). */
export function playCorrect() {
  tone({ type: "sine", fromHz: 523, seconds: 0.12, volume: 0.08, lowpassHz: 3000 });
  tone({
    type: "sine",
    fromHz: 784,
    seconds: 0.18,
    volume: 0.08,
    delay: 0.1,
    lowpassHz: 3000,
  });
}

/** Combo: ba nốt đi lên, cao dần theo mức combo (tối đa +1 quãng). */
export function playCombo(level: number) {
  const base = 523 * Math.min(2, 1 + (level - 2) * 0.12);
  [1, 1.25, 1.5].forEach((ratio, i) => {
    tone({
      type: "triangle",
      fromHz: base * ratio,
      seconds: 0.11,
      volume: 0.07,
      delay: i * 0.08,
      lowpassHz: 3500,
    });
  });
}
