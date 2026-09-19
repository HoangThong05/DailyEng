"use client";

import { useActionState, useState } from "react";
import { deleteAccount, type DeleteState } from "./delete-actions";

const EMPTY: DeleteState = {};
const CONFIRM_WORD = "XOA";

/** Xóa tài khoản: gập lại mặc định, mở ra phải gõ chữ xác nhận mới bấm được. */
export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [state, formAction, pending] = useActionState(deleteAccount, EMPTY);

  const ready = confirm.trim().toUpperCase() === CONFIRM_WORD;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-13 w-full items-center rounded-2xl px-4 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/5"
      >
        Xóa tài khoản
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-2xl bg-red-500/5 p-4"
    >
      <p className="text-sm font-semibold text-red-500">Xóa tài khoản vĩnh viễn</p>
      <p className="text-muted text-sm">
        Toàn bộ tiến độ học, bộ từ riêng, huy hiệu và XP sẽ bị xóa, không khôi
        phục được. Gõ <span className="text-fg font-semibold">{CONFIRM_WORD}</span>{" "}
        để xác nhận.
      </p>
      <input
        name="confirm"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        autoComplete="off"
        autoCapitalize="characters"
        placeholder={CONFIRM_WORD}
        aria-label="Gõ chữ xác nhận"
        className="border-border bg-card placeholder:text-muted/70 min-h-11 w-full rounded-xl border px-4 text-base uppercase outline-none focus:border-red-500"
      />
      {state.error ? (
        <p role="alert" className="text-sm font-medium text-red-500">
          {state.error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirm("");
          }}
          className="border-border min-h-11 flex-1 rounded-xl border text-sm font-semibold press"
        >
          Thôi
        </button>
        <button
          type="submit"
          disabled={!ready || pending}
          className="min-h-11 flex-1 rounded-xl bg-red-500 text-sm font-semibold text-white press disabled:opacity-50"
        >
          {pending ? "Đang xóa…" : "Xóa vĩnh viễn"}
        </button>
      </div>
    </form>
  );
}
