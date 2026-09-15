"use client";

import { useActionState } from "react";
import { Mascot } from "@/app/_components/mascot";
import { sendFeedback, type FeedbackState } from "./actions";

const EMPTY: FeedbackState = {};

export function FeedbackForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, formAction, pending] = useActionState(sendFeedback, EMPTY);

  if (state.sent) {
    return (
      <div className="border-border bg-card flex flex-col items-center rounded-3xl border p-8 text-center">
        <Mascot variant="an-mung" size={128} />
        <p className="mt-3 text-xl font-bold">Đã nhận, cảm ơn bạn!</p>
        <p className="text-muted mt-1 text-sm">
          Mình đọc mọi góp ý. Có email thì mình sẽ trả lời khi cần.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="border-border bg-card space-y-4 rounded-3xl border p-6"
    >
      <div className="space-y-1.5">
        <label htmlFor="message" className="block text-sm font-medium">
          Góp ý của bạn
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={5}
          maxLength={2000}
          rows={6}
          placeholder="Lỗi gặp phải, tính năng muốn có, bộ từ muốn thêm…"
          className="border-border bg-bg focus:border-brand w-full resize-y rounded-xl border px-4 py-3 text-base outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium">
          Email (không bắt buộc)
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultEmail}
          placeholder="Để mình trả lời bạn"
          className="border-border bg-bg focus:border-brand min-h-12 w-full rounded-xl border px-4 text-base outline-none"
        />
      </div>

      <input type="hidden" name="page" value="/gioi-thieu/gop-y" />

      {state.error ? (
        <p role="alert" className="text-sm font-medium text-red-500">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="bg-brand min-h-12 w-full rounded-xl font-semibold text-white press disabled:opacity-60"
      >
        {pending ? "Đang gửi…" : "Gửi góp ý"}
      </button>
    </form>
  );
}
