"use client";

import { useEffect, useState } from "react";
import { SpeakerIcon } from "@/app/_components/icons";
import {
  listEnglishVoices,
  readVoicePreference,
  saveVoicePreference,
  speak,
} from "@/lib/speech";

const SAMPLE = "The meeting has been postponed to next Thursday.";

/** Chọn giọng đọc tiếng Anh trong số giọng máy có; giọng tốt xếp trước. */
export function VoicePicker() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [chosen, setChosen] = useState<string>("");

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => {
      setVoices(listEnglishVoices());
      setChosen(readVoicePreference() ?? "");
    };
    // Chrome nạp giọng bất đồng bộ: lần đầu có thể rỗng, chờ voiceschanged.
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  function choose(name: string) {
    setChosen(name);
    saveVoicePreference(name || null);
    speak(SAMPLE);
  }

  if (voices.length === 0) {
    return (
      <div className="border-border bg-card rounded-2xl border p-4">
        <p className="font-medium">Giọng đọc</p>
        <p className="text-muted mt-1 text-sm">
          Trình duyệt chưa có giọng tiếng Anh, hoặc đang nạp.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border bg-card rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">Giọng đọc</p>
          <p className="text-muted mt-0.5 text-sm">
            Giọng có chữ “Natural” hoặc “Google” nghe tự nhiên nhất. Trên Windows,
            dùng Edge để có giọng Natural.
          </p>
        </div>
        <button
          type="button"
          onClick={() => speak(SAMPLE)}
          aria-label="Nghe thử"
          className="bg-brand-soft text-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-full press"
        >
          <SpeakerIcon className="h-5 w-5" />
        </button>
      </div>
      <select
        value={chosen}
        onChange={(event) => choose(event.target.value)}
        aria-label="Giọng đọc tiếng Anh"
        className="border-border bg-bg focus:border-brand mt-3 min-h-12 w-full rounded-xl border px-4 text-base outline-none"
      >
        <option value="">Tự chọn giọng tốt nhất ({voices[0].name})</option>
        {voices.map((voice) => (
          <option key={voice.name} value={voice.name}>
            {voice.name} · {voice.lang}
            {voice.localService ? " · nhanh, đọc máy" : " · tự nhiên, hơi trễ"}
          </option>
        ))}
      </select>
    </div>
  );
}
