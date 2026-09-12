"use client";

import { useTransition } from "react";
import { deleteDeck } from "./actions";

type Props = { deckId: string; deckName: string };

export function DeleteDeckButton({ deckId, deckName }: Props) {
  const [pending, startTransition] = useTransition();

  function confirmAndDelete() {
    const ok = window.confirm(
      `Xoá bộ "${deckName}"? Toàn bộ từ và tiến độ học của bộ này sẽ mất.`,
    );
    if (!ok) return;
    startTransition(() => deleteDeck(deckId));
  }

  return (
    <button
      type="button"
      onClick={confirmAndDelete}
      disabled={pending}
      className="border-border min-h-12 w-full rounded-xl border text-base font-semibold text-red-500 press disabled:opacity-60"
    >
      {pending ? "Đang xoá…" : "Xoá bộ từ"}
    </button>
  );
}
