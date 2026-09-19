"use client";

import { useActionState, useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/app/_components/icons";
import { updatePassword, type PasswordState } from "./actions";

const EMPTY: PasswordState = {};

const FIELD_CLASS =
  "border-border bg-card placeholder:text-muted/70 focus:border-brand min-h-12 w-full rounded-xl border px-4 text-base outline-none";

export function PasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, formAction, pending] = useActionState(updatePassword, EMPTY);

  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium">
          Mật khẩu mới
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoFocus
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Ít nhất 6 ký tự"
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
        {pending ? "Đang lưu…" : "Lưu mật khẩu"}
      </button>
    </form>
  );
}
