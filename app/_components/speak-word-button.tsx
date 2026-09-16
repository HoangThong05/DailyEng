"use client";

import { SpeakerIcon } from "./icons";
import { speak } from "@/lib/speech";

/** Nút loa nhỏ đọc một từ; dùng ở các danh sách từ. */
export function SpeakWordButton({ term }: { term: string }) {
  return (
    <button
      type="button"
      aria-label={`Nghe phát âm ${term}`}
      onClick={() => speak(term)}
      className="bg-brand-soft text-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-full press"
    >
      <SpeakerIcon className="h-4 w-4" />
    </button>
  );
}
