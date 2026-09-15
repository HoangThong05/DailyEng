"use client";

import { useState, useTransition } from "react";
import { setFeedbackHandled } from "./actions";

export function HandledToggle({ id, handled: initial }: { id: string; handled: boolean }) {
  const [handled, setHandled] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !handled;
    setHandled(next);
    startTransition(async () => {
      const result = await setFeedbackHandled(id, next);
      if (!result.ok) setHandled(!next);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`min-h-9 rounded-lg px-3 text-xs font-semibold press disabled:opacity-60 ${
        handled ? "border-border text-muted border" : "bg-emerald-600 text-white"
      }`}
    >
      {handled ? "Mở lại" : "Đánh dấu đã xử lý"}
    </button>
  );
}
