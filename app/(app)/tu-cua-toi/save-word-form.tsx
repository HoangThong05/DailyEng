"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveMyWord, type SaveWordState } from "./actions";

const EMPTY: SaveWordState = {};

const FIELD_CLASS =
  "border-border bg-card placeholder:text-muted/70 focus:border-brand min-h-11 w-full rounded-xl border px-3.5 text-base outline-none";

/**
 * Ô lưu nhanh: chỉ cần từ + nghĩa. Muốn thêm phiên âm / câu ví dụ thì mở
 * "Thêm chi tiết". Lưu xong form tự trống để gõ từ kế tiếp.
 */
export function SaveWordForm() {
  const [state, formAction, pending] = useActionState(saveMyWord, EMPTY);
  const [more, setMore] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const termRef = useRef<HTMLInputElement>(null);
  const lastNotice = useRef<string | undefined>(undefined);

  // Lưu thành công (notice mới) → xoá form, đưa con trỏ về ô từ.
  useEffect(() => {
    if (state.notice && state.notice !== lastNotice.current) {
      lastNotice.current = state.notice;
      formRef.current?.reset();
      termRef.current?.focus();
    }
  }, [state.notice]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="border-border bg-card space-y-3 rounded-2xl border p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          ref={termRef}
          name="term"
          required
          maxLength={80}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Từ tiếng Anh"
          aria-label="Từ tiếng Anh"
          className={FIELD_CLASS}
        />
        <input
          name="meaning_vi"
          required
          maxLength={200}
          autoComplete="off"
          placeholder="Nghĩa tiếng Việt"
          aria-label="Nghĩa tiếng Việt"
          className={FIELD_CLASS}
        />
      </div>

      {more ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            name="phonetic"
            maxLength={200}
            autoComplete="off"
            placeholder="Phiên âm /.../"
            aria-label="Phiên âm"
            className={FIELD_CLASS}
          />
          <input
            name="example_en"
            maxLength={200}
            autoComplete="off"
            placeholder="Câu ví dụ tiếng Anh"
            aria-label="Câu ví dụ tiếng Anh"
            className={FIELD_CLASS}
          />
          <input
            name="example_vi"
            maxLength={200}
            autoComplete="off"
            placeholder="Dịch câu ví dụ"
            aria-label="Dịch câu ví dụ"
            className={FIELD_CLASS}
          />
        </div>
      ) : null}

      {state.error ? (
        <p role="alert" className="text-sm font-medium text-red-500">
          {state.error}
        </p>
      ) : null}
      {state.notice ? (
        <p role="status" className="text-brand text-sm font-medium">
          {state.notice}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMore((value) => !value)}
          className="text-muted min-h-10 rounded-lg px-2 text-sm font-medium"
        >
          {more ? "Bớt chi tiết" : "Thêm chi tiết"}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="bg-brand ml-auto min-h-11 rounded-xl px-5 text-sm font-semibold text-white press disabled:opacity-60"
        >
          {pending ? "Đang lưu…" : "Lưu từ"}
        </button>
      </div>
    </form>
  );
}
