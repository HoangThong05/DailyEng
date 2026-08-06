"use client";

import { useActionState, useState } from "react";
import { authenticate, type AuthState } from "./actions";

const EMPTY: AuthState = {};

export function AuthForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, formAction, pending] = useActionState(authenticate, EMPTY);

  const isSignup = mode === "signup";

  return (
    <div className="space-y-5">
      {/* Chuyển giữa Đăng nhập / Đăng ký */}
      <div
        role="tablist"
        aria-label="Chọn đăng nhập hoặc đăng ký"
        className="bg-brand-soft flex rounded-xl p-1"
      >
        {(
          [
            ["signin", "Đăng nhập"],
            ["signup", "Đăng ký"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={`min-h-11 flex-1 rounded-lg text-sm font-semibold transition-colors ${
              mode === value ? "bg-card text-fg shadow-sm" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="next" value={next} />

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            placeholder="ban@email.com"
            className="border-border bg-card placeholder:text-muted/70 focus:border-brand min-h-12 w-full rounded-xl border px-4 text-base outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium">
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder={isSignup ? "Ít nhất 6 ký tự" : "••••••••"}
            className="border-border bg-card placeholder:text-muted/70 focus:border-brand min-h-12 w-full rounded-xl border px-4 text-base outline-none"
          />
        </div>

        {state.error ? (
          <p role="alert" className="text-sm font-medium text-red-500">
            {state.error}
          </p>
        ) : null}

        {state.notice ? (
          <p
            role="status"
            className="bg-brand-soft text-fg rounded-xl px-4 py-3 text-sm"
          >
            {state.notice}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="bg-brand min-h-12 w-full rounded-xl text-base font-semibold text-white transition-transform duration-100 active:scale-[0.98] disabled:opacity-60"
        >
          {pending
            ? "Đang xử lý…"
            : isSignup
              ? "Tạo tài khoản"
              : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
