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
/** Giải mã ảnh: createImageBitmap nhanh nhưng vài trình duyệt/định dạng không hỗ trợ → thử <img>. */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Server action nhận tối đa ~1 MB; chừa dư cho phần bao FormData. */
const MAX_BYTES = 800_000;

async function shrink(file: File, kind: "avatar" | "cover"): Promise<Blob> {
  const source = await decode(file);
  const bitmap = {
    width: source.width,
    height: source.height,
  };
  const target = kind === "avatar" ? { w: 256, h: 256 } : { w: 1200, h: 400 };
  const scale = Math.max(target.w / bitmap.width, target.h / bitmap.height);
  const sw = target.w / scale;
  const sh = target.h / scale;
  const sx = (bitmap.width - sw) / 2;
  const sy = (bitmap.height - sh) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = target.w;
  canvas.height = target.h;
  canvas.getContext("2d")!.drawImage(source, sx, sy, sw, sh, 0, 0, target.w, target.h);
  if ("close" in source) source.close();

  // WebP trước; trình duyệt không xuất được WebP (trả PNG to) hoặc file vẫn
  // nặng thì hạ chất lượng rồi chuyển JPEG cho chắc dưới giới hạn.
  const attempts: [string, number][] = [
    ["image/webp", 0.86],
    ["image/webp", 0.7],
    ["image/jpeg", 0.85],
    ["image/jpeg", 0.7],
  ];
  let last: Blob | null = null;
  for (const [type, quality] of attempts) {
    const blob = await toBlob(canvas, type, quality);
    if (!blob || blob.type !== type) continue;
    last = blob;
    if (blob.size <= MAX_BYTES) return blob;
  }
  if (last) return last;
  throw new Error("Không xử lý được ảnh");
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
    const ext = blob.type === "image/jpeg" ? "jpg" : "webp";
    const formData = new FormData();
    formData.set("file", new File([blob], `${kind}.${ext}`, { type: blob.type }));
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
