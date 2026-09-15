"use client";

import { useRef, useState, useTransition } from "react";
import { clearProfileImage, uploadProfileImage } from "./actions";

type Props = {
  kind: "avatar" | "cover";
  hasImage: boolean;
};

/**
 * Thu nhỏ ảnh ngay trên trình duyệt (canvas) rồi gửi lên server action.
 * Avatar: vuông 256px. Bìa: 1200×400. Ra WebP nhẹ nên upload nhanh và
 * không vướng giới hạn kích thước body của server action.
 */
async function shrink(file: File, kind: "avatar" | "cover"): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const target = kind === "avatar" ? { w: 256, h: 256 } : { w: 1200, h: 400 };
  const scale = Math.max(target.w / bitmap.width, target.h / bitmap.height);
  const sw = target.w / scale;
  const sh = target.h / scale;
  const sx = (bitmap.width - sw) / 2;
  const sy = (bitmap.height - sh) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = target.w;
  canvas.height = target.h;
  canvas.getContext("2d")!.drawImage(bitmap, sx, sy, sw, sh, 0, 0, target.w, target.h);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Không xử lý được ảnh"))),
      "image/webp",
      0.86,
    );
  });
}

export function ImagePicker({ kind, hasImage }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function pick() {
    inputRef.current?.click();
  }

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    let blob: Blob;
    try {
      blob = await shrink(file, kind);
    } catch {
      setError("Không đọc được ảnh này.");
      return;
    }
    const formData = new FormData();
    formData.set("file", new File([blob], `${kind}.webp`, { type: "image/webp" }));
    startTransition(async () => {
      const result = await uploadProfileImage(kind, formData);
      if (!result.ok) setError(result.error);
    });
  }

  function clear() {
    setError(null);
    startTransition(async () => {
      const result = await clearProfileImage(kind);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
        aria-label={kind === "avatar" ? "Chọn ảnh đại diện" : "Chọn ảnh bìa"}
      />
      <button
        type="button"
        onClick={pick}
        disabled={pending}
        className="bg-brand-soft text-brand min-h-10 rounded-xl px-4 text-sm font-semibold press disabled:opacity-60"
      >
        {pending ? "Đang tải…" : kind === "avatar" ? "Tải ảnh đại diện" : "Tải ảnh bìa"}
      </button>
      {hasImage ? (
        <button
          type="button"
          onClick={clear}
          disabled={pending}
          className="border-border text-muted min-h-10 rounded-xl border px-4 text-sm font-semibold press disabled:opacity-60"
        >
          {kind === "avatar" ? "Dùng vịt" : "Dùng màu"}
        </button>
      ) : null}
      {error ? <span className="text-sm text-red-500">{error}</span> : null}
    </div>
  );
}
