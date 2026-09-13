"use client";

import { useState } from "react";

const TWEMOJI_BASE =
  "https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg";

/**
 * Emoji → tên file Twemoji: code point nối bằng "-". Thường bỏ FE0F (biến
 * thể trình bày), một số ít emoji lại cần giữ — thử bỏ trước, lỗi thì giữ.
 */
function codepoints(emoji: string, keepFe0f: boolean) {
  return [...emoji]
    .map((char) => char.codePointAt(0)!)
    .filter((code) => keepFe0f || code !== 0xfe0f)
    .map((code) => code.toString(16))
    .join("-");
}

export function twemojiUrl(emoji: string, keepFe0f = false) {
  return `${TWEMOJI_BASE}/${codepoints(emoji, keepFe0f)}.svg`;
}

type Props = { emoji: string; size: number; className?: string };

/**
 * Vẽ emoji bằng ảnh Twemoji để mọi máy nhìn giống nhau (emoji hệ thống trên
 * Windows khá xấu và thiếu). Tải lỗi hai lần thì rơi về emoji chữ.
 */
export function EmojiImage({ emoji, size, className = "" }: Props) {
  // 0: bỏ FE0F, 1: giữ FE0F, 2: emoji chữ
  const [attempt, setAttempt] = useState(0);

  if (attempt >= 2) {
    return (
      <span
        aria-hidden
        className={className}
        style={{ fontSize: size * 0.8, lineHeight: 1 }}
      >
        {emoji}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG ngoài, next/image không tối ưu thêm được
    <img
      src={twemojiUrl(emoji, attempt === 1)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      draggable={false}
      onError={() => setAttempt((value) => value + 1)}
      className={`select-none ${className}`}
    />
  );
}
