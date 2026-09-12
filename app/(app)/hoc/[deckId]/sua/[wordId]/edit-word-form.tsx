"use client";

import { useActionState } from "react";
import type { Word } from "@/lib/database.types";
import { updateWord, type EditWordState } from "../actions";

const EMPTY: EditWordState = {};

const INPUT_CLASS =
  "border-border bg-card placeholder:text-muted/70 focus:border-brand min-h-12 w-full rounded-xl border px-4 text-base outline-none";

type FieldProps = {
  id: keyof Word;
  label: string;
  defaultValue: string | null;
  placeholder?: string;
  required?: boolean;
  hint?: string;
};

function Field({ id, label, defaultValue, placeholder, required, hint }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required ? null : (
          <span className="text-muted font-normal"> (không bắt buộc)</span>
        )}
      </label>
      <input
        id={id}
        name={id}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        maxLength={200}
        spellCheck={false}
        autoCapitalize="none"
        className={INPUT_CLASS}
      />
      {hint ? <p className="text-muted text-sm">{hint}</p> : null}
    </div>
  );
}

export function EditWordForm({ deckId, word }: { deckId: string; word: Word }) {
  const [state, formAction, pending] = useActionState(
    updateWord.bind(null, deckId, word.id),
    EMPTY,
  );

  return (
    <form action={formAction} className="space-y-4 px-5 pt-2 pb-4">
      <Field id="term" label="Từ" defaultValue={word.term} required />
      <Field
        id="meaning_vi"
        label="Nghĩa"
        defaultValue={word.meaning_vi}
        required
      />
      <Field
        id="phonetic"
        label="Phiên âm"
        defaultValue={word.phonetic}
        placeholder="/rɪˈzɪliənt/"
        hint="Hiện dưới từ trên thẻ và trong quiz."
      />
      <Field
        id="example_en"
        label="Câu ví dụ"
        defaultValue={word.example_en}
        placeholder="She is resilient in the face of failure."
        hint="Hiện ở mặt sau thẻ, giúp nhớ cách dùng."
      />
      <Field
        id="example_vi"
        label="Dịch câu ví dụ"
        defaultValue={word.example_vi}
        placeholder="Cô ấy kiên cường trước thất bại."
      />

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
        {pending ? "Đang lưu…" : "Lưu thay đổi"}
      </button>
    </form>
  );
}
