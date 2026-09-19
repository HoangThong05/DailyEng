"use client";

import { useActionState } from "react";
import { requestReset, type ForgotState } from "./actions";

const EMPTY: ForgotState = {};

const FIELD_CLASS =
  "border-border bg-card placeholder:text-muted/70 focus:border-brand min-h-12 w-full rounded-xl border px-4 text-base outline-none";

export function ForgotForm() {
  const [state, formAction, pending] = useActionState(requestReset, EMPTY);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          placeholder="ban@email.com"
          className={FIELD_CLASS}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm font-medium text-red-500">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="bg-brand min-h-12 w-full rounded-xl text-base font-semibold text-white press disabled:opacity-60"
      >
        {pending ? "Đang gửi…" : "Gửi mã"}
      </button>
    </form>
  );
}
