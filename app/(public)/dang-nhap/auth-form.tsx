"use client";

import { useActionState, useState } from "react";
import { EyeIcon, EyeOffIcon, GoogleIcon } from "@/app/_components/icons";
import { authenticate, signInWithGoogle, type AuthState } from "./actions";
import { GoogleSignIn } from "./google-signin";

const EMPTY: AuthState = {};

const FIELD_CLASS =
  "border-border bg-card placeholder:text-muted/70 focus:border-brand min-h-12 w-full rounded-xl border px-4 text-base outline-none";

export function AuthForm({ next, googleClientId }: { next: string; googleClientId: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, formAction, pending] = useActionState(authenticate, EMPTY);

  const isSignup = mode === "signup";
  // Chỉ báo lệch khi người dùng đã gõ gì đó, để không nhắc ngay lúc ô còn trống.
  const mismatch = isSignup && confirm.length > 0 && password !== confirm;

  function switchMode(value: "signin" | "signup") {
    setMode(value);
    setConfirm("");
  }

  return (
    <div className="space-y-5">
      {/* Có client ID thì dùng nút chạy tại chỗ (Google hiện tên miền của app);
          thiếu thì lui về luồng chuyển hướng qua Supabase. */}
      {googleClientId ? (
        <GoogleSignIn clientId={googleClientId} next={next} />
      ) : (
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="border-border bg-card flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border text-base font-semibold press"
          >
            <GoogleIcon className="h-5 w-5" />
            Tiếp tục với Google
          </button>
        </form>
      )}

      <div className="flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted text-xs">hoặc dùng email</span>
        <span className="bg-border h-px flex-1" />
      </div>

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
            onClick={() => switchMode(value)}
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
            className={FIELD_CLASS}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder={isSignup ? "Ít nhất 6 ký tự" : "••••••••"}
              className={`${FIELD_CLASS} pr-14`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={showPassword}
              className="text-muted absolute top-1/2 right-1 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg transition-transform duration-100 active:scale-90"
            >
              {showPassword ? (
                <EyeOffIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {isSignup ? (
          <div className="space-y-1.5">
            <label htmlFor="confirm" className="block text-sm font-medium">
              Nhập lại mật khẩu
            </label>
            <input
              id="confirm"
              name="confirm"
              type={showPassword ? "text" : "password"}
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              placeholder="Gõ lại mật khẩu ở trên"
              aria-invalid={mismatch}
              className={`${FIELD_CLASS} ${mismatch ? "border-red-500" : ""}`}
            />
            {mismatch ? (
              <p className="text-sm font-medium text-red-500">
                Hai mật khẩu chưa khớp nhau.
              </p>
            ) : null}
          </div>
        ) : null}

        {state.error ? (
          <p role="alert" className="text-sm font-medium text-red-500">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || mismatch}
          className="bg-brand min-h-12 w-full rounded-xl text-base font-semibold text-white press disabled:opacity-60"
        >
          {pending ? "Đang xử lý…" : isSignup ? "Tạo tài khoản" : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}