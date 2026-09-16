"use client";

import Script from "next/script";
import { useRef, useState } from "react";
import { useEffectiveTheme } from "@/lib/theme-store";
import { signInWithGoogleIdToken } from "./actions";

/** Chỉ khai những gì mình dùng của thư viện Google Identity Services. */
type GoogleId = {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    nonce: string;
    use_fedcm_for_prompt?: boolean;
    auto_select?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "small" | "medium" | "large";
      shape?: "rectangular" | "pill";
      text?: "signin_with" | "continue_with";
      locale?: string;
      width?: number;
    },
  ) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

/** Chuỗi ngẫu nhiên + bản băm SHA-256 (hex) như Supabase yêu cầu. */
async function makeNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = btoa(String.fromCharCode(...bytes));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { raw, hashed };
}

/**
 * Nút "Đăng nhập bằng Google" chạy ngay trên trang này.
 *
 * Khác luồng chuyển hướng cũ (qua Supabase): Google hiện tên miền của app chứ
 * không phải địa chỉ dự án Supabase, và người dùng không phải rời trang. Token
 * Google trả về được gửi cho server action để Supabase xác thực và đặt cookie.
 */
export function GoogleSignIn({ clientId, next }: { clientId: string; next: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const nonceRef = useRef<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const theme = useEffectiveTheme();

  async function init() {
    const id = window.google?.accounts.id;
    const parent = boxRef.current;
    if (!id || !parent) return;

    const { raw, hashed } = await makeNonce();
    nonceRef.current = raw;

    id.initialize({
      client_id: clientId,
      nonce: hashed,
      use_fedcm_for_prompt: true,
      callback: async (response) => {
        setBusy(true);
        setError(null);
        const result = await signInWithGoogleIdToken(response.credential, nonceRef.current);
        if (result.ok) {
          // Dùng location thay vì router để server đọc lại cookie phiên mới.
          window.location.assign(next);
          return;
        }
        setBusy(false);
        setError(result.error);
      },
    });

    id.renderButton(parent, {
      type: "standard",
      theme: theme === "dark" ? "filled_black" : "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      locale: "vi",
      width: Math.min(400, parent.offsetWidth || 320),
    });
  }

  return (
    <div>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => void init()}
      />
      {/* Google tự vẽ nút vào đây; canh giữa cho khớp các nút khác của app */}
      <div ref={boxRef} className={`flex justify-center ${busy ? "pointer-events-none opacity-60" : ""}`} />
      {busy ? (
        <p className="text-muted mt-2 text-center text-sm">Đang đăng nhập…</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-center text-sm font-medium text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
