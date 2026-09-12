"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { resendCode, verifyCode, type VerifyState } from "./actions";

const EMPTY: VerifyState = {};
const CODE_LENGTH = 6;

export function CodeForm({ email }: { email: string }) {
  const [code, setCode] = useState("");
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyCode,
    EMPTY,
  );
  const [resendState, resendAction, resending] = useActionState(
    resendCode,
    EMPTY,
  );

  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Mã đã tự gửi rồi, để mã sai không bị gửi lại thành vòng lặp. */
  const autoSubmitted = useRef("");

  // Gõ/dán đủ số là gửi luôn, khỏi phải với tay bấm nút.
  useEffect(() => {
    if (code.length === CODE_LENGTH && autoSubmitted.current !== code) {
      autoSubmitted.current = code;
      formRef.current?.requestSubmit();
    }
  }, [code]);

  const error = verifyState.error ?? resendState.error;

  return (
    <div className="space-y-5">
      <form ref={formRef} action={verifyAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />

        {/* Ô nhập thật nằm trong suốt đè lên 6 khung bên dưới:
            vẫn dán được, vẫn tự điền được, mà nhìn như 6 ô riêng. */}
        <div
          className="relative"
          onClick={() => inputRef.current?.focus()}
          role="presentation"
        >
          <input
            ref={inputRef}
            id="code"
            name="code"
            value={code}
            onChange={(event) =>
              setCode(
                event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH),
              )
            }
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={CODE_LENGTH}
            aria-label="Mã xác nhận 6 chữ số"
            aria-invalid={Boolean(verifyState.error)}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          />

          <div aria-hidden className="flex justify-between gap-2">
            {Array.from({ length: CODE_LENGTH }, (_, index) => {
              const active = index === Math.min(code.length, CODE_LENGTH - 1);
              return (
                <div
                  key={index}
                  className={`bg-card flex h-14 flex-1 items-center justify-center rounded-xl border text-2xl font-semibold tabular-nums transition-colors ${
                    active && code.length < CODE_LENGTH
                      ? "border-brand"
                      : "border-border"
                  }`}
                >
                  {code[index] ?? ""}
                </div>
              );
            })}
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-sm font-medium text-red-500">
            {error}
          </p>
        ) : null}

        {resendState.notice ? (
          <p
            role="status"
            className="bg-brand-soft text-fg rounded-xl px-4 py-3 text-sm"
          >
            {resendState.notice}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={verifying || code.length < CODE_LENGTH}
          className="bg-brand min-h-12 w-full rounded-xl text-base font-semibold text-white press disabled:opacity-60"
        >
          {verifying ? "Đang kiểm tra…" : "Xác nhận"}
        </button>
      </form>

      <form action={resendAction}>
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          disabled={resending}
          className="text-muted min-h-11 w-full text-sm font-medium disabled:opacity-60"
        >
          {resending ? "Đang gửi…" : "Không nhận được mã? Gửi lại"}
        </button>
      </form>
    </div>
  );
}