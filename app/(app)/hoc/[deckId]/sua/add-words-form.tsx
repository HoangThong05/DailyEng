"use client";

import { useActionState } from "react";
import { FORMAT_HINT } from "@/lib/word-import";
import { addWords, type AddWordsState } from "./actions";

const EMPTY: AddWordsState = {};

const PLACEHOLDER = `resilient = kiên cường
outcome = kết quả
thorough = kỹ lưỡng`;

export function AddWordsForm({ deckId }: { deckId: string }) {
  const [state, formAction, pending] = useActionState(
    addWords.bind(null, deckId),
    EMPTY,
  );

  return (
    <form action={formAction} className="space-y-3">
      {/* Đổi key khi thêm xong để textarea tự trống, sẵn sàng dán đợt tiếp. */}
      <textarea
        key={state.notice}
        name="words"
        required
        rows={6}
        spellCheck={false}
        autoCapitalize="none"
        placeholder={PLACEHOLDER}
        aria-label="Danh sách từ cần thêm"
        className="border-border bg-card placeholder:text-muted/70 focus:border-brand w-full resize-y rounded-xl border p-4 text-base leading-relaxed outline-none"
      />
      <p className="text-muted text-sm">{FORMAT_HINT}</p>

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
        className="bg-brand min-h-12 w-full rounded-xl text-base font-semibold text-white press disabled:opacity-60"
      >
        {pending ? "Đang thêm…" : "Thêm vào bộ"}
      </button>
    </form>
  );
}
