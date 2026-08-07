"use client";

import { useActionState } from "react";
import { createDeck, type CreateDeckState } from "./actions";

const EMPTY: CreateDeckState = {};

const PLACEHOLDER = `resilient = kiên cường
outcome = kết quả
thorough = kỹ lưỡng`;

export function CreateDeckForm() {
  const [state, formAction, pending] = useActionState(createDeck, EMPTY);

  return (
    <form action={formAction} className="space-y-4 px-5 pt-2">
      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-sm font-medium">
          Tên bộ từ
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={80}
          placeholder="Ví dụ: Từ vựng phim ảnh"
          className="border-border bg-card placeholder:text-muted/70 focus:border-brand min-h-12 w-full rounded-xl border px-4 text-base outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium">
          Mô tả <span className="text-muted font-normal">(không bắt buộc)</span>
        </label>
        <input
          id="description"
          name="description"
          maxLength={160}
          placeholder="Vài chữ cho dễ nhớ"
          className="border-border bg-card placeholder:text-muted/70 focus:border-brand min-h-12 w-full rounded-xl border px-4 text-base outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="words" className="block text-sm font-medium">
          Danh sách từ
        </label>
        <p className="text-muted text-sm">
          Mỗi dòng một từ, viết theo dạng{" "}
          <span className="text-fg font-medium">word = nghĩa</span>.
        </p>
        <textarea
          id="words"
          name="words"
          required
          rows={10}
          spellCheck={false}
          autoCapitalize="none"
          placeholder={PLACEHOLDER}
          className="border-border bg-card placeholder:text-muted/70 focus:border-brand w-full resize-y rounded-xl border p-4 text-base leading-relaxed outline-none"
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
        className="bg-brand min-h-12 w-full rounded-xl text-base font-semibold text-white transition-transform duration-100 active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Đang tạo…" : "Tạo bộ từ"}
      </button>
    </form>
  );
}